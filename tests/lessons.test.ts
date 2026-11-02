import { describe, expect, it } from 'vitest';
import { parseFrontMatter, slugify, tableOfContents, toLesson } from '../src/lib/lessons';

describe('front matter', () => {
  it('reads keys and strips the fence', () => {
    const { data, body } = parseFrontMatter('---\ntitle: Hello\nmodule: 1\n---\nBody text\n');
    expect(data.title).toBe('Hello');
    expect(data.module).toBe('1');
    expect(body.trim()).toBe('Body text');
  });

  it('leaves a file with no front matter alone', () => {
    const { data, body } = parseFrontMatter('# Just markdown');
    expect(data).toEqual({});
    expect(body).toBe('# Just markdown');
  });

  it('strips surrounding quotes', () => {
    const { data } = parseFrontMatter('---\ntitle: "Ohm\'s law"\n---\n');
    expect(data.title).toBe("Ohm's law");
  });

  it('builds a typed lesson with defaults', () => {
    const l = toLesson('01-electricity', '---\ntitle: X\nmodule: 1\nprereqs: 0\nunlocks: led, resistor\nneedsParts: true\n---\nhi');
    expect(l.module).toBe(1);
    expect(l.prereqs).toEqual([0]);
    expect(l.unlocks).toEqual(['led', 'resistor']);
    expect(l.needsParts).toBe(true);
    expect(toLesson('x', 'no front matter').module).toBe(0);
  });
});

describe('table of contents', () => {
  it('collects h2 and h3 only', () => {
    const toc = tableOfContents('# Title\n## One\ntext\n### Two\n#### Four\n## Three');
    expect(toc.map((t) => t.text)).toEqual(['One', 'Two', 'Three']);
    expect(toc[1].level).toBe(3);
  });

  it('ignores headings inside code fences', () => {
    const toc = tableOfContents('## Real\n```\n## Not a heading\n```\n## Also real');
    expect(toc.map((t) => t.text)).toEqual(['Real', 'Also real']);
  });

  it('makes link-safe ids', () => {
    expect(slugify('What is a Volt, really?')).toBe('what-is-a-volt-really');
  });
});

describe('duplicate headings', () => {
  it('gives repeated headings distinct ids, in document order', () => {
    const toc = tableOfContents('## Why this exists\n## Other\n## Why this exists\n## Why this exists');
    expect(toc.map((t) => t.id)).toEqual([
      'why-this-exists',
      'other',
      'why-this-exists-2',
      'why-this-exists-3',
    ]);
  });
});
