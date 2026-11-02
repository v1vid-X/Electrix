import type { ReactNode } from 'react';
import { IconCheck } from './Icon';

/** End-of-section self-test. Deliberately not interactive: the point is to answer in
 *  your head before you move on. */
export function CheckYourself({ children }: { children: ReactNode }) {
  return (
    <section className="cb-ui bleed my-8 rounded-[var(--radius-md)] border border-line bg-surface-2">
      <header className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-ink-2">
        <IconCheck size={16} />
        <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em]">
          Check yourself
        </span>
      </header>
      <div className="callout-body px-4 py-3 text-[1.0625rem] leading-[1.6]">{children}</div>
    </section>
  );
}
