// Configurazione di AeroSfida.
window.AERO_CONFIG = {
  // Le password NON sono scritte in chiaro: qui c'è solo l'hash SHA-256 di "aerosfida|<password>".
  users: [
    { id: "luca",  name: "Luca",  emoji: "🧳", color: "#0e9aa7", hash: "873df55ff2e6b7c5d38479b98e57a577a2862c9995a8b8952a52cc8d82500fb9" },
    { id: "andrea", name: "Andrea", emoji: "🎒", color: "#f26b21", hash: "812e91c11c70e743dda6ec7070308275e49f18da20ab2960b0c3f00d7bef113b" }
  ],
  // Sincronizzazione: i dati stanno nel repo PRIVATO qui sotto (data/<id>.json).
  // La chiave di accesso non è nel codice: ognuno la incolla una volta in "Io".
  dataRepo: "klide1010/aero-challenge-data",
  dataBranch: "main"
};
