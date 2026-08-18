// Interface commune consommée par le reste du mode atelier — deux implémentations :
// Supabase (temps réel multi-appareils) ou relais local (démo mono-poste, voir SETUP_ATELIER.md).
// Aucun autre fichier du mode atelier n'importe supabaseBackend/localBackend directement.
import { supabaseConfigured } from './supabaseClient.js';
import { createSupabaseBackend } from './supabaseBackend.js';
import { createLocalBackend } from './localBackend.js';
import { generateSessionCode } from './codes.js';

export const isLiveBackend = supabaseConfigured;

const impl = supabaseConfigured ? createSupabaseBackend() : createLocalBackend();

// Génère un code de session unique (retente en cas de collision — improbable mais gratuit à parer).
async function createSessionWithUniqueCode(jeu) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSessionCode();
    const existing = await impl.getSessionByCode(code);
    if (!existing) return impl.createSession({ jeu, code });
  }
  throw new Error('Impossible de générer un code de session unique — réessayez.');
}

export const backend = {
  ...impl,
  createSession: ({ jeu }) => createSessionWithUniqueCode(jeu),
};
