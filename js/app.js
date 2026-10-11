(function () {
"use strict";
const CFG = window.AERO_CONFIG;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------- dati statici ---------- */
const AP = window.AIRPORTS.map(a => ({ iata: a[0], name: a[1], city: a[2], cc: a[3], cont: a[4], lat: a[5], lon: a[6], size: a[7] }));
const BY = Object.fromEntries(AP.map(a => [a.iata, a]));
AP.forEach(a => a.key = norm(`${a.iata} ${a.city} ${a.name} ${countryName(a.cc)}`));
const regionNames = (() => { try { return new Intl.DisplayNames(["it"], { type: "region" }); } catch (e) { return null; } })();
function countryName(cc) { try { return (regionNames && regionNames.of(cc)) || cc; } catch (e) { return cc; } }
const flag = cc => cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : "🏳️";
const CONT = { EU: "Europa", AS: "Asia", AF: "Africa", NA: "Nord America", SA: "Sud America", OC: "Oceania", AN: "Antartide" };

/* ---------- regole del gioco ---------- */
const BUCKETS = [
  { v: 0, label: "Mai", sub: "", est: 0, bonus: 0 },
  { v: 1, label: "1", sub: "volta", est: 1, bonus: 0 },
  { v: 2, label: "2–5", sub: "volte", est: 3, bonus: 3 },
  { v: 3, label: "6–10", sub: "volte", est: 8, bonus: 6 },
  { v: 4, label: "10+", sub: "volte", est: 12, bonus: 10 }
];
const PT_AIRPORT = 10, PT_COUNTRY = 15, PT_CONT = 40;
const R_EARTH = 6371, EARTH_CIRC = 40075, MOON = 384400, CRUISE = 780, LEG_OVERHEAD = 0.75;

const dist = (a, b) => {
  const r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(h));
};

function compute(u) {
  const ids = Object.keys(u.visits).filter(k => BY[k] && u.visits[k] > 0);
  const countries = new Set(), conts = new Set();
  let bonus = 0, km = 0, hours = 0, flights = 0, far = null, north = null, south = null, loyal = 0;
  const home = BY[u.home];
  const perCountry = {};
  ids.forEach(k => {
    const a = BY[k], b = BUCKETS[u.visits[k]];
    countries.add(a.cc); conts.add(a.cont); bonus += b.bonus;
    perCountry[a.cc] = (perCountry[a.cc] || 0) + 1;
    if (u.visits[k] === 4) loyal++;
    if (!north || a.lat > north.lat) north = a;
    if (!south || a.lat < south.lat) south = a;
    if (home && a.iata !== home.iata) {
      const d = dist(home, a), legs = b.est * 2;
      km += d * legs; flights += legs; hours += (d * legs) / CRUISE + legs * LEG_OVERHEAD;
      if (!far || d > far.d) far = { a, d };
    }
  });
  const points = ids.length * PT_AIRPORT + bonus + countries.size * PT_COUNTRY + conts.size * PT_CONT;
  const visitsTot = ids.reduce((s, k) => s + BUCKETS[u.visits[k]].est, 0);
  return { ids, n: ids.length, countries, conts, bonus, km: Math.round(km), hours, flights, far, north, south, loyal, points, visitsTot, perCountry };
}

const TITLES = [[0, "Passeggero ancora a terra", "🧍"], [1, "Turista del check-in", "🎫"], [5, "Frequent flyer in erba", "🌱"], [15, "Collezionista di gate", "🛄"], [30, "Comandante giramondo", "🧭"], [60, "Re dei cieli", "👑"], [100, "Leggenda dell'aviazione", "🚀"]];
const titleFor = n => [...TITLES].reverse().find(t => n >= t[0]);
const QUOTES = [
  "Il mondo è un libro, e chi non viaggia ne ha letto solo la prima pagina (ma il gate B12 lo conosce a memoria).",
  "Non è una gara… ma il passaporto ha più timbri dell'altro.",
  "Valigia pronta, orgoglio fraterno carico.",
  "Un aeroporto al giorno toglie il fratello di torno.",
  "La vera differenza tra turista e viaggiatore? Il numero di scali.",
  "Ritardo di 40 minuti: giusto il tempo di segnare un altro aeroporto.",
  "Chi vola in alto non guarda il tabellone… ma lo controlla ogni sera.",
  "Il duty free è il vero campo da tennis.",
  "Atterrare è facile, restare in testa alla classifica no.",
  "Se l'aeroporto non è sull'app, non è mai esistito.",
  "Bagaglio a mano leggero, record pesante.",
  "Un fratello batte il prossimo con un volo low cost."
];
const quoteOfDay = () => QUOTES[Math.floor(Date.now() / 864e5) % QUOTES.length];
const BADGES = [
  { ic: "🎫", t: "Primo volo", f: c => c.n >= 1 },
  { ic: "🛄", t: "10 aeroporti", f: c => c.n >= 10 },
  { ic: "🧭", t: "25 aeroporti", f: c => c.n >= 25 },
  { ic: "👑", t: "50 aeroporti", f: c => c.n >= 50 },
  { ic: "🗾", t: "5 paesi", f: c => c.countries.size >= 5 },
  { ic: "🌍", t: "10 paesi", f: c => c.countries.size >= 10 },
  { ic: "🌎", t: "3 continenti", f: c => c.conts.size >= 3 },
  { ic: "🪐", t: "5 continenti", f: c => c.conts.size >= 5 },
  { ic: "🧊", t: "Polare (oltre 60°N)", f: c => c.north && c.north.lat > 60 },
  { ic: "🦘", t: "Emisfero Sud", f: c => c.south && c.south.lat < 0 },
  { ic: "💞", t: "Fedelissimo (10+ volte)", f: c => c.loyal >= 1 },
  { ic: "🌐", t: "Un giro del mondo", f: c => c.km >= EARTH_CIRC },
  { ic: "🌙", t: "Verso la Luna (100.000 km)", f: c => c.km >= 100000 }
];

/* ---------- hash password ---------- */
function sha256(str) {
  const K = [], H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  for (let c = 2, n = 0; n < 64; c++) { let p = true; for (let d = 2; d * d <= c; d++) if (c % d === 0) { p = false; break; } if (p) K[n++] = (Math.cbrt(c) % 1 * 4294967296) | 0; }
  const b = new TextEncoder().encode(str), l = b.length, w = [];
  const bytes = [...b, 128]; while (bytes.length % 64 !== 56) bytes.push(0);
  const bits = l * 8; for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bits >>> (i * 8)) & 255);
  const rot = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < bytes.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = (bytes[o + 4 * i] << 24) | (bytes[o + 4 * i + 1] << 16) | (bytes[o + 4 * i + 2] << 8) | bytes[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) { const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
    let [a, bb, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    [a, bb, c, d, e, f, g, h].forEach((v, i) => H[i] = (H[i] + v) | 0);
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

/* ---------- stato + storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const emptyUser = () => ({ home: "", visits: {}, updated: 0 });
const state = { me: null, data: {}, filter: "all", shown: 60 };
CFG.users.forEach(u => state.data[u.id] = Object.assign(emptyUser(), store.get("aero:data:" + u.id, {})));
const meta = id => CFG.users.find(u => u.id === id);
const other = () => CFG.users.find(u => u.id !== state.me);
const mine = () => state.data[state.me];
// Sincronizzazione: un file JSON per giocatore nel repo privato dei dati (GitHub API).
// La chiave (token GitHub) non sta nel codice: la si incolla una volta per dispositivo in "Io".
const REPO = CFG.dataRepo || "", BRANCH = CFG.dataBranch || "main";
const token = () => store.get("aero:ghtoken", "");
const online = () => !!(REPO && token());
const shas = {};
let syncState = "…";
const b64enc = s => btoa(unescape(encodeURIComponent(s)));
const b64dec = s => decodeURIComponent(escape(atob(s.replace(/\n/g, ""))));
const gh = (path, opt = {}) => fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, Object.assign({ cache: "no-store" }, opt, {
  headers: { Authorization: "Bearer " + token(), Accept: "application/vnd.github+json" }
}));
async function readRemote(id) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/data/${id}.json?ref=${BRANCH}&t=${Date.now()}`, {
    cache: "no-store", headers: { Authorization: "Bearer " + token(), Accept: "application/vnd.github+json" } });
  if (r.status === 404) { shas[id] = null; return null; }
  if (r.status === 401 || r.status === 403) throw new Error("auth");
  if (!r.ok) throw new Error("http " + r.status);
  const j = await r.json(); shas[id] = j.sha;
  return JSON.parse(b64dec(j.content));
}
async function pull() {
  if (!online()) return paintSync();
  try {
    for (const u of CFG.users) {
      const remote = await readRemote(u.id);
      if (!remote) continue;
      const loc = state.data[u.id];
      // il proprio profilo vince se è più recente; quello dell'altro viene sempre dal server
      if (u.id !== state.me || (remote.updated || 0) > (loc.updated || 0))
        state.data[u.id] = Object.assign(emptyUser(), remote, { visits: remote.visits || {} });
      store.set("aero:data:" + u.id, state.data[u.id]);
    }
    if ((mine().updated || 0) > 0 && dirty()) pushNow();
    syncState = "online ✓";
  } catch (e) { syncState = e.message === "auth" ? "chiave non valida" : "offline"; }
  paintSync(); refresh();
}
const dirty = () => store.get("aero:dirty", false);
let pushT;
function save() {
  const d = mine(); d.updated = Date.now();
  store.set("aero:data:" + state.me, d);
  store.set("aero:dirty", true);
  if (!online()) return;
  clearTimeout(pushT); syncState = "salvo…"; paintSync();
  pushT = setTimeout(pushNow, 1500);
}
async function pushNow(retry = true) {
  const d = mine(), body = { message: `${meta(state.me).name}: aggiorna aeroporti`, branch: BRANCH,
    content: b64enc(JSON.stringify(d, null, 1)) };
  try {
    if (shas[state.me] === undefined) await readRemote(state.me).catch(() => {});
    if (shas[state.me]) body.sha = shas[state.me];
    const r = await gh(`data/${state.me}.json`, { method: "PUT", body: JSON.stringify(body) });
    if ((r.status === 409 || r.status === 422) && retry) { await readRemote(state.me); return pushNow(false); }
    if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? "auth" : "http");
    shas[state.me] = (await r.json()).content.sha;
    store.set("aero:dirty", false);
    syncState = "online ✓";
  } catch (e) { syncState = e.message === "auth" ? "chiave non valida" : "offline"; }
  paintSync();
}
function paintSync() { $("#syncChip").textContent = online() ? "☁️ " + syncState : "📱 solo qui"; }

/* ---------- login ---------- */
/* Accesso: la password è la chiave. Nel config pubblico c'è solo la chiave di sincronizzazione
   cifrata (AES-GCM, chiave derivata dalla password con PBKDF2): niente hash, niente password in chiaro. */
const PBKDF2_ITER = 300000;
const u8 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
async function pwdKey(pwd, salt) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pwd), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: PBKDF2_ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function lock(secret, pwd) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await pwdKey(pwd, salt), new TextEncoder().encode(secret));
  return { s: b64(salt), iv: b64(iv), c: b64(c) };
}
async function unlock(l, pwd) {
  try {
    const p = await crypto.subtle.decrypt({ name: "AES-GCM", iv: u8(l.iv) }, await pwdKey(pwd, u8(l.s)), u8(l.c));
    return new TextDecoder().decode(p);
  } catch (e) { return null; }
}
const locked = () => CFG.users.every(u => u.lock);
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const pwd = $("#pwd").value, btn = $("#loginForm button");
  $("#loginErr").hidden = true;
  let u = null, tok = null;
  if (locked()) {
    if (!window.crypto || !crypto.subtle) { $("#loginErr").hidden = false; $("#loginErr").textContent = "Apri il sito in https per entrare."; return; }
    btn.disabled = true; btn.textContent = "Controllo passaporto… 🛂";
    for (const x of CFG.users) { tok = await unlock(x.lock, pwd); if (tok) { u = x; break; } }
    btn.disabled = false; btn.textContent = "Imbarco 🛫";
  } else {
    const h = sha256("aerosfida|" + pwd);
    u = CFG.users.find(x => x.hash === h);
  }
  if (!u) { $("#loginErr").hidden = false; return; }
  if (tok) store.set("aero:ghtoken", tok);
  store.set("aero:me", u.id); enter(u.id);
});
function enter(id) {
  state.me = id;
  document.documentElement.style.setProperty("--me", meta(id).color);
  document.documentElement.style.setProperty("--bro", other().color);
  $("#login").hidden = true; $("#app").hidden = false;
  $("#whoChip").textContent = `${meta(id).emoji} ${meta(id).name}`;
  paintSync(); initMap(); show("sfida"); pull();
}
function logout() { store.set("aero:me", null); if (locked()) store.set("aero:ghtoken", ""); location.reload(); }

