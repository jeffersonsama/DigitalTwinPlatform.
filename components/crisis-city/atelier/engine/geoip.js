import { COUNTRIES } from '../data/countryGeo.js';

// Détection du pays via l'IP publique du participant — deux services gratuits sans clé, essayés
// dans l'ordre (repli si le premier est indisponible/bloqué/en rate-limit). Nécessite internet
// (déjà requis par le backend Supabase temps réel) ; retourne null si tout échoue — l'appelant
// doit alors proposer un repli manuel (voir ParticipantS1.jsx).
const ENDPOINTS = [
  { url: 'https://ipapi.co/json/', code: (d) => d.country_code || d.country },
  { url: 'https://ipwho.is/', code: (d) => d.country_code },
];

export async function detectCountryCode({ timeoutMs = 4000 } = {}) {
  for (const { url, code } of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const cc = (code(data) || '').toUpperCase();
      if (cc && COUNTRIES[cc]) return cc;
    } catch (e) {
      // essaie le service suivant
    }
  }
  return null;
}
