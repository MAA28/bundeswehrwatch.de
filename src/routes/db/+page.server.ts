import {error} from '@sveltejs/kit';
import type {Collection, Document} from 'mongodb';
import {connectToMongoDB} from '#lib/server/db.ts'; // adjust to your path

const PAGE_SIZE = 50;
const RADII = [0, 10, 25, 50, 100, 200]; // 0 = only this PLZ (prefix match)
const DEFAULT_RADIUS = 25;

type Center = {lat: number; lng: number};

function isoDate(value: string | null): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    return Number.isNaN(Date.parse(value)) ? '' : value;
}

function sorted(values: unknown[]): string[] {
    return values
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .sort((a, b) => a.localeCompare(b, 'de'));
}

async function findCenter(plz: string, events: Collection, plzCollection: Collection): Promise<Center | null> {
    const hit = await plzCollection.findOne({plz});
    if (hit) return {lat: Number(hit.lat), lng: Number(hit.lng)};

    // Fallback: coordinates of any event with exactly this PLZ
    const event = await events.findOne(
        {PLZ: plz, lat: {$type: 'number'}, lng: {$type: 'number'}},
        {projection: {lat: 1, lng: 1}}
    );
    return event ? {lat: Number(event.lat), lng: Number(event.lng)} : null;
}

// Haversine distance in km between a document's lat/lng and the center, as an aggregation expression
function distanceExpression(center: Center): Document {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const halfSinLat = {
        $sin: {$divide: [{$degreesToRadians: {$subtract: ['$lat', center.lat]}}, 2]}
    };
    const halfSinLng = {
        $sin: {$divide: [{$degreesToRadians: {$subtract: ['$lng', center.lng]}}, 2]}
    };

    const a = {
        $add: [
            {$pow: [halfSinLat, 2]},
            {
                $multiply: [
                    Math.cos(toRad(center.lat)),
                    {$cos: {$degreesToRadians: '$lat'}},
                    {$pow: [halfSinLng, 2]}
                ]
            }
        ]
    };

    // 12742 = 2 * earth radius in km
    return {$multiply: [12742, {$asin: {$min: [1, {$sqrt: a}]}}]};
}

export async function load({url}) {
    const q = url.searchParams;
    const radiusParam = Number(q.get('radius'));

    const filters = {
        region: q.get('region') === 'plz' ? 'plz' : 'state',
        plz: (q.get('plz') ?? '').replace(/\D/g, '').slice(0, 5),
        radius: q.has('radius') && RADII.includes(radiusParam) ? radiusParam : DEFAULT_RADIUS,
        state: q.get('state') ?? '',
        from: isoDate(q.get('from')),
        to: isoDate(q.get('to')),
        types: q.getAll('type'),
        source: q.get('source') ?? '',
        page: Math.max(1, Number(q.get('page')) || 1)
    };

    const client = await connectToMongoDB();
    if (!client) {
        error(500, 'Failed to connect to MongoDB');
    }
    const db = client.db('bundeswehrwatch');
    const events = db.collection('events');
    const plzCollection = db.collection('plz');

    // Radius search needs a complete PLZ; otherwise the PLZ filter is a prefix match
    const wantsRadius = filters.region === 'plz' && filters.plz.length === 5 && filters.radius > 0;
    const center = wantsRadius ? await findCenter(filters.plz, events, plzCollection) : null;
    const centerMissing = wantsRadius && center === null;

    const match: Document = {};
    if (filters.region === 'plz' && filters.plz && !wantsRadius) {
        match.PLZ = {$regex: `^${filters.plz}`};
    }
    if (filters.region === 'state' && filters.state) match.Bundesland = filters.state;
    if (center) match._distance = {$lte: filters.radius};
    if (filters.from) match._end = {$gte: new Date(filters.from)};
    if (filters.to) match._start = {$lte: new Date(filters.to)};
    if (filters.types.length) match['Art der Veranstaltung'] = {$in: filters.types};
    if (filters.source) match.Quelle = filters.source;

    const pipeline: Document[] = [];

    if (center) {
        // Cheap bounding box first (can use an index on lat/lng), exact distance afterwards
        const dLat = filters.radius / 111.32;
        const dLng = filters.radius / (111.32 * Math.cos((center.lat * Math.PI) / 180));

        pipeline.push({
            $match: {
                lat: {$gte: center.lat - dLat, $lte: center.lat + dLat},
                lng: {$gte: center.lng - dLng, $lte: center.lng + dLng}
            }
        });
        pipeline.push({$set: {_distance: distanceExpression(center)}});
    }

    pipeline.push({
        $set: {
            _start: {
                $dateFromString: {dateString: '$Zeitraum von', format: '%d.%m.%Y', onError: null, onNull: null}
            },
            _end: {
                $dateFromString: {dateString: '$Zeitraum bis', format: '%d.%m.%Y', onError: null, onNull: null}
            }
        }
    });
    pipeline.push({$set: {_end: {$ifNull: ['$_end', '$_start']}}});
    pipeline.push({$match: match});
    pipeline.push({$sort: center ? {_distance: 1, _start: 1, _id: 1} : {_start: 1, _id: 1}});
    pipeline.push({
        $facet: {
            rows: [{$skip: (filters.page - 1) * PAGE_SIZE}, {$limit: PAGE_SIZE}],
            total: [{$count: 'n'}]
        }
    });

    const resultPromise: Promise<Document | undefined> = centerMissing
        ? Promise.resolve(undefined)
        : events
            .aggregate(pipeline)
            .toArray()
            .then((docs) => docs[0]);

    const [result, states, sources, types] = await Promise.all([
        resultPromise,
        events.distinct('Bundesland'),
        events.distinct('Quelle'),
        events.distinct('Art der Veranstaltung')
    ]);

    const total: number = result?.total?.[0]?.n ?? 0;

    const rows = ((result?.rows ?? []) as Document[]).map((r) => {
        const {_id, _start, _end, _distance, lat, lng, ...fields} = r;
        return {
            id: String(_id),
            type: String(r['Art der Veranstaltung'] ?? ''),
            distance: typeof _distance === 'number' ? Math.round(_distance) : null,
            fields
        };
    });

    return {
        filters,
        centerMissing,
        total,
        pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        rows,
        options: {
            states: sorted(states),
            sources: sorted(sources),
            types: sorted(types),
            radii: RADII
        }
    };
}