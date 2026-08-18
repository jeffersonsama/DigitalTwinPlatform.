import { useEffect, useState } from 'react';
import { backend } from './backend.js';

// Qui est sur le site MAINTENANT, jeu principal et atelier confondus (voir useSitePresence.js
// côté émission). Sert à distinguer, sur la carte admin, les gens « juste sur la plateforme »
// de ceux actuellement dans un jeu précis (useLiveParticipants.js).
export function useSiteAttendance() {
  const [attendees, setAttendees] = useState([]);
  useEffect(() => backend.sitePresence.subscribe(setAttendees), []);
  return attendees;
}
