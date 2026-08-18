import { useEffect, useRef, useState } from 'react';
import { planApprochePath, planSeuilPath } from '../data/plansFins.js';
import './EntreeSequence.css';

const APPROCHE_MS = 600;
const SEUIL_MS = 600;

function probeImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Séquence d'entrée dans un lieu (Livre de prompts n°2, §0.1) : plan d'approche puis plan de
// seuil, 600 ms chacun, avant que SceneStage n'ouvre le décor de scène. Chaque image est
// optionnelle — absente ou en échec de chargement → l'étape est sautée, rien ne casse (§0.4).
// `onDone` est appelé exactement une fois, que la séquence ait montré 0, 1 ou 2 images.
export default function EntreeSequence({ lieu3d, onDone }) {
  const [shot, setShot] = useState(null); // { phase: 'approche' | 'seuil', src } | null
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!lieu3d || prefersReducedMotion()) {
      setShot(null);
      onDoneRef.current();
      return undefined;
    }

    let cancelled = false;
    const timers = [];
    const finish = () => {
      if (cancelled) return;
      setShot(null);
      onDoneRef.current();
    };
    const runSeuil = async () => {
      const src = await probeImage(planSeuilPath(lieu3d));
      if (cancelled) return;
      if (src) {
        setShot({ phase: 'seuil', src });
        timers.push(setTimeout(finish, SEUIL_MS));
      } else {
        finish();
      }
    };

    (async () => {
      const src = await probeImage(planApprochePath(lieu3d));
      if (cancelled) return;
      if (src) {
        setShot({ phase: 'approche', src });
        timers.push(setTimeout(runSeuil, APPROCHE_MS));
      } else {
        runSeuil();
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [lieu3d]);

  if (!shot) return null;

  return (
    <div className="entree-sequence" aria-hidden="true">
      <img key={shot.src} src={shot.src} alt="" className="entree-sequence-img" />
    </div>
  );
}
