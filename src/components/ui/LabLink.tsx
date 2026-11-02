import { Link } from 'react-router-dom';
import { IconCube } from './Icon';

/** "Try it in the Lab" — loads a starter bench with the right parts and a goal. */
export function LabLink({ preset, goal }: { preset?: string; goal?: string }) {
  const to = preset ? `/lab?preset=${encodeURIComponent(preset)}` : '/lab';
  return (
    <Link
      to={to}
      className="cb-ui bleed group my-7 flex items-center gap-4 rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3.5 no-underline transition-colors duration-[120ms] hover:border-accent"
      style={{ borderLeft: '3px solid var(--color-accent)' }}
    >
      <span className="text-accent">
        <IconCube size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-[14px] font-semibold text-ink">Try it in the Lab</span>
        {goal && (
          <span className="mt-0.5 block font-sans text-[13.5px] leading-[1.5] text-ink-2">{goal}</span>
        )}
      </span>
      <span className="font-sans text-[13px] text-accent opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100">
        open →
      </span>
    </Link>
  );
}
