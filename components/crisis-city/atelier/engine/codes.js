// Codes de session (6 caractères, sans caractères ambigus — 1.2 du document n°5) et identifiant
// anonyme de participant persistant sur l'appareil.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // pas de O/0, I/1

export function generateSessionCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

const CLIENT_ID_KEY = 'crisisCityAtelierClientId';

// sessionStorage, pas localStorage : chaque appareil réel n'a qu'un seul onglet de toute façon,
// mais en mode démo locale (SETUP_ATELIER.md, §4) plusieurs onglets du MÊME navigateur simulent
// plusieurs téléphones — localStorage étant partagé entre onglets d'une même origine, il ferait
// collisionner leurs identifiants. sessionStorage est isolé par onglet, ce qu'il faut ici.
export function getClientId() {
  try {
    let id = window.sessionStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      window.sessionStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}
