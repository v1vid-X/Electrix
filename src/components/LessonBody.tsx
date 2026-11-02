import Markdown, { type Components } from 'react-markdown';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkCustom } from '../lib/remarkCustom';
import { Callout, type CalloutType } from './ui/Callout';
import { CodeBlock } from './ui/CodeBlock';
import { Quiz, type Question } from './ui/Quiz';
import { Flashcards } from './ui/Flashcards';
import { WIDGETS } from './widgets';
import { LabLink } from './ui/LabLink';
import { CheckYourself } from './ui/CheckYourself';
import { makeSlugger } from '../lib/lessons';
import type { Flashcard } from '../lib/srs';
import type { ReactNode } from 'react';

/** Pulls the plain text out of a heading so it can become an anchor id. */
const textOf = (children: ReactNode): string =>
  Array.isArray(children)
    ? children.map(textOf).join('')
    : typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : '';

function parseJsonBlock<T>(raw: string, what: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Bad ${what} block in a lesson:`, err);
    return null;
  }
}

export function LessonBody({
  source,
  slug,
  module,
}: {
  source: string;
  slug: string;
  module: number;
}) {
  // Fresh per render, consumed in document order by the heading components below, so the
  // ids line up with the ones tableOfContents() produced for the sidebar.
  const headingId = makeSlugger();

  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkCustom]}
      rehypePlugins={[rehypeKatex]}
      // react-markdown types only know real HTML tags, so our cb-* tags need a cast.
      components={{
        h2: ({ children }: { children?: ReactNode }) => (
          <h2 id={headingId(textOf(children))}>{children}</h2>
        ),
        h3: ({ children }: { children?: ReactNode }) => (
          <h3 id={headingId(textOf(children))}>{children}</h3>
        ),
        code: ({ className, children }: { className?: string; children?: ReactNode }) => {
          const raw = String(children).replace(/\n$/, '');
          const language = /language-(\w+)/.exec(className ?? '')?.[1];

          // Inline code: no language class and no newline.
          if (!className && !raw.includes('\n')) return <code>{raw}</code>;

          if (language === 'quiz') {
            const questions = parseJsonBlock<Question[]>(raw, 'quiz');
            return questions ? <Quiz questions={questions} lessonSlug={slug} /> : null;
          }
          if (language === 'flashcards') {
            const cards = parseJsonBlock<Omit<Flashcard, 'module'>[]>(raw, 'flashcards');
            return cards ? (
              <Flashcards cards={cards.map((c) => ({ ...c, module }))} module={module} />
            ) : null;
          }
          return <CodeBlock code={raw} language={language} />;
        },
        'cb-callout': ({ type, title, children }: { type?: string; title?: string; children?: ReactNode }) => (
          <Callout type={(type as CalloutType) ?? 'intuition'} title={title}>
            {children}
          </Callout>
        ),
        'cb-check': ({ children }: { children?: ReactNode }) => (
          <CheckYourself>{children}</CheckYourself>
        ),
        'cb-widget': ({ id }: { id?: string }) => {
          const Widget = id ? WIDGETS[id] : undefined;
          if (!Widget) {
            return (
              <div className="bleed my-6 rounded-[var(--radius-md)] border border-dashed border-line-strong px-4 py-3 font-mono text-[13px] text-ink-3">
                Widget "{id}" does not exist yet.
              </div>
            );
          }
          return <Widget />;
        },
        'cb-lab': ({ preset, goal }: { preset?: string; goal?: string }) => (
          <LabLink preset={preset} goal={goal} />
        ),
      } as unknown as Components}
    >
      {source}
    </Markdown>
  );
}