/* ---------- navigazione ---------- */
let map, markers = {}, mapReady = false;
function show(v) {
  $$(".view").forEach(s => s.classList.toggle("on", s.id === "v-" + v));
  $$("#tabbar button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  state.view = v; window.scrollTo(0, 0);
  if (v === "mappa" && map) setTimeout(() => map.invalidateSize(), 50);
  refresh();
}
$("#tabbar").addEventListener("click", e => { const b = e.target.closest("button"); if (b) show(b.dataset.v); });
function refresh() {
  if (!state.me) return;
  ({ sfida: renderSfida, stats: renderStats, io: renderIo, lista: renderList, mappa: paintMarkers })[state.view]?.();
}

/* ---------- toast ---------- */
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2800); }

/* ---------- impostare un aeroporto ---------- */
const OK_PHRASES = ["Nuovo aeroporto in saccoccia! 🛫", "Timbro sul passaporto! 🛂", "Gate conquistato! 🚪", "Un altro pallino sulla mappa! 📍", "Atterraggio perfetto! 🛬"];
function setVisit(iata, v) {
  const d = mine(), prevV = d.visits[iata] || 0, a = BY[iata];
  const o = other(), before = [compute(mine()).points, compute(state.data[o.id]).points];
  const prevC = compute(d);
  if (v === 0) delete d.visits[iata]; else d.visits[iata] = v;
  save();
  const c = compute(d), gain = c.points - prevC.points;
  let msg;
  if (v === 0) msg = "Aeroporto rimosso. Il Karma dei ritardi ti guarda. 🧳";
  else if (!prevV) {
    msg = OK_PHRASES[Math.floor(Math.random() * OK_PHRASES.length)] + ` +${gain} pt`;
    if (c.countries.size > prevC.countries.size) msg = `Nuovo paese: ${countryName(a.cc)} ${flag(a.cc)}! +${gain} pt`;
    if (c.conts.size > prevC.conts.size) msg = `NUOVO CONTINENTE: ${CONT[a.cont]}! 🌍 +${gain} pt`;
  } else msg = gain > 0 ? `Fedeltà premiata: +${gain} pt 💞` : "Aggiornato! ✍️";
  if (before[0] <= before[1] && c.points > before[1] && before[1] > 0) msg = `SORPASSO su ${o.name}! 🏎️ ` + msg;
  toast(msg);
  paintMarkers(); refresh(); if (!$("#sheet").hidden) openSheet(iata, true);
}

