# ✈️ AeroSfida – il conta aeroporti

Sito statico (HTML/CSS/JS, nessuna build) per sfidarsi a collezionare aeroporti: mappa, ricerca,
tabellone "tennis", statistiche km/ore e punteggi in base a quante volte si è stati nello stesso aeroporto
(1, 2–5, 6–10, 10+). Pensato per mobile, con menu in basso.

## Aeroporti
Scaricati **una volta** da [OurAirports](https://ourairports.com/data/) (dominio pubblico) e salvati in
`data/airports.js` (4008 aeroporti con codice IATA e voli di linea, ~300 KB). Nessuna API a runtime.
Per rigenerarli: `python3 tools/build_airports.py airports.csv`.

## Accesso e sincronizzazione
- Il sito (questo repo, pubblico) gira su GitHub Pages.
- I dati di gioco stanno nel repo privato `klide1010/aero-challenge-data` (`data/andrea.json`, `data/luca.json`),
  letti e scritti dal sito tramite l'API di GitHub con una chiave (fine-grained token).
- **Configurazione una tantum** (Io → "Configura per entrambi"): si incollano la chiave e le due password.
  Il sito cifra la chiave con ciascuna password (PBKDF2 300k iterazioni + AES-GCM) e riscrive `config.js`
  togliendo gli hash. Da lì in poi la password serve sia per entrare sia per sincronizzare, su qualsiasi telefono.
- Nel codice pubblico non ci sono né password né loro hash: solo la chiave cifrata.

## Punteggio
10 pt per aeroporto · +15 nuovo paese · +40 nuovo continente · bonus fedeltà +3 / +6 / +10.
Il tabellone assegna un set per categoria (aeroporti, paesi, continenti, km, ore, fedeltà).
Km e ore sono stime in linea d'aria dall'aeroporto di casa (A/R × 1, 3, 8, 12 volte per fascia).

## Pubblicazione
Basta GitHub Pages sulla cartella radice (o qualsiasi hosting statico).
