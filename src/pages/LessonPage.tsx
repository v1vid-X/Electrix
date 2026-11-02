import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ALL_LESSONS, lessonBySlug, tableOfContents } from '../lib/lessons';
import { LessonBody } from '../components/LessonBody';
import { Button } from '../components/ui/Button';
import { IconCheck } from '../components/ui/Icon';
import { load, markStudiedToday, update } from '../lib/store';

export function LessonPage() {
  const { slug = '' } = useParams();
  const lesson = lessonBySlug(slug);
  const toc = useMemo(() => (lesson ? tableOfContents(lesson.body) : []), [lesson]);
  const [done, setDone] = useState(() => load().completed.includes(slug));
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    setDone(load().completed.includes(slug));
    markStudiedToday();
  }, [slug]);

  // Highlight the section currently being read.
  useEffect(() => {
    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  if (!lesson) {
    return (
      <main className="mx-auto max-w-[68ch] px-4 py-24 text-center">
        <h1 className="font-sans text-[length:var(--t-h1)] text-ink">No lesson here yet</h1>
        <p className="font-serif text-ink-2">
          This module has not been written. The plan for it is in{' '}
          <code>curriculum/00-roadmap.md</code>.
        </p>
        <Link to="/lessons" className="no-underline">
          <Button>Back to lessons</Button>
        </Link>
      </main>
    );
  }

  const index = ALL_LESSONS.findIndex((l) => l.slug === slug);
  const prev = ALL_LESSONS[index - 1];
  const next = ALL_LESSONS[index + 1];

  const toggleDone = () => {
    const nextDone = !done;
    setDone(nextDone);
    update((p) => ({
      ...p,
      completed: nextDone
        ? [...new Set([...p.completed, slug])]
        : p.completed.filter((s) => s !== slug),
    }));
  };

  return (
    <div className="mx-auto flex max-w-[1320px] gap-10 px-4 sm:px-6">
      <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[232px] shrink-0 overflow-y-auto py-10 lg:block">
        <p className="m-0 font-sans text-[11px] uppercase tracking-[0.1em] text-ink-3">
          On this page
        </p>
        <ul className="mt-3 flex list-none flex-col gap-0.5 p-0">
          {toc.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className={[
                  'block border-l py-1 no-underline transition-colors duration-[120ms]',
                  entry.level === 3 ? 'pl-5 text-[12.5px]' : 'pl-3 text-[13px]',
                  activeId === entry.id
                    ? 'border-accent text-ink'
                    : 'border-line text-ink-2 hover:border-line-strong hover:text-ink',
                ].join(' ')}
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="mx-auto min-w-0 flex-1 py-10 xl:max-w-[920px]">
        <header className="mb-10">
          <p className="m-0 flex flex-wrap items-center gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-3">
            <span className="text-accent">module {lesson.module}</span>
            <span>{lesson.minutes} min</span>
            {lesson.needsParts && <span>needs parts</span>}
          </p>
          <h1 className="mt-3 mb-0 max-w-[26ch] font-sans text-[length:var(--t-h1)] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
            {lesson.title}
          </h1>
          {lesson.summary && (
            <p className="mt-3 mb-0 max-w-[60ch] font-serif text-[1.125rem] leading-[1.6] text-ink-2">
              {lesson.summary}
            </p>
          )}
        </header>

        <article className="prose">
          <LessonBody source={lesson.body} slug={lesson.slug} module={lesson.module} />
        </article>

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <Button variant={done ? 'secondary' : 'primary'} onClick={toggleDone}>
            {done ? (
              <>
                <IconCheck size={16} /> Completed
              </>
            ) : (
              'Mark as complete'
            )}
          </Button>
          <div className="ml-auto flex gap-2">
            {prev && (
              <Link to={`/lesson/${prev.slug}`} className="no-underline">
                <Button size="sm">← {prev.title}</Button>
              </Link>
            )}
            {next && (
              <Link to={`/lesson/${next.slug}`} className="no-underline">
                <Button size="sm">{next.title} →</Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
