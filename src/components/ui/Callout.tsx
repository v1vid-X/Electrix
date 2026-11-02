import type { ReactNode } from 'react';
import {
  IconDatasheet,
  IconIntuition,
  IconMath,
  IconMistake,
  IconPlay,
  IconSafety,
  IconWarning,
} from './Icon';

export type CalloutType =
  | 'intuition'
  | 'math'
  | 'warning'
  | 'mistake'
  | 'safety'
  | 'datasheet'
  | 'build';

const CONFIG: Record<
  CalloutType,
  { label: string; color: string; Icon: typeof IconIntuition }
> = {
  intuition: { label: 'Intuition', color: 'var(--color-cal-intuition)', Icon: IconIntuition },
  math: { label: 'Math you need', color: 'var(--color-cal-math)', Icon: IconMath },
  warning: { label: 'Watch out', color: 'var(--color-cal-warning)', Icon: IconWarning },
  mistake: { label: 'Common mistake', color: 'var(--color-cal-mistake)', Icon: IconMistake },
  safety: { label: 'Safety', color: 'var(--color-cal-safety)', Icon: IconSafety },
  datasheet: { label: 'Datasheet tip', color: 'var(--color-cal-datasheet)', Icon: IconDatasheet },
  build: { label: 'Build it', color: 'var(--color-accent)', Icon: IconPlay },
};

export function Callout({
  type = 'intuition',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const { label, color, Icon } = CONFIG[type] ?? CONFIG.intuition;
  const isSafety = type === 'safety';

  return (
    <aside
      className="cb-ui bleed my-6 rounded-[var(--radius-md)] border border-line bg-surface"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {isSafety && (
        <div
          className="h-1 rounded-tr-[var(--radius-md)]"
          style={{
            background: `repeating-linear-gradient(45deg, ${color} 0 6px, transparent 6px 12px)`,
          }}
        />
      )}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2" style={{ color }}>
        <Icon size={17} />
        <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em]">
          {title ?? label}
        </span>
      </div>
      <div className="callout-body px-4 pb-4 text-[1.0625rem] leading-[1.65]">{children}</div>
    </aside>
  );
}
