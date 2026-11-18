import type {BundeswehrEvent} from '#lib/events/bundeswehrEvent.js';

type EventType = BundeswehrEvent['Art der Veranstaltung'];

// Fields shown on every card, after the type-specific ones
export const commonFields = ['PLZ', 'Bundesland', 'Zeitraum von', 'Zeitraum bis', 'Quelle'] as const;

// Type-specific fields in display order
export const typeFields: Record<EventType, string[]> = {
    'Karriereberatungen': [
        'Ort', 'Name der Schule/Hochschule', 'Schultyp', 'Klassenstufe(n)',
        'Maßnahme im Unterricht', 'Maßnahme im anderer Rahmen',
        'Durchführungsort Schulintern', 'Durchführungsort Schulextern',
        'Infomobil', 'Infotruck'
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
        'Ort', 'Art der Zeremonie', 'Anlass', 'Teilnehmende Einheiten/Dienststellen', 'Örtlichkeit der Zeremonie'
    ]
};

export function fieldsFor(type: string): string[] {
    return [...(typeFields[type as EventType] ?? []), ...commonFields];
}