import { useState } from 'react';
import { Button } from './Button';
import { IconCheck, IconMistake } from './Icon';
import { update } from '../../lib/store';

export interface McOption {
  text: string;
  correct?: boolean;
  /** Why someone would pick this, and why it is wrong. Shown when they do. */
  why?: string;
}

export type Question =
  | { type: 'mc'; q: string; options: McOption[]; explain?: string }
  | {
      type: 'num';
      q: string;
      answer: number;
      unit: string;
      /** Relative tolerance, e.g. 0.05 for ±5%. */
      tolerance?: number;
      explain?: string;
      /** Shown when the answer is out by a factor of ~1000 (a unit slip). */
      unitHint?: string;
    };

export const numericIsCorrect = (
  given: number,
  answer: number,
  tolerance = 0.02,
): boolean => Math.abs(given - answer) <= Math.abs(answer * tolerance) + Number.EPSILON;

/** True when the answer is right but the unit prefix is out by 1000x either way. */
export const looksLikeUnitSlip = (given: number, answer: number): boolean =>
  [1000, 1 / 1000, 1e6, 1e-6].some((f) => numericIsCorrect(given, answer * f, 0.05));

export function Quiz({ questions, lessonSlug }: { questions: Question[]; lessonSlug: string }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [typed, setTyped] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const score = questions.reduce((sum, question, i) => {
    if (question.type === 'mc') {
      const choice = picked[i];
      return sum + (choice !== undefined && question.options[choice]?.correct ? 1 : 0);
    }
    const given = Number(typed[i]);
    return sum + (typed[i] !== undefined && typed[i] !== '' && numericIsCorrect(given, question.answer, question.tolerance) ? 1 : 0);
  }, 0);

  const check = () => {
    setChecked(true);
    update((p) => ({
      ...p,
      quizScores: {
        ...p.quizScores,
        [lessonSlug]: Math.max(p.quizScores[lessonSlug] ?? 0, score / questions.length),
      },
    }));
  };

  return (
    <section className="cb-ui bleed my-8 rounded-[var(--radius-lg)] border border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <h3 className="m-0 font-sans text-[15px] font-semibold tracking-tight text-ink">Quiz</h3>
        <span className="font-mono text-[12px] text-ink-3">
          {checked ? `${score} / ${questions.length}` : `${questions.length} questions`}
        </span>
      </header>

      <ol className="m-0 list-none p-0">
        {questions.map((question, i) => (
          <li key={i} className="border-b border-line px-5 py-4 last:border-b-0">
            <p className="m-0 flex gap-2 font-sans text-[15px] leading-[1.5] text-ink">
              <span className="font-mono text-[13px] text-ink-3">{i + 1}.</span>
              <span>{question.q}</span>
            </p>

            {question.type === 'mc' ? (
              <div className="mt-3 flex flex-col gap-1.5">
                {question.options.map((option, oi) => {
                  const selected = picked[i] === oi;
                  const reveal = checked && (selected || option.correct);
                  const good = Boolean(option.correct);
                  return (
                    <div key={oi}>
                      <button
                        onClick={() => !checked && setPicked({ ...picked, [i]: oi })}
                        disabled={checked}
                        className={[
                          'flex w-full items-start gap-2.5 rounded-[var(--radius-sm)] border px-3 py-2 text-left',
                          'font-sans text-[14.5px] transition-colors duration-[120ms]',
                          reveal && good
                            ? 'border-ok/60 bg-ok/10 text-ink'
                            : reveal && !good
                              ? 'border-danger/60 bg-danger/10 text-ink'
                              : selected
                                ? 'border-accent bg-accent-dim text-ink'
                                : 'border-line bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink',
                        ].join(' ')}
                      >
                        <span className="mt-0.5 shrink-0">
                          {reveal ? (
                            good ? (
                              <IconCheck size={15} className="text-ok" />
                            ) : (
                              <IconMistake size={15} className="text-danger" />
                            )
                          ) : (
                            <span className="inline-block h-3.5 w-3.5 rounded-full border border-current opacity-60" />
                          )}
                        </span>
                        {option.text}
                      </button>
                      {checked && selected && !good && option.why && (
                        <p className="mt-1.5 ml-7 mr-1 font-sans text-[13.5px] leading-[1.55] text-ink-2">
                          <span className="text-danger">Why that is tempting: </span>
                          {option.why}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={typed[i] ?? ''}
                  disabled={checked}
                  onChange={(e) => setTyped({ ...typed, [i]: e.target.value })}
                  placeholder="your answer"
                  className="h-9 w-32 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 font-mono text-[14px] text-ink tabular-nums placeholder:text-ink-3 focus:border-accent"
                />
                <span className="font-mono text-[14px] text-ink-2">{question.unit}</span>
                {checked &&
                  (numericIsCorrect(Number(typed[i]), question.answer, question.tolerance) ? (
                    <span className="inline-flex items-center gap-1 font-sans text-[13px] text-ok">
                      <IconCheck size={14} /> correct
                    </span>
                  ) : (
                    <span className="font-sans text-[13px] text-danger">
                      answer: {question.answer} {question.unit}
                      {looksLikeUnitSlip(Number(typed[i]), question.answer) &&
                        ` — you are out by a factor of a thousand. ${question.unitHint ?? 'Check your milli/kilo prefixes.'}`}
                    </span>
                  ))}
              </div>
            )}

            {checked && question.explain && (
              <p className="mt-3 border-l-2 border-line-strong pl-3 font-sans text-[13.5px] leading-[1.55] text-ink-2">
                {question.explain}
              </p>
            )}
          </li>
        ))}
      </ol>

      <footer className="flex items-center gap-3 px-5 py-3">
        {!checked ? (
          <Button variant="primary" size="sm" onClick={check}>
            Check answers
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              onClick={() => {
                setChecked(false);
                setPicked({});
                setTyped({});
              }}
            >
              Try again
            </Button>
            <span className="font-sans text-[13px] text-ink-2">
              {score === questions.length
                ? 'All correct. That is the whole module understood, not just read.'
                : score >= questions.length - 1
                  ? 'Close. Read the explanation on the one you missed.'
                  : 'Worth re-reading the section before moving on.'}
            </span>
          </>
        )}
      </footer>
    </section>
  );
}
