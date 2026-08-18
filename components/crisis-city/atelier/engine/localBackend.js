// Relais local sans réseau — mode démo (voir SETUP_ATELIER.md, §4). Fonctionne entre plusieurs
// onglets/fenêtres du MÊME navigateur via localStorage + l'évènement natif `storage` (qui se
// déclenche dans les AUTRES onglets quand une valeur change — exactement le mécanisme de
// notification qu'il nous faut, sans dépendance supplémentaire). Ne fonctionne pas entre
// plusieurs appareils physiques — pour ça, il faut Supabase (engine/supabaseBackend.js).
const STORE_KEY = 'crisisCityAtelierStore.v1';

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : { sessions: {}, participants: {}, responses: {} };
  } catch (e) {
    return { sessions: {}, participants: {}, responses: {} };
  }
}

function writeStore(store) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  return store;
}

function uid(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

// Présence en direct — clef localStorage séparée du store principal (écriture fréquente, ne
// doit pas réécrire tout le reste). Pas d'évènement de fermeture d'onglet fiable à 100 % (mobile
// inclus), donc heartbeat + TTL : un présent qui n'a pas rafraîchi depuis TTL_MS est considéré
// déconnecté. Équivalent local du Presence temps réel de Supabase (voir supabaseBackend.js).
// Une seule implémentation, deux instances indépendantes (clefs différentes) : `presence`
// (par jeu/session atelier) et `sitePresence` (n'importe quelle page du site, jeu principal
// inclus — prototype de l'attendance en ligne destiné à la plateforme YKF, voir useSitePresence.js).
const HEARTBEAT_MS = 4000;
const TTL_MS = 11000;

function createPresenceApi(storageKey) {
  function read() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function write(store) {
    window.localStorage.setItem(storageKey, JSON.stringify(store));
  }

  return {
    enter(payload) {
      const { clientId } = payload;
      function beat() {
        const store = read();
        store[clientId] = { ...payload, lastSeen: Date.now() };
        write(store);
      }
      beat();
      const interval = setInterval(beat, HEARTBEAT_MS);
      function leave() {
        clearInterval(interval);
        const store = read();
        delete store[clientId];
        write(store);
        window.removeEventListener('beforeunload', leave);
        window.removeEventListener('pagehide', leave);
      }
      window.addEventListener('beforeunload', leave);
      window.addEventListener('pagehide', leave);
      return leave;
    },

    subscribe(onChange) {
      function emit() {
        const store = read();
        const now = Date.now();
        onChange(Object.values(store).filter((p) => now - p.lastSeen < TTL_MS));
      }
      emit();
      const poll = setInterval(emit, 2000); // détecte les TTL expirés même sans évènement storage
      const onStorage = (e) => { if (e.key === storageKey) emit(); };
      window.addEventListener('storage', onStorage);
      return () => {
        clearInterval(poll);
        window.removeEventListener('storage', onStorage);
      };
    },
  };
}

export function createLocalBackend() {
  const sessionListeners = new Map(); // sessionId -> Set<cb>
  const responseListeners = new Map(); // sessionId -> { cb, seen: Set<responseId> }[]

  window.addEventListener('storage', (e) => {
    if (e.key !== STORE_KEY || !e.newValue) return;
    const store = JSON.parse(e.newValue);

    for (const [sessionId, cbs] of sessionListeners) {
      const session = store.sessions[sessionId];
      if (session) cbs.forEach((cb) => cb(session));
    }

    for (const [sessionId, entries] of responseListeners) {
      const all = Object.values(store.responses).filter((r) => r.session_id === sessionId);
      for (const entry of entries) {
        for (const r of all) {
          if (!entry.seen.has(r.id)) {
            entry.seen.add(r.id);
            entry.cb(r);
          }
        }
      }
    }
  });

  return {
    async createSession({ jeu, code }) {
      const store = readStore();
      const session = { id: uid('s'), code, jeu, phase: 'lobby', payload: {}, created_at: new Date().toISOString() };
      store.sessions[session.id] = session;
      writeStore(store);
      return session;
    },

    async getSessionByCode(code) {
      const store = readStore();
      return Object.values(store.sessions).find((s) => s.code === code) || null;
    },

    async getSessionById(id) {
      const store = readStore();
      return store.sessions[id] || null;
    },

    async updateSessionPhase(id, phase, payload = {}) {
      const store = readStore();
      if (!store.sessions[id]) return;
      store.sessions[id] = { ...store.sessions[id], phase, payload };
      writeStore(store);
      // Le propre onglet ne reçoit pas l'évènement `storage` natif : on notifie directement.
      (sessionListeners.get(id) || new Set()).forEach((cb) => cb(store.sessions[id]));
    },

    subscribeSession(id, onChange) {
      if (!sessionListeners.has(id)) sessionListeners.set(id, new Set());
      sessionListeners.get(id).add(onChange);
      return () => sessionListeners.get(id)?.delete(onChange);
    },

    async addParticipant(sessionId, { clientId, pays, crise }) {
      const store = readStore();
      let participant = Object.values(store.participants).find(
        (p) => p.session_id === sessionId && p.client_id === clientId
      );
      if (!participant) {
        participant = { id: uid('p'), session_id: sessionId, client_id: clientId, pays, crise, joined_at: new Date().toISOString() };
      } else {
        participant = { ...participant, pays, crise };
      }
      store.participants[participant.id] = participant;
      writeStore(store);
      return participant;
    },

    async fetchParticipants(sessionId) {
      const store = readStore();
      return Object.values(store.participants)
        .filter((p) => p.session_id === sessionId)
        .sort((a, b) => (a.joined_at < b.joined_at ? -1 : 1));
    },

    presence: createPresenceApi('crisisCityAtelierPresence.v1'),
    sitePresence: createPresenceApi('crisisCitySitePresence.v1'),

    async getParticipant(sessionId, clientId) {
      const store = readStore();
      return Object.values(store.participants).find((p) => p.session_id === sessionId && p.client_id === clientId) || null;
    },

    async submitResponse(sessionId, participantId, manche, payload) {
      const store = readStore();
      let existing = Object.values(store.responses).find(
        (r) => r.session_id === sessionId && r.participant_id === participantId && r.manche === manche
      );
      const id = existing ? existing.id : uid('r');
      store.responses[id] = { id, session_id: sessionId, participant_id: participantId, manche, payload, created_at: new Date().toISOString() };
      writeStore(store);
      if (!existing) {
        for (const entries of responseListeners.get(sessionId) || []) {
          entries.seen.add(id);
          entries.cb(store.responses[id]);
        }
      }
    },

    async fetchResponses(sessionId, manche) {
      const store = readStore();
      return Object.values(store.responses).filter(
        (r) => r.session_id === sessionId && (!manche || r.manche === manche)
      );
    },

    subscribeResponses(sessionId, onInsert) {
      if (!responseListeners.has(sessionId)) responseListeners.set(sessionId, []);
      const entry = { cb: onInsert, seen: new Set() };
      responseListeners.get(sessionId).push(entry);
      return () => {
        const arr = responseListeners.get(sessionId) || [];
        const idx = arr.indexOf(entry);
        if (idx >= 0) arr.splice(idx, 1);
      };
    },
  };
}
