// Implémentation Supabase de l'interface backend (voir engine/backend.js pour le contrat).
import { supabase } from './supabaseClient.js';

// Présence en direct via Supabase Realtime Presence — qui est connecté MAINTENANT (incrémente
// à la connexion, décrémente à la déconnexion), sans table Postgres. Chaque client `track()`
// lui-même sur un channel nommé ; les écrans qui n'observent qu'écoutent (jamais track()).
// Une seule implémentation, deux channels indépendants : `presence` (par jeu/session atelier)
// et `sitePresence` (n'importe quelle page du site — voir useSitePresence.js).
function createPresenceApi(channelName) {
  return {
    enter(payload) {
      const channel = supabase.channel(channelName, { config: { presence: { key: payload.clientId } } });
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track(payload);
      });
      return () => {
        channel.untrack();
        supabase.removeChannel(channel);
      };
    },

    subscribe(onChange) {
      const channel = supabase.channel(channelName);
      const emit = () => onChange(Object.values(channel.presenceState()).flat());
      channel.on('presence', { event: 'sync' }, emit);
      channel.subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}

export function createSupabaseBackend() {
  return {
    async createSession({ jeu, code }) {
      const { data, error } = await supabase
        .from('atelier_sessions')
        .insert({ jeu, code, phase: 'lobby', payload: {} })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async getSessionByCode(code) {
      const { data, error } = await supabase
        .from('atelier_sessions')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getSessionById(id) {
      const { data, error } = await supabase.from('atelier_sessions').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateSessionPhase(id, phase, payload = {}) {
      const { error } = await supabase.from('atelier_sessions').update({ phase, payload }).eq('id', id);
      if (error) throw error;
    },

    subscribeSession(id, onChange) {
      const channel = supabase
        .channel(`session:${id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'atelier_sessions', filter: `id=eq.${id}` },
          (payload) => onChange(payload.new)
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    },

    async addParticipant(sessionId, { clientId, pays, crise }) {
      const { data, error } = await supabase
        .from('atelier_participants')
        .upsert({ session_id: sessionId, client_id: clientId, pays, crise }, { onConflict: 'session_id,client_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async fetchParticipants(sessionId) {
      const { data, error } = await supabase
        .from('atelier_participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return data;
    },

    presence: createPresenceApi('atelier-presence'),
    sitePresence: createPresenceApi('site-presence'),

    async getParticipant(sessionId, clientId) {
      const { data, error } = await supabase
        .from('atelier_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('client_id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async submitResponse(sessionId, participantId, manche, payload) {
      const { error } = await supabase
        .from('atelier_reponses')
        .upsert(
          { session_id: sessionId, participant_id: participantId, manche, payload },
          { onConflict: 'session_id,participant_id,manche' }
        );
      if (error) throw error;
    },

    async fetchResponses(sessionId, manche) {
      let query = supabase.from('atelier_reponses').select('*').eq('session_id', sessionId);
      if (manche) query = query.eq('manche', manche);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    subscribeResponses(sessionId, onInsert) {
      const channel = supabase
        .channel(`reponses:${sessionId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'atelier_reponses', filter: `session_id=eq.${sessionId}` },
          (payload) => onInsert(payload.new)
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}
