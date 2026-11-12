import type {PageServerLoad} from './$types';
import {connectToMongoDB} from "#lib/server/db.ts";
import {error} from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
    const client = await connectToMongoDB();
    if (!client) {
        error(503, "Failed to connect to database");
    }
    const current_events = await client.db("bundeswehrwatch").collection("events").aggregate([
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
    return { current_events };
};