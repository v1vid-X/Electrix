import { Link } from 'react-router-dom';
import { ALL_LESSONS } from '../lib/lessons';

export function LessonsPage() {
  return (
    <main className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6">
      <h1 className="m-0 font-sans text-[length:var(--t-h1)] font-bold tracking-[-0.02em] text-ink">
        Lessons
      </h1>
      <p className="mt-2 mb-0 max-w-[60ch] font-serif text-[1.0625rem] leading-[1.6] text-ink-2">
        Written in order. Each one assumes only what came before it. The full plan, including the
        modules that are not written yet, is in <code className="font-mono text-[0.9em]">curriculum/00-roadmap.md</code>.
      </p>

      <ul className="mt-8 flex list-none flex-col gap-2 p-0">
        {ALL_LESSONS.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              to={`/lesson/${lesson.slug}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3 no-underline transition-colors duration-[120ms] hover:border-line-strong"
            >
              <span className="font-mono text-[13px] tabular-nums text-accent">
                {String(lesson.module).padStart(2, '0')}
              </span>
              <span className="font-sans text-[15.5px] font-medium text-ink">{lesson.title}</span>
              <span className="min-w-0 flex-1 font-sans text-[13.5px] text-ink-2">
                {lesson.summary}
              </span>
              <span className="font-mono text-[12px] text-ink-3">{lesson.minutes} min</span>
              {lesson.needsParts && (
                <span className="rounded-full border border-line-strong px-2 py-0.5 font-sans text-[11px] text-ink-3">
                  needs parts
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
