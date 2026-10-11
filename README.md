# ✈️ AeroSfida – il conta aeroporti

Sito statico (HTML/CSS/JS, nessuna build) per sfidarsi a collezionare aeroporti: mappa, ricerca,
tabellone "tennis", statistiche km/ore e punteggi in base a quante volte si è stati nello stesso aeroporto
(1, 2–5, 6–10, 10+). Pensato per mobile, con menu in basso.

## Aeroporti
Scaricati **una volta** da [OurAirports](https://ourairports.com/data/) (dominio pubblico) e salvati in
`data/airports.js` (4008 aeroporti con codice IATA e voli di linea, ~300 KB). Nessuna API a runtime.
Per rigenerarli: `python3 tools/build_airports.py airports.csv`.

## Account
Si entra con la sola parola d'ordine; utenti e colori in `config.js` (nome "Andrea" modificabile).
Nel file ci sono solo gli hash SHA-256 (`sha256("aerosfida|" + password)`), non le password.
⚠️ Essendo un sito statico il controllo è lato browser: va bene per gioco tra fratelli, non per dati sensibili.

## Sincronizzazione tra i due telefoni
I dati di ciascuno stanno nel repo **privato** `klide1010/aero-challenge-data` (`data/andrea.json`, `data/luca.json`):
il sito li legge e li scrive con l'API di GitHub. Ognuno scrive solo il proprio file, la sfida li unisce.
Serve una chiave (fine-grained token GitHub con accesso *Contents: Read and write* solo a quel repo),
da incollare una volta per dispositivo in **Io → Chiave di sincronizzazione**. La chiave resta solo nel browser.

## Punteggio
10 pt per aeroporto · +15 nuovo paese · +40 nuovo continente · bonus fedeltà +3 / +6 / +10.
Il tabellone assegna un set per categoria (aeroporti, paesi, continenti, km, ore, fedeltà).
Km e ore sono stime in linea d'aria dall'aeroporto di casa (A/R × 1, 3, 8, 12 volte per fascia).

## Pubblicazione
Basta GitHub Pages sulla cartella radice (o qualsiasi hosting statico).
