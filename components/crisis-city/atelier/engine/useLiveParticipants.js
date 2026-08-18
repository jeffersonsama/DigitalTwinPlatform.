import { useEffect, useState } from 'react';
import { backend } from './backend.js';

// Qui est connecté MAINTENANT, toutes sessions/jeux confondus (présence temps réel — incrémente
// à la connexion, décrémente à la déconnexion). Alimente la vue admin « carte mondiale »
// (AdminMapScreen.jsx), par opposition à un historique persistant qui ne ferait que grossir.
export function useLiveParticipants() {
  const [participants, setParticipants] = useState([]);

  useEffect(() => backend.presence.subscribe(setParticipants), []);

  return participants;
}
