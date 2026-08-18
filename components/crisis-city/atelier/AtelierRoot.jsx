import React from 'react';
import AnimateurScreen from './AnimateurScreen.jsx';
import ParticipantScreen from './ParticipantScreen.jsx';
import AtelierMenu from './AtelierMenu.jsx';
import AdminMapScreen from './AdminMapScreen.jsx';
import './atelier.css';

// Point d'entrée du mode atelier — monté par app/crisis-city/admin/page.tsx (gardé par
// requireAdmin(), voir CrisisCityAdminLoader.tsx pour le décodage de ?atelier=... en `mode`) :
// animateur[&jeu=s1]   → écran à projeter
// rejoindre[&code=XXX] → écran participant (accessible aussi, sans auth, sur /crisis-city/join)
// carte                → vue admin, carte mondiale toutes sessions/jeux confondus
// menu ou valeur inconnue → menu de choix (jamais une page blanche)
export default function AtelierRoot({ mode, jeu, code }) {
  if (mode === 'animateur') return <AnimateurScreen jeu={jeu || 's1'} />;
  if (mode === 'rejoindre') return <ParticipantScreen initialCode={code} />;
  if (mode === 'carte') return <AdminMapScreen />;
  return <AtelierMenu />;
}