/* ---------- sheet aeroporto ---------- */
function openSheet(iata, keep) {
  const a = BY[iata], d = mine(), o = other(), od = state.data[o.id];
  const home = BY[d.home];
  const dh = home && home.iata !== iata ? Math.round(dist(home, a)) : null;
  const ov = od.visits[iata] || 0;
  $("#sheet").innerHTML = `<button class="x" data-close>✕</button>
    <div class="big-code">${a.iata} ${flag(a.cc)}</div>
    <h3>${esc(a.name)}</h3>
    <div class="muted">${esc(a.city)} · ${esc(countryName(a.cc))} · ${CONT[a.cont] || ""}${dh ? ` · ${dh.toLocaleString("it")} km da casa` : ""}</div>
    <p style="margin:12px 0 0"><b>Quante volte ci sei stato?</b></p>
    <div class="bk">${BUCKETS.map(b => `<button data-v="${b.v}" class="${(d.visits[iata] || 0) === b.v ? "on" : ""}">${b.label}<small>${b.sub}</small></button>`).join("")}</div>
    <div class="muted">${o.emoji} ${esc(o.name)}: ${ov ? "ci è stato " + BUCKETS[ov].label + " " + BUCKETS[ov].sub : "non ci è ancora stato (occasione!)"}</div>`;
  $("#sheet").dataset.iata = iata;
  $("#sheet").hidden = false; $("#sheetBg").hidden = false;
}
function closeSheet() { $("#sheet").hidden = true; $("#sheetBg").hidden = true; }
$("#sheetBg").addEventListener("click", closeSheet);
$("#sheet").addEventListener("click", e => {
  if (e.target.closest("[data-close]")) return closeSheet();
  const b = e.target.closest(".bk button"); if (b) setVisit($("#sheet").dataset.iata, +b.dataset.v);
});

