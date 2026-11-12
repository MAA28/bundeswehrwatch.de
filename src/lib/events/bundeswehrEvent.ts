interface BaseEvent {
    'Bundesland': string;
    'Zeitraum von': string;
    'Zeitraum bis': string;
    'PLZ': string;
    'lat': number;
    'lng': number;
    'Quelle': string;
}

export interface Karriereberatung extends BaseEvent {
    'Art der Veranstaltung': 'Karriereberatungen';
    'Ort': string;
    'Name der Schule/Hochschule': string;
    'Klassenstufe(n)': string;
    'Maßnahme im Unterricht': string;
    'Maßnahme im anderer Rahmen': string;
    'Durchführungsort Schulintern': string;
    'Durchführungsort Schulextern': string;
    'Schultyp': string;
    'Infomobil': string;
    'Infotruck': string;
}

export interface SeminarMitJugendoffizier extends BaseEvent {
    'Art der Veranstaltung': 'Seminare mit Jugendoffizier';
    'Durchführungsort': string;
    'Art des Seminars': string;
    'Teilnehmerkreis': string;
    'Name der Schule': string;
    'Klassenstufe(n)': string;
}

export interface Messeausstellung extends BaseEvent {
    'Art der Veranstaltung': 'Messeaustellungen';
    'Ort': string;
    'Anlass': string;
    'Infomobil': string;
    'Infotruck': string;
}

export interface Sportveranstaltung extends BaseEvent {
    'Art der Veranstaltung': 'Sportveranstaltungen';
    'Ort': string;
    'Anlass': string;
    'Infomobil': string;
    'Infotruck': string;
}

export interface JobcenterVortrag extends BaseEvent {
    'Art der Veranstaltung': 'Vorträge in Jobcentern oder Berufsinformationszentren';
    'Ort': string;
    'Jobcenter': string;
    'BIZ': string;
}

export interface KarriereTreff extends BaseEvent {
    'Art der Veranstaltung': 'KarriereTreffs';
    'Ort': string;
    'Anlass': string;
}

export interface VereinsVeranstaltung extends BaseEvent {
    'Art der Veranstaltung': 'Veranstaltungen von Vereinen';
    'Ort': string;
    'Name des Vereins bzw. der Veranstaltung': string;
    'Sonstige Hinweise (z.B. Kooperation oder Veranstaltung)': string;
}

export interface MusikkorpsAuftritt extends BaseEvent {
    'Art der Veranstaltung': 'Auftritte von Musikkorps';
    'Ort': string;
    'Anlass': string;
    'Örtlichkeit': string;
}

export interface Militaerritual extends BaseEvent {
    'Art der Veranstaltung': 'Gelöbnisse, Zapfenstreiche oder andere Militärrituale';
    'Ort': string;
    'Art der Zeremonie': string;
    'Anlass': string;
    'Teilnehmende Einheiten/Dienststellen': string;
    'Örtlichkeit der Zeremonie': string;
}

export type BundeswehrEvent =
    | Karriereberatung
    | SeminarMitJugendoffizier
    | Messeausstellung
    | Sportveranstaltung
    | JobcenterVortrag
    | KarriereTreff
    | VereinsVeranstaltung
    | MusikkorpsAuftritt
    | Militaerritual;