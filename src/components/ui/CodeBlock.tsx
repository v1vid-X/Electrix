import { useState } from 'react';
import { IconCheck, IconCopy } from './Icon';

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="cb-ui bleed group relative my-6 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface-2">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
          {language || 'text'}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 font-sans text-[12px] text-ink-3 transition-colors duration-[120ms] hover:bg-surface hover:text-ink"
          aria-label="Copy code"
        >
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3">
        <code className="font-mono text-[13.5px] leading-[1.65] text-ink">{code}</code>
      </pre>
    </div>
  );
}
