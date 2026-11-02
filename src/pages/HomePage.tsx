import { Link } from 'react-router-dom';
import { ALL_LESSONS } from '../lib/lessons';
import { load, streak } from '../lib/store';
import { Button } from '../components/ui/Button';

export function HomePage() {
  const progress = load();
  const done = progress.completed.length;
  const first = ALL_LESSONS[0];
  const days = streak(progress.studyDays);

  return (
    <main className="mx-auto max-w-[1320px] px-4 sm:px-6">
      <section className="grid gap-10 border-b border-line py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <p className="m-0 font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
            electronics from zero
          </p>
          <h1 className="mt-4 mb-0 max-w-[22ch] font-sans text-[length:var(--t-display)] font-bold leading-[1.05] tracking-[-0.02em] text-ink">
            Understand the circuit, not just the tutorial.
          </h1>
          <p className="mt-5 mb-0 max-w-[52ch] font-serif text-[1.1875rem] leading-[1.65] text-ink-2">
            Start at charge and voltage. Finish by designing, ordering and debugging your own
            ESP32 board. Every lesson explains <em>why</em> before <em>how</em>, and every idea
            has something you can poke at.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {first && (
              <Link to={`/lesson/${first.slug}`} className="no-underline">
                <Button variant="primary">Start Module {first.module}</Button>
              </Link>
            )}
            <Link to="/lab" className="no-underline">
              <Button>Open the Lab</Button>
            </Link>
          </div>
          <dl className="mt-8 flex gap-8 border-t border-line pt-5">
            <Stat label="lessons written" value={String(ALL_LESSONS.length)} />
            <Stat label="completed" value={String(done)} />
            <Stat label="day streak" value={String(days)} />
          </dl>
        </div>

        <aside className="self-start rounded-[var(--radius-lg)] border border-line bg-surface p-5">
          <h2 className="m-0 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            How this works
          </h2>
          <ol className="mt-4 mb-0 flex list-none flex-col gap-4 p-0">
            {[
              ['Read a section', 'Twenty to thirty minutes each, so you can stop anywhere.'],
              ['Play with the widget', 'Move the sliders until the relationship feels obvious.'],
              ['Build it in the Lab', 'A 3D breadboard with a real circuit simulator behind it.'],
              ['Then build it for real', 'With a parts list and a what-to-check-first list.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-[12px] text-ink-3">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-sans text-[14.5px] font-medium text-ink">{title}</span>
                  <span className="block font-sans text-[13.5px] leading-[1.5] text-ink-2">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="py-12">
        <h2 className="m-0 font-sans text-[length:var(--t-h2)] font-semibold tracking-tight text-ink">
          Where you are
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_LESSONS.map((lesson) => {
            const complete = progress.completed.includes(lesson.slug);
            const score = progress.quizScores[lesson.slug];
            return (
              <Link
                key={lesson.slug}
                to={`/lesson/${lesson.slug}`}
                className="group flex flex-col rounded-[var(--radius-md)] border border-line bg-surface p-4 no-underline transition-colors duration-[120ms] hover:border-line-strong"
              >
                <span className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                  <span>module {lesson.module}</span>
                  <span>{lesson.minutes} min</span>
                </span>
                <span className="mt-2 font-sans text-[15.5px] font-semibold leading-[1.3] text-ink">
                  {lesson.title}
                </span>
                <span className="mt-1.5 font-sans text-[13.5px] leading-[1.5] text-ink-2">
                  {lesson.summary}
                </span>
                <span className="mt-3 flex items-center gap-2 border-t border-line pt-2.5 font-mono text-[11.5px] text-ink-3">
                  {complete && <span className="text-ok">done</span>}
                  {score !== undefined && <span>quiz {Math.round(score * 100)}%</span>}
                  {!complete && score === undefined && <span>not started</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="m-0 font-mono text-[1.5rem] leading-none tabular-nums text-ink">{value}</dd>
      <dt className="mt-1.5 font-sans text-[12px] uppercase tracking-[0.08em] text-ink-3">
        {label}
      </dt>
    </div>
  );
}
