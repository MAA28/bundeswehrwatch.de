import type {PageServerLoad} from './$types';
import {connectToMongoDB} from "#lib/server/db.ts";
import {error} from "@sveltejs/kit";
import type {BundeswehrEvent} from "#lib/events/bundeswehrEvent.ts";
import {parseEvent} from "#lib/events/parser.ts";

export const load: PageServerLoad = async (event) => {
    const client = await connectToMongoDB();
    if (!client) {
        error(503, "Failed to connect to database");
    }
    const raw_events = await client.db("bundeswehrwatch").collection("events").aggregate([
        {
            '$addFields': {
                '_von': {
                    '$dateFromString': {
                        'dateString': '$Zeitraum von',
                        'onError': null,
                        'onNull': null
                    }
                },
                '_bis': {
                    '$dateFromString': {
                        'dateString': '$Zeitraum bis',
                        'onError': null,
                        'onNull': null
                    }
                }
            }
        }, {
            '$match': {
                '$expr': {
                    '$let': {
                        'vars': {
                            'startOfDay': {
                                '$dateFromString': {
                                    'dateString': '2026-11-12T00:00:00+01:00'
                                }
                            },
                            'endOfDay': {
                                '$dateFromString': {
                                    'dateString': '2026-11-12T23:59:59.999+01:00'
                                }
                            }
                        },
                        'in': {
                            '$and': [
                                {
                                    '$lte': [
                                        {
                                            '$ifNull': [
                                                '$_von', '$_bis'
                                            ]
                                        }, '$$endOfDay'
                                    ]
                                }, {
                                    '$gte': [
                                        {
                                            '$ifNull': [
                                                '$_bis', '$_von'
                                            ]
                                        }, '$$startOfDay'
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        }, {
            '$project': {
                '_id': 0,
                '_von': 0,
                '_bis': 0,
                '_startOfDay': 0,
                '_endOfDay': 0

            }
        }
    ]).toArray();
    const current_events = raw_events.flatMap((e) => parseEvent(e) ?? []);

    const events_per_day = await client.db("bundeswehrwatch").collection("events").aggregate([
        {
            '$set': {
                '_start': {
                    '$dateFromString': {
                        'dateString': '$Zeitraum von',
                        'format': '%d.%m.%Y',
                        'onError': null,
                        'onNull': null
                    }
                },
                '_end': {
                    '$dateFromString': {
                        'dateString': '$Zeitraum bis',
                        'format': '%d.%m.%Y',
                        'onError': null,
                        'onNull': null
                    }
                }
            }
        }, {
            '$set': {
                '_today': {
                    '$dateTrunc': {
                        'date': '$$NOW',
                        'unit': 'day'
                    }
                },
                '_horizon': {
                    '$dateAdd': {
                        'startDate': {
                            '$dateTrunc': {
                                'date': '$$NOW',
                                'unit': 'day'
                            }
                        },
                        'unit': 'day',
                        'amount': 30
                    }
                }
            }
        }, {
            '$set': {
                '_rangeStart': {
                    '$cond': [
                        {
                            '$lt': [
                                '$_start', '$_today'
                            ]
                        }, '$_today', '$_start'
                    ]
                },
                '_rangeEnd': {
                    '$cond': [
                        {
                            '$gt': [
                                {
                                    '$ifNull': [
                                        '$_end', '$_start'
                                    ]
                                }, '$_horizon'
                            ]
                        }, '$_horizon', {
                            '$ifNull': [
                                '$_end', '$_start'
                            ]
                        }
                    ]
                }
            }
        }, {
            '$match': {
                '$expr': {
                    '$and': [
                        {
                            '$ne': [
                                '$_start', null
                            ]
                        }, {
                            '$lte': [
                                '$_start', '$_horizon'
                            ]
                        }, {
                            '$gte': [
                                {
                                    '$ifNull': [
                                        '$_end', '$_start'
                                    ]
                                }, '$_today'
                            ]
                        }, {
                            '$lte': [
                                '$_rangeStart', '$_rangeEnd'
                            ]
                        }
                    ]
                }
            }
        }, {
            '$set': {
                '_days': {
                    '$map': {
                        'input': {
                            '$range': [
                                0, {
                                    '$dateDiff': {
                                        'startDate': '$_rangeStart',
                                        'endDate': {
                                            '$dateAdd': {
                                                'startDate': '$_rangeEnd',
                                                'unit': 'day',
                                                'amount': 1
                                            }
                                        },
                                        'unit': 'day'
                                    }
                                }
                            ]
                        },
                        'as': 'i',
                        'in': {
                            '$dateAdd': {
                                'startDate': '$_rangeStart',
                                'unit': 'day',
                                'amount': '$$i'
                            }
                        }
                    }
                }
            }
        }, {
            '$unwind': '$_days'
        }, {
            '$group': {
                '_id': {
                    'tag': '$_days',
                    'art': {
                        '$ifNull': [
                            '$Art der Veranstaltung', 'Unbekannt'
                        ]
                    }
                },
                'anzahl': {
                    '$sum': 1
                }
            }
        }, {
            '$sort': {
                '_id.art': 1
            }
        }, {
            '$group': {
                '_id': '$_id.tag',
                'veranstaltungen': {
                    '$push': {
                        'k': '$_id.art',
                        'v': '$anzahl'
                    }
                }
            }
        }, {
            '$sort': {
                '_id': 1
            }
        }, {
            '$project': {
                '_id': 0,
                'day': '$_id',
                'veranstaltungen': {
                    '$arrayToObject': '$veranstaltungen'
                }
            }
        }
    ]).toArray();

    return { current_events, events_per_day };
};