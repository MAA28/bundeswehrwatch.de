import pdfplumber, pandas as pd
from pymongo import MongoClient
from itertools import chain

def load_events(filename: str):
    coords = pd.read_csv("plz_geocoord.csv")

    pages = []
    header_raw = []

    with pdfplumber.open("pdfs/" + filename) as pdf:
        for page in pdf.pages:
            for t in page.extract_tables():
                header_raw = t[0:3]
                pages.append(t[3:])
        table_raw = list(chain.from_iterable(pages))

    headers = []


    for i in range(len(header_raw[1])):
        header = ""
        if header_raw[1][i]:
            header += header_raw[1][i]
        else:
            header += header_raw[1][i-1]
        if header_raw[2][i]:
            header += " " + header_raw[2][i]

        headers.append(header.replace("-\n", "").replace("\n", " "))
    
    events = pd.DataFrame(table_raw, columns=headers)
    events = events.replace({"k.A.": pd.NA, "X": True, "-": False})

    coords["plz"] = coords["plz"].astype(str).str.zfill(5)
    events["PLZ"] = events["PLZ"].astype(str).str.strip().str.zfill(5)

    events = events.merge(
        coords[["plz", "lat", "lng"]].drop_duplicates("plz"),
        left_on="PLZ",
        right_on="plz",
        how="left",
    ).drop(columns="plz")

    return events

def insert_df(df: pd.DataFrame, col):
    records = (
        df.astype(object)
          .where(df.notna(), None)   # NaN / pd.NA / NaT -> None (stored as null)
          .to_dict("records")
    )
    col.insert_many(records)


def main():
    client = MongoClient("mongodb+srv://ma28:550eZZWHr9t68L@cluster0.te4ubvi.mongodb.net/")
    col = client["bundeswehrwatch"]["events"]

    events1 = load_events("01_Karriereberatung-Schule-Hochschule-Q4-2026.pdf")
    events1["Art der Veranstaltung"] = "Karriereberatungen"
    events1["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events1, col)
    print("Inserted  Karriereberatungen")

    events2 = load_events("02_Seminare-Jugendoffiziere-Q4-2026.pdf")
    events2["Art der Veranstaltung"] = "Seminare mit Jugendoffizier"
    events2["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events2, col)
    print("Inserted  Seminare mit Jugendoffizier")

    events3 = load_events("04_Messe-Austellungen-Q4-2026.pdf")
    events3["Art der Veranstaltung"] = "Messeaustellungen"
    events3["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events3, col)
    print("Inserted  Messeaustellungen")

    events4 = load_events("05_Sportveranstaltungen-Q4-2026.pdf")
    events4["Art der Veranstaltung"] = "Sportveranstaltungen"
    events4["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events4, col)
    print("Inserted  Sportveranstaltungen")

    events5 = load_events("06_BIZ-JC-Q4-2026.pdf")
    events5["Art der Veranstaltung"] = "Vorträge in Jobcentern oder Berufsinformationszentren"
    events5["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events5, col)
    print("Inserted  Vorträge in Jobcentern oder Berufsinformationszentren")

    events6 = load_events("07_Karrieretreffs-Q4-2026.pdf")
    events6["Art der Veranstaltung"] = "KarriereTreffs"
    events6["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events6, col)
    print("Inserted  KarriereTreffs")

    events7 = load_events("10_Vereine-Veranstaltungen-Q4-2026.pdf")
    events7["Art der Veranstaltung"] = "Veranstaltungen von Vereinen"
    events7["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events7, col)
    print("Inserted  Veranstaltungen von Vereinen")

    events8 = load_events("11_Musikkorps-Q4-2026.pdf")
    events8["Art der Veranstaltung"] = "Auftritte von Musikkorps"
    events8["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events8, col)
    print("Inserted  Auftritte von Musikkorps")

    events9 = load_events("12_Geloebnisse-Rituale-Q4-2026.pdf")
    events9["Art der Veranstaltung"] = "Gelöbnisse, Zapfenstreiche oder andere Militärrituale"
    events9["Quelle"] = "https://dserver.bundestag.de/btd/21/088/2108888.pdf"
    insert_df(events9, col)
    print("Inserted  Gelöbnisse, Zapfenstreiche oder andere Militärrituale")

    


if __name__ == "__main__":
    main()
