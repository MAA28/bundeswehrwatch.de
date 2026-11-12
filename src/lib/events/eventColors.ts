import type { BundeswehrEvent } from './bundeswehrEvent.ts';

export const eventColors: Record<BundeswehrEvent['Art der Veranstaltung'], string> = {
    'Karriereberatungen': '#2563eb',
    'Seminare mit Jugendoffizier': '#dc2626',
    'Messeaustellungen': '#16a34a',
    'Sportveranstaltungen': '#f59e0b',
    'Vorträge in Jobcentern oder Berufsinformationszentren': '#9333ea',
    'KarriereTreffs': '#0891b2',
    'Veranstaltungen von Vereinen': '#db2777',
    'Auftritte von Musikkorps': '#65a30d',
    'Gelöbnisse, Zapfenstreiche oder andere Militärrituale': '#475569'
};