/* ---------- mappa ---------- */
function initMap() {
  if (mapReady) return; mapReady = true;
  if (!window.L) { $("#map").innerHTML = '<p style="padding:20px">Mappa non disponibile offline: usa la ricerca 🔎.</p>'; return; }
  map = L.map("map", { preferCanvas: true, worldCopyJump: true, minZoom: 2, zoomControl: false }).setView([42, 12], 4);
  L.control.zoom({ position: "topright" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(map);
  const canvas = L.canvas({ padding: 0.5, tolerance: 10 });
  AP.forEach(a => {
    const m = L.circleMarker([a.lat, a.lon], { renderer: canvas, radius: 3 }).addTo(map);
    m.on("click", () => openSheet(a.iata));
    markers[a.iata] = m;
  });
  paintMarkers();
}
function paintMarkers() {
  if (!map) return;
  const mv = mine().visits, ov = state.data[other().id].visits, mc = meta(state.me).color, oc = other().color;
  AP.forEach(a => {
    const m = markers[a.iata], me = mv[a.iata], ot = ov[a.iata], base = a.size === 3 ? 5 : a.size === 2 ? 4 : 3;
    if (me) m.setStyle({ radius: base + 3 + me, fillColor: mc, fillOpacity: .95, color: ot ? oc : "#fff", weight: ot ? 3 : 1.5 });
    else if (ot) m.setStyle({ radius: base + 2, fillColor: oc, fillOpacity: .85, color: "#fff", weight: 1.5 });
    else m.setStyle({ radius: base, fillColor: "#5b7a96", fillOpacity: .5, color: "#5b7a96", weight: 1 });
    if (me || ot) m.bringToFront();
  });
  $("#legend").innerHTML = `<span style="background:${mc}"></span>${esc(meta(state.me).name)}<span style="background:${oc}"></span>${esc(other().name)}<span style="background:#5b7a96"></span>da visitare`;
}
function searchAp(q, limit) {
  const t = norm(q).trim().split(/\s+/).filter(Boolean);
  if (!t.length) return [];
  const out = [];
  for (const a of AP) {
    if (!t.every(w => a.key.includes(w))) continue;
    const s = (a.iata.toLowerCase() === t[0] ? 100 : 0) + (norm(a.city).startsWith(t[0]) ? 30 : 0) + a.size * 5;
    out.push([s, a]);
  }
  out.sort((x, y) => y[0] - x[0]);
  return out.slice(0, limit).map(x => x[1]);
}
$("#mapQ").addEventListener("input", e => {
  const r = searchAp(e.target.value, 6), box = $("#mapRes");
  box.hidden = !r.length;
  box.innerHTML = r.map(a => `<div data-i="${a.iata}">${flag(a.cc)} <b>${a.iata}</b> · ${esc(a.city)} <span class="muted">${esc(a.name)}</span></div>`).join("");
});
$("#mapRes").addEventListener("click", e => {
  const d = e.target.closest("[data-i]"); if (!d) return;
  const a = BY[d.dataset.i]; $("#mapRes").hidden = true; $("#mapQ").value = "";
  if (map) map.flyTo([a.lat, a.lon], 8, { duration: .8 });
  openSheet(a.iata);
});

/* ---------- lista ---------- */
$("#q").addEventListener("input", () => { state.shown = 60; renderList(); });
$("#filters").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  state.filter = b.dataset.f; state.shown = 60;
  $$("#filters button").forEach(x => x.classList.toggle("on", x === b)); renderList();
});
$("#list").addEventListener("click", e => {
  if (e.target.closest("[data-more]")) { state.shown += 60; return renderList(); }
  const r = e.target.closest("[data-i]"); if (r) openSheet(r.dataset.i);
});
function renderList() {
  const q = $("#q").value, mv = mine().visits, ov = state.data[other().id].visits;
  let rows = q.trim() ? searchAp(q, 4000) : [...AP].sort((a, b) => b.size - a.size || a.iata.localeCompare(b.iata));
  rows = rows.filter(a => state.filter === "all" || (state.filter === "mine" && mv[a.iata]) || (state.filter === "todo" && !mv[a.iata]) || (state.filter === "bro" && ov[a.iata] && !mv[a.iata]));
  const o = other(), total = rows.length;
  $("#list").innerHTML = rows.slice(0, state.shown).map(a => {
    const mb = mv[a.iata], ob = ov[a.iata];
    return `<div class="ap" data-i="${a.iata}"><div class="fl">${flag(a.cc)}</div>
      <div class="tx"><div><span class="code">${a.iata}</span> · ${esc(a.city)}</div><div class="muted">${esc(a.name)}</div></div>
      <div class="st">${mb ? `<span class="pill" style="background:${meta(state.me).color}">Tu ${BUCKETS[mb].label}×</span>` : ""}${ob ? `<span class="pill" style="background:${o.color}">${esc(o.name)} ${BUCKETS[ob].label}×</span>` : ""}</div></div>`;
  }).join("") || '<p class="muted">Nessun aeroporto trovato. Forse è un eliporto segreto? 🚁</p>';
  if (total > state.shown) $("#list").insertAdjacentHTML("beforeend", `<button class="btn ghost more" data-more>Mostra altri (${total - state.shown})</button>`);
}

