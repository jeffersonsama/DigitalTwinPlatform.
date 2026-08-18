import { useEffect, useState } from 'react';
import { planDetailPath } from '../data/plansFins.js';
import './DetailInsert.css';

const DETAIL_MS = 2000;

// Insert de plan de détail (Livre de prompts n°2, §0.1 et Partie 3 — explicitement facultatif,
// « le jeu vit sans ») : quand `trigger` correspond au `declencheur` d'une entrée de `details`,
// affiche son image 2 s puis disparaît. `details` vient de NODE_DETAILS[node.id] (plansFins.js).
export default function DetailInsert({ details, trigger }) {
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!trigger || !details?.length) return undefined;
    const entry = details.find((d) => d.declencheur === trigger);
    if (!entry) return undefined;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setShown(entry.img);
    };
    img.src = planDetailPath(entry.img);

    const t = setTimeout(() => {
      if (!cancelled) setShown(null);
    }, DETAIL_MS);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trigger, details]);

  if (!shown) return null;

  return (
    <div className="detail-insert" aria-hidden="true">
      <img src={planDetailPath(shown)} alt="" className="detail-insert-img" />
    </div>
  );
}
