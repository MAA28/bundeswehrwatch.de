import type { BundeswehrEvent } from './bundeswehrEvent.ts';

type EventType = BundeswehrEvent['Art der Veranstaltung'];

const baseKeys = ['Bundesland', 'Zeitraum von', 'Zeitraum bis', 'PLZ', 'lat', 'lng', 'Quelle'];

// Type-specific keys only (without the base keys and the discriminator)
const specificKeys: Record<EventType, string[]> = {
    'Karriereberatungen': [
        'Ort', 'Name der Schule/Hochschule', 'Klassenstufe(n)', 'Maßnahme im Unterricht',
        'Maßnahme im anderer Rahmen', 'Durchführungsort Schulintern',
        'Durchführungsort Schulextern', 'Schultyp', 'Infomobil', 'Infotruck'
    ],
    'Seminare mit Jugendoffizier': [
        'Durchführungsort', 'Art des Seminars', 'Teilnehmerkreis', 'Name der Schule', 'Klassenstufe(n)'
    ],
    'Messeaustellungen': ['Ort', 'Anlass', 'Infomobil', 'Infotruck'],
    'Sportveranstaltungen': ['Ort', 'Anlass', 'Infomobil', 'Infotruck'],
    'Vorträge in Jobcentern oder Berufsinformationszentren': ['Ort', 'Jobcenter', 'BIZ'],
    'KarriereTreffs': ['Ort', 'Anlass'],
    'Veranstaltungen von Vereinen': [
        'Ort', 'Name des Vereins bzw. der Veranstaltung',
        'Sonstige Hinweise (z.B. Kooperation oder Veranstaltung)'
    ],
    'Auftritte von Musikkorps': ['Ort', 'Anlass', 'Örtlichkeit'],
    'Gelöbnisse, Zapfenstreiche oder andere Militärrituale': [
        'Ort', 'Art der Zeremonie', 'Anlass',
        'Teilnehmende Einheiten/Dienststellen', 'Örtlichkeit der Zeremonie'
    ]
};

const eventTypes = Object.keys(specificKeys) as EventType[];

function isEventType(value: unknown): value is EventType {
    return typeof value === 'string' && (eventTypes as string[]).includes(value);
}

function hasKeys(obj: Record<string, unknown>, type: EventType): boolean {
    return [...baseKeys, ...specificKeys[type]].every((key) => key in obj);
}

export function parseEvent(raw: unknown): BundeswehrEvent | null {
    if (typeof raw !== 'object' || raw === null) return null;

    const obj: Record<string, unknown> = { ...(raw as Record<string, unknown>) };

    // Fix known typo in the source data (Sportveranstaltungen)
    if ('Zeitraum' in obj && !('Zeitraum von' in obj)) {
        obj['Zeitraum von'] = obj['Zeitraum'];
        delete obj['Zeitraum'];
    }

    // 1. Trust the discriminator if it is valid
    const declared = obj['Art der Veranstaltung'];
    if (isEventType(declared)) {
        return hasKeys(obj, declared) ? (obj as unknown as BundeswehrEvent) : null;
    }

    // 2. Fallback: find the most specific type whose keys are all present
    let best: EventType[] = [];
    let bestSize = -1;

    for (const type of eventTypes) {
        if (!hasKeys(obj, type)) continue;
        const size = specificKeys[type].length;
        if (size > bestSize) {
            best = [type];
            bestSize = size;
        } else if (size === bestSize) {
            best.push(type);
        }
    }

    // No match, or ambiguous (e.g. Messe vs. Sport have identical fields)
    if (best.length !== 1) return null;

    return { ...obj, 'Art der Veranstaltung': best[0] } as unknown as BundeswehrEvent;
}