/* ---------- SFIDA: tabellone tennis ---------- */
const fmt = n => Math.round(n).toLocaleString("it");
const fmtH = h => h < 1 ? "0 h" : `${fmt(h)} h`;
const cell = (l, v) => l === "Km" ? (v >= 10000 ? Math.round(v / 1000) + "k" : fmt(v)) : l === "Ore" ? Math.round(v) : v;
function sets(a, b) {
  const rows = [
    ["Aerop.", "n"], ["Paesi", x => x.countries.size], ["Contin.", x => x.conts.size], ["Km", "km"], ["Ore", "hours"], ["Fed.", "bonus"]
  ].map(([l, f]) => { const g = typeof f === "string" ? (x => x[f]) : f; return { l, a: g(a), b: g(b) }; });
  return rows;
}
function renderSfida() {
  const me = meta(state.me), ot = other(), A = compute(mine()), B = compute(state.data[ot.id]);
  const S = sets(A, B);
  const wa = S.filter(r => r.a > r.b).length, wb = S.filter(r => r.b > r.a).length;
  let lead, verdict;
  const diff = Math.abs(A.points - B.points);
  if (A.points === B.points) { verdict = A.points ? "PARITÀ — punto decisivo in arrivo! 🎾" : "Si parte da 0-0: servizio al primo che prenota! 🎾"; }
  else {
    const L = A.points > B.points ? me : ot, F = L === me ? ot : me;
    lead = L; verdict = `Game, set, match… ${L.name}! (per ora) 🏆`;
    var banter = [
      `${L.name} è avanti di ${diff} punti. ${F.name}, c'è un volo in offerta?`,
      `${F.name} deve recuperare ${diff} punti: basta un weekend a ${AP[Math.floor(Math.random() * AP.length)].city}.`,
      diff < 30 ? `Distanza ridotta: ${diff} punti. Un solo scalo e cambia tutto!` : `Distacco di ${diff} punti: serve un colpo di mercato (o un low cost).`
    ][Math.floor(Date.now() / 36e5) % 3];
  }
  const t = titleFor(A.n), tb = titleFor(B.n);
  const mkRow = (u, C, side) => `<tr><td class="pl"><span class="dot" style="background:${u.color}"></span>${u.emoji} ${esc(u.name)}</td>
    ${S.map(r => `<td class="${r[side] > r[side === "a" ? "b" : "a"] ? "w" : ""}">${side === "a" ? cell(r.l, r.a) : cell(r.l, r.b)}</td>`).join("")}
    <td class="sets">${side === "a" ? wa : wb}</td></tr>`;
  $("#v-sfida").innerHTML = `
    <div class="card hero"><small>Frase del giorno</small><div class="quote">“${esc(quoteOfDay())}”</div></div>
    <div class="board">
      <div class="board-head"><span>🎾 Aeroporto Open</span><span>Tabellone</span></div>
      <table><thead><tr><th></th>${S.map(r => `<th>${r.l}</th>`).join("")}<th>Set</th></tr></thead>
      <tbody>${mkRow(me, A, "a")}${mkRow(ot, B, "b")}</tbody></table>
      <div class="verdict">${verdict}</div>
    </div>
    <div class="score-big">
      <div style="background:${me.color}"><small>${me.emoji} ${esc(me.name)}</small><b>${A.points}</b><small>punti</small></div>
      <div style="background:${ot.color}"><small>${ot.emoji} ${esc(ot.name)}</small><b>${B.points}</b><small>punti</small></div>
    </div>
    ${banter ? `<div class="card">💬 ${esc(banter)}</div>` : ""}
    <div class="card"><div class="rank">${t[2]} ${esc(me.name)}: ${t[1]}</div>
      <div class="muted">${nextGoal(A.n)}</div>
      <div class="vs" style="margin-top:12px"><div class="rank" style="font-size:.95rem">${tb[2]} ${esc(ot.name)}: ${tb[1]}</div></div></div>
    ${!mine().home ? `<div class="warn">🏠 Imposta il tuo aeroporto di casa in <b>Io</b> per calcolare km e ore di viaggio.</div>` : ""}
    <div class="card"><h3>📜 Come si fa punteggio</h3>
      <div class="muted">Ogni aeroporto = ${PT_AIRPORT} pt · nuovo paese = +${PT_COUNTRY} · nuovo continente = +${PT_CONT}<br>
      Bonus fedeltà: 2–5 volte +3 · 6–10 volte +6 · oltre 10 volte +10.<br>
      Il tabellone assegna un <b>set</b> per ogni categoria vinta: chi ne vince di più, vince il match.</div></div>`;
}
function nextGoal(n) {
  const nx = TITLES.find(t => t[0] > n);
  return nx ? `Ancora ${nx[0] - n} aeroporti per diventare “${nx[1]}” ${nx[2]}.` : "Hai raggiunto il massimo grado. Il comandante saluta. 🫡";
}

