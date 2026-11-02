import { useMemo, useState } from 'react';
import { Button } from './Button';
import { dueQueue, newCardState, review, type Flashcard, type Grade } from '../../lib/srs';
import { load, update } from '../../lib/store';

const GRADES: { grade: Grade; label: string; hint: string }[] = [
  { grade: 'again', label: 'Again', hint: 'no idea' },
  { grade: 'hard', label: 'Hard', hint: 'got there slowly' },
  { grade: 'good', label: 'Good', hint: 'knew it' },
  { grade: 'easy', label: 'Easy', hint: 'instant' },
];

export function Flashcards({ cards, module }: { cards: Flashcard[]; module: number }) {
  const [states, setStates] = useState(() => load().cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [started, setStarted] = useState(false);

  const queue = useMemo(() => dueQueue(cards, states), [cards, states]);
  const card = queue[index];

  const grade = (g: Grade) => {
    if (!card) return;
    const next = review(states[card.id] ?? newCardState(card.id), g);
    const merged = { ...states, [card.id]: next };
    setStates(merged);
    update((p) => ({ ...p, cards: { ...p.cards, [card.id]: next } }));
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  if (!started) {
    return (
      <section className="cb-ui bleed my-8 rounded-[var(--radius-lg)] border border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="m-0 font-sans text-[15px] font-semibold text-ink">
              Flashcards for this module
            </h3>
            <p className="m-0 mt-1 font-sans text-[13.5px] text-ink-2">
              {cards.length} cards · {queue.length} due now. They come back on a schedule, so the
              words stick without you re-reading the lesson.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setStarted(true)} disabled={queue.length === 0}>
            {queue.length === 0 ? 'Nothing due' : `Review ${queue.length}`}
          </Button>
        </div>
      </section>
    );
  }

  if (!card) {
    return (
      <section className="cb-ui bleed my-8 rounded-[var(--radius-lg)] border border-line bg-surface px-5 py-6 text-center">
        <p className="m-0 font-sans text-[15px] text-ink">Deck finished.</p>
        <p className="m-0 mt-1 font-sans text-[13.5px] text-ink-2">
          The ones you found hard will come back sooner than the ones you found easy.
        </p>
      </section>
    );
  }

  return (
    <section className="cb-ui bleed my-8 rounded-[var(--radius-lg)] border border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-5 py-2.5">
        <span className="font-sans text-[12px] uppercase tracking-[0.08em] text-ink-3">
          Module {module} · card {index + 1} of {queue.length}
        </span>
      </header>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="block w-full px-5 py-8 text-left"
        aria-label={flipped ? 'Show question' : 'Show answer'}
      >
        <p className="m-0 font-serif text-[1.3rem] leading-[1.45] text-ink">{card.front}</p>
        {flipped ? (
          <p className="m-0 mt-4 border-t border-line pt-4 font-serif text-[1.0625rem] leading-[1.6] text-ink-2">
            {card.back}
          </p>
        ) : (
          <p className="m-0 mt-4 font-sans text-[13px] text-ink-3">
            Answer it in your head, then click to check.
          </p>
        )}
      </button>

      {flipped && (
        <footer className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
          {GRADES.map((g) => (
            <Button key={g.grade} size="sm" onClick={() => grade(g.grade)} title={g.hint}>
              {g.label}
            </Button>
          ))}
        </footer>
      )}
    </section>
  );
}
