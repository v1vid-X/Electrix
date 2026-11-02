import { useEffect, useRef, useState } from 'react';
import type { Quality } from './LabScene';

const ORDER: Quality[] = ['low', 'medium', 'high'];

/** Watches the real frame rate and steps the quality down if the machine cannot keep up.
 *
 *  The expensive settings — reflections and the board's surface relief — are close to free
 *  on a modern GPU and very costly without one, and there is no reliable way to tell which
 *  a visitor has. So rather than guess, measure: if the first couple of seconds are slow,
 *  drop a level. It only ever goes down, at most to 'low', and never fights a manual choice.
 */
export function useAutoQuality(
  quality: Quality,
  setQuality: (q: Quality) => void,
): { downgraded: boolean; fps: number | null } {
  const [downgraded, setDowngraded] = useState(false);
  const [fps, setFps] = useState<number | null>(null);
  const manual = useRef(false);
  const lastSet = useRef(quality);

  // Any change we did not make ourselves is the learner's choice; stop interfering.
  useEffect(() => {
    if (quality !== lastSet.current) manual.current = true;
  }, [quality]);

  useEffect(() => {
    if (manual.current) return;
    let frames = 0;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      frames += 1;
      const elapsed = performance.now() - start;
      if (elapsed < 2500) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const measured = (frames * 1000) / elapsed;
      setFps(Math.round(measured));
      const index = ORDER.indexOf(quality);
      if (measured < 24 && index > 0) {
        const next = ORDER[index - 1];
        lastSet.current = next;
        setQuality(next);
        setDowngraded(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [quality, setQuality]);

  return { downgraded, fps };
}