/* ---------- STATS ---------- */
function renderStats() {
  const us = [meta(state.me), other()], C = us.map(u => compute(state.data[u.id]));
  const bar = (label, vals, f = fmt) => {
    const mx = Math.max(...vals, 1);
    return `<div class="vs"><b>${label}</b>${us.map((u, i) => `<div class="row"><span class="nm">${esc(u.name)}</span><div class="bar"><i style="width:${vals[i] / mx * 100}%;background:${u.color}"></i></div><span class="val">${f(vals[i])}</span></div>`).join("")}</div>`;
  };
  const km = C[0].km + C[1].km, hrs = C[0].hours + C[1].hours;
  const tileFor = (u, c) => {
    const topC = Object.entries(c.perCountry).sort((a, b) => b[1] - a[1])[0];
    const sorted = c.ids.sort((x, y) => state.data[u.id].visits[y] - state.data[u.id].visits[x]);
    return `<div class="card"><h3>${u.emoji} ${esc(u.name)}</h3>
      <div class="tiles">
        <div class="tile"><div class="ic">🌍</div><b>${(c.km / EARTH_CIRC).toFixed(2).replace(".", ",")}</b><small>giri del mondo</small></div>
        <div class="tile"><div class="ic">🌙</div><b>${(c.km / MOON * 100).toFixed(1).replace(".", ",")}%</b><small>della strada per la Luna</small></div>
        <div class="tile"><div class="ic">🛩️</div><b>${c.flights}</b><small>voli stimati</small></div>
        <div class="tile"><div class="ic">⏱️</div><b>${(c.hours / 24).toFixed(1).replace(".", ",")}</b><small>giorni passati in viaggio</small></div>
        <div class="tile"><div class="ic">📏</div><b>${c.far ? c.far.a.iata : "—"}</b><small>${c.far ? fmt(c.far.d) + " km: il più lontano" : "imposta la tua base"}</small></div>
        <div class="tile"><div class="ic">${topC ? flag(topC[0]) : "🏳️"}</div><b>${topC ? esc(countryName(topC[0])) : "—"}</b><small>${topC ? topC[1] + " aeroporti: il tuo paese del cuore" : "nessun paese"}</small></div>
        <div class="tile"><div class="ic">🧊</div><b>${c.north ? c.north.iata : "—"}</b><small>il più a nord</small></div>
        <div class="tile"><div class="ic">🏝️</div><b>${c.south ? c.south.iata : "—"}</b><small>il più a sud</small></div>
      </div>
      <p class="muted">${sorted[0] && state.data[u.id].visits[sorted[0]] === 4 ? `💞 Aeroporto più fedele: <b>${sorted[0]}</b> (${esc(BY[sorted[0]].city)})` : "Nessun aeroporto con 10+ visite: la fedeltà si costruisce!"}</p>
      <div class="badges">${BADGES.map(b => `<span class="badge ${b.f(c) ? "" : "off"}">${b.ic} ${b.t}</span>`).join("")}</div></div>`;
  };
  const dist4 = us.map(u => [1, 2, 3, 4].map(b => Object.values(state.data[u.id].visits).filter(v => v === b).length));
  $("#v-stats").innerHTML = `
    <div class="card hero"><small>Insieme (vista aggregata)</small>
      <div class="quote">${fmt(km)} km · ${fmtH(hrs)} in volo</div>
      <small>${(km / EARTH_CIRC).toFixed(1).replace(".", ",")} giri del mondo in due${km >= MOON * 2 ? " — avete toccato la Luna e siete tornati! 🌙" : km > 0 ? ` · ${(km / (MOON * 2) * 100).toFixed(1).replace(".", ",")}% di un viaggio A/R sulla Luna 🌙` : ""}</small></div>
    <div class="card"><h3>📊 Testa a testa</h3>
      ${bar("Aeroporti unici", C.map(c => c.n))}
      ${bar("Paesi", C.map(c => c.countries.size))}
      ${bar("Continenti", C.map(c => c.conts.size))}
      ${bar("Chilometri (stima)", C.map(c => c.km))}
      ${bar("Ore di viaggio (stima)", C.map(c => c.hours), fmtH)}
      ${bar("Visite totali (stima)", C.map(c => c.visitsTot))}</div>
    <div class="card"><h3>💞 Quante volte negli stessi aeroporti</h3>
      ${[1, 2, 3, 4].map((b, i) => bar(BUCKETS[b].label + " " + BUCKETS[b].sub, dist4.map(d => d[i]))).join("")}</div>
    ${C.map((c, i) => tileFor(us[i], c)).join("")}
    <p class="muted">Km e ore sono stime: ogni aeroporto conta come andata e ritorno dalla base (1 volta = 1 A/R, 2–5 = 3, 6–10 = 8, 10+ = 12), in linea d'aria a ${CRUISE} km/h più ${LEG_OVERHEAD * 60} min per tratta.</p>`;
}

