// Initialise le client Supabase si les variables d'environnement sont présentes.
// Sinon, `null` — engine/backend.js bascule alors sur le relais local (voir SETUP_ATELIER.md).
import { createClient } from '@supabase/supabase-js';

// Next.js expose les variables d'environnement préfixées NEXT_PUBLIC_ au bundle client
// (équivalent du préfixe VITE_ du build Vite d'origine).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(url && anonKey);

export const supabase = supabaseConfigured ? createClient(url, anonKey) : null;
