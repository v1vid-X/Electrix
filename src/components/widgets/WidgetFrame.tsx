import type { ReactNode } from 'react';

/** Every interactive widget sits in the same frame so lessons have a steady rhythm. */
export function WidgetFrame({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <figure className="cb-ui bleed my-8 rounded-[var(--radius-lg)] border border-line bg-surface">
      <figcaption className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="font-sans text-[13px] font-semibold tracking-tight text-ink">{title}</span>
        <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-ink-3">
          interactive
        </span>
      </figcaption>
      <div className="px-4 py-4">{children}</div>
      {caption && (
        <div className="border-t border-line px-4 py-2.5 font-sans text-[13px] leading-[1.5] text-ink-2">
          {caption}
        </div>
      )}
    </figure>
  );
}