/* ---------- IO ---------- */
function renderIo() {
  const me = meta(state.me), d = mine(), h = BY[d.home], c = compute(d);
  $("#v-io").innerHTML = `
    <div class="card"><h2>${me.emoji} Ciao ${esc(me.name)}!</h2>
      <div class="muted">${c.n} aeroporti · ${c.countries.size} paesi · ${c.points} punti</div>
      <label class="field"><span>🏠 Aeroporto di casa (codice IATA)</span>
        <input id="homeIn" maxlength="3" value="${esc(d.home)}" placeholder="es. MXP, FCO, LIN" style="text-transform:uppercase"></label>
      <div class="muted" id="homeName">${h ? `${flag(h.cc)} ${esc(h.name)}` : "Serve per stimare km e ore."}</div></div>
    <div class="card"><h3>🔄 Passaggio dati</h3>
      ${online() ? `<p class="muted">Sincronizzazione attiva ☁️ (${syncState}) — l'altro vede i tuoi aeroporti in automatico.</p>
        <button class="btn small" id="syncNow">Aggiorna ora</button> <button class="btn small ghost" id="tokDel">Scollega</button>` :
        locked() ? `<div class="warn">Esci e rientra con la tua password per collegare questo telefono.</div>` :
        `<div class="warn">Configurazione da fare <b>una volta sola</b>: incolla la chiave GitHub e le due password.
          La chiave viene cifrata con le password e salvata nel sito; da lì in poi basta la password per entrare e sincronizzare, su qualsiasi telefono.</div>
        <label class="field"><span>🔑 Chiave GitHub</span><input id="tokIn" type="password" placeholder="github_pat_…" autocomplete="off"></label>
        ${CFG.users.map(u => `<label class="field"><span>Password di ${esc(u.name)}</span><input data-pw="${u.id}" type="password" autocomplete="off"></label>`).join("")}
        <button class="btn small" id="setupGo">Configura per entrambi</button>`}
      <p class="muted" style="margin-top:14px">Piano B senza chiave: scambiatevi il codice qui sotto.</p>
      <label class="field"><span>Il mio codice</span><textarea id="codeOut" readonly></textarea></label>
      <button class="btn small" id="copyCode">Copia codice</button>
      <label class="field"><span>Incolla un codice (tuo o dell'altro)</span><textarea id="codeIn" placeholder="AERO1:…"></textarea></label>
      <button class="btn small" id="importCode">Importa</button></div>
    <div class="card"><button class="btn ghost" id="logout">Esci 🚪</button></div>`;
  $("#codeOut").value = exportCode();
}
function exportCode() { return "AERO1:" + btoa(unescape(encodeURIComponent(JSON.stringify({ id: state.me, d: mine() })))); }
$("#v-io").addEventListener("input", e => {
  if (e.target.id !== "homeIn") return;
  const v = e.target.value.toUpperCase().trim(), a = BY[v];
  $("#homeName").textContent = a ? `${flag(a.cc)} ${a.name}` : (v.length === 3 ? "Codice non trovato (solo aeroporti con voli di linea)." : "");
  if (a) { mine().home = v; save(); toast(`Base impostata: ${a.city} 🏠`); }
});
$("#v-io").addEventListener("click", async e => {
  const id = e.target.id;
  if (id === "logout") logout();
  if (id === "syncNow") { await pull(); toast("Aggiornato ☁️"); renderIo(); }
  if (id === "tokDel") { store.set("aero:ghtoken", ""); paintSync(); renderIo(); }
  if (id === "setupGo") setup().catch(er => toast("Errore: " + er.message));
  if (id === "copyCode") { try { await navigator.clipboard.writeText($("#codeOut").value); toast("Codice copiato 📋"); } catch (er) { $("#codeOut").select(); toast("Selezionato: copia a mano"); } }
  if (id === "importCode") {
    try {
      const raw = $("#codeIn").value.trim().replace(/^AERO1:/, "");
      const j = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (!meta(j.id) || !j.d || typeof j.d.visits !== "object") throw 0;
      const cur = state.data[j.id];
      if (j.id === state.me && (cur.updated || 0) > (j.d.updated || 0)) return toast("Il tuo profilo qui è più recente: niente da importare.");
      state.data[j.id] = Object.assign(emptyUser(), j.d);
      store.set("aero:data:" + j.id, state.data[j.id]);
      if (j.id === state.me) save();
      toast(`Dati di ${meta(j.id).name} importati ✅`); renderIo();
    } catch (er) { toast("Codice non valido 🤔"); }
  }
});

