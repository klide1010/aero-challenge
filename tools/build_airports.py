"""Genera data/airports.js da OurAirports (airports.csv, dominio pubblico).
Uso: python3 tools/build_airports.py airports.csv
Tiene solo aeroporti con codice IATA e voli di linea."""
import csv, json, sys
rows = []
for r in csv.DictReader(open(sys.argv[1], encoding="utf-8")):
    if r["type"] not in ("large_airport", "medium_airport", "small_airport"): continue
    if r["scheduled_service"] != "yes" or not r["iata_code"]: continue
    city = r["municipality"] or r["name"]
    rows.append([r["iata_code"], r["name"], city, r["iso_country"], r["continent"],
                 round(float(r["latitude_deg"]), 3), round(float(r["longitude_deg"]), 3),
                 {"large_airport": 3, "medium_airport": 2}.get(r["type"], 1)])
rows.sort(key=lambda x: x[0])
seen = set(); out = []
for x in rows:
    if x[0] in seen: continue
    seen.add(x[0]); out.append(x)
# [iata, nome, città, paese(ISO), continente, lat, lon, taglia]
open("data/airports.js", "w", encoding="utf-8").write(
    "window.AIRPORTS=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(out))
