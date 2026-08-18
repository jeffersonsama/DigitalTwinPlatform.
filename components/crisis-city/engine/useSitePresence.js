import { useEffect } from 'react';
import { backend } from '../atelier/engine/backend.js';
import { detectCountryCode } from '../atelier/engine/geoip.js';
import { getClientId } from '../atelier/engine/codes.js';

// Présence « je suis sur le site » — comptée dès que l'app charge, jeu principal OU atelier,
// indépendamment de toute session de jeu. Prototype de l'attendance en ligne temps réel : la
// plateforme YKF qui hébergera Crisis City ne fait pas encore ce suivi ; on le construit ici
// d'abord, à reprendre tel quel côté plateforme ensuite (voir engine/backend.js#sitePresence).
// `enabled=false` sur les écrans animateur/admin — ce sont des tableaux de bord d'organisateurs,
// pas des visiteurs à compter dans l'attendance (voir main.jsx).
export function useSitePresence(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let leave = null;
    detectCountryCode().then((pays) => {
      if (cancelled) return;
      leave = backend.sitePresence.enter({ pays, clientId: getClientId() });
    });
    return () => {
      cancelled = true;
      leave?.();
    };
  }, [enabled]);
}