async function setup() {
  const t = $("#tokIn").value.trim(), pw = {};
  $$("[data-pw]").forEach(i => pw[i.dataset.pw] = i.value);
  if (!t) return toast("Manca la chiave 🔑");
  for (const u of CFG.users) if (sha256("aerosfida|" + pw[u.id]) !== u.hash) return toast(`Password di ${u.name} sbagliata`);
  if (!window.crypto || !crypto.subtle) return toast("Serve https");
  store.set("aero:ghtoken", t); syncState = "…"; await pull();
  if (syncState !== "online ✓") { store.set("aero:ghtoken", ""); paintSync(); return toast("La chiave non apre il repo dei dati 🤔"); }
  await pushNow();
  toast("Cifro la chiave… 🔐");
  const users = [];
  for (const u of CFG.users) users.push({ id: u.id, name: u.name, emoji: u.emoji, color: u.color, lock: await lock(t, pw[u.id]) });
  const cfg = Object.assign({}, CFG, { users });
  const text = `// Configurazione di AeroSfida (generata dal sito).
// Nessuna password qui: per ogni giocatore c'è solo la chiave di sincronizzazione cifrata con la sua password.
window.AERO_CONFIG = ${JSON.stringify(cfg, null, 2)};
`;
  const url = `https://api.github.com/repos/${CFG.siteRepo}/contents/config.js`;
  const hd = { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" };
  const cur = await fetch(`${url}?ref=${encodeURIComponent(CFG.siteBranch)}&t=${Date.now()}`, { headers: hd, cache: "no-store" });
  if (!cur.ok) throw new Error("la chiave non può scrivere nel repo del sito");
  const r = await fetch(url, { method: "PUT", headers: hd, body: JSON.stringify({
    message: "Configura accesso cifrato", branch: CFG.siteBranch, sha: (await cur.json()).sha, content: b64enc(text) }) });
  if (!r.ok) throw new Error("salvataggio config non riuscito (" + r.status + ")");
  CFG.users.forEach((u, i) => { u.lock = users[i].lock; delete u.hash; });
  toast("Fatto! Tra un minuto il sito usa solo le password 🎉"); renderIo();
}

/* ---------- avvio ---------- */
document.addEventListener("visibilitychange", () => { if (!document.hidden && state.me) pull(); });
const saved = store.get("aero:me", null);
if (saved && meta(saved) && (!locked() || token())) enter(saved);
})();
