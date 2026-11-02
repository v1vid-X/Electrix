/** Lessons are plain markdown files in /curriculum, owned and edited by the learner.
 *  The app only reads them. */

export interface LessonMeta {
  slug: string;
  /** Module number; 0 is the setup module. */
  module: number;
  title: string;
  /** One-line summary for the lesson list. */
  summary: string;
  /** Estimated time in minutes. */
  minutes: number;
  /** Module numbers that must come first. */
  prereqs: number[];
  /** Does this lesson need physical components? */
  needsParts: boolean;
  /** Lab part typeIds this lesson unlocks. */
  unlocks: string[];
}

export interface Lesson extends LessonMeta {
  body: string;
}

/** Minimal front-matter parser: `key: value` lines between --- fences.
 *  A YAML dependency would be three times the size of this for no gain. */
export function parseFrontMatter(source: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line.trim());
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { data, body: source.slice(match[0].length) };
}

const list = (value: string | undefined): string[] =>
  value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

export function toLesson(slug: string, source: string): Lesson {
  const { data, body } = parseFrontMatter(source);
  return {
    slug,
    module: Number(data.module ?? 0),
    title: data.title ?? slug,
    summary: data.summary ?? '',
    minutes: Number(data.minutes ?? 0),
    prereqs: list(data.prereqs).map(Number).filter((n) => !Number.isNaN(n)),
    needsParts: data.needsParts === 'true',
    unlocks: list(data.unlocks),
    body,
  };
}

/** Headings become the table of contents. */
export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

/** Lessons repeat headings like "Why this exists" in every section, so ids have to be
 *  de-duplicated in document order. The renderer uses the same function over the same
 *  source, so its anchors match the table of contents. */
export function makeSlugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

export function tableOfContents(body: string): TocEntry[] {
  const out: TocEntry[] = [];
  const slug = makeSlugger();
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (m) {
      const text = m[2].replace(/[*_`]/g, '').trim();
      out.push({ id: slug(text), text, level: m[1].length === 2 ? 2 : 3 });
    }
  }
  return out;
}

// Vite inlines every lesson at build time, so the app stays a static site.
const RAW = import.meta.glob('/curriculum/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const ALL_LESSONS: Lesson[] = Object.entries(RAW)
  .map(([path, source]) => toLesson(path.replace(/^.*\/(.*)\.md$/, '$1'), source))
  // 00-roadmap is a document, not a lesson.
  .filter((l) => l.slug !== '00-roadmap')
  .sort((a, b) => a.module - b.module || a.slug.localeCompare(b.slug));

export const lessonBySlug = (slug: string): Lesson | undefined =>
  ALL_LESSONS.find((l) => l.slug === slug);

export const roadmapSource = (): string => RAW['/curriculum/00-roadmap.md'] ?? '';
