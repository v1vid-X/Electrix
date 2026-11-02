/** Inline SVG icons: 20x20 box, 1.5px stroke, no fills, no icon-font dependency.
 *  See docs/DESIGN.md §6. */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 20, ...rest }: IconProps) => ({
  width: size,
  height: size,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...rest,
});

export const IconIntuition = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 2.5a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9Z" />
    <path d="M8.25 17h3.5" />
  </svg>
);

export const IconMath = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14.5 4.5h-9l5 5.5-5 5.5h9" />
  </svg>
);

export const IconWarning = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 3 2.5 16.5h15L10 3Z" />
    <path d="M10 8v3.5M10 14h.01" />
  </svg>
);

export const IconMistake = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10" cy="10" r="7" />
    <path d="M7 13 13 7" />
  </svg>
);

export const IconSafety = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M11 2.5 5 11h4l-1 6.5L15 9h-4l0-6.5Z" />
  </svg>
);

export const IconDatasheet = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 2.5h6l4 4v11H5v-15Z" />
    <path d="M11 2.5v4h4M7.5 11h5M7.5 14h3" />
  </svg>
);

export const IconPlay = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 3.5 16 10l-9.5 6.5v-13Z" />
  </svg>
);

export const IconPause = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4v12M13 4v12" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 10.5 8 14.5 16 5.5" />
  </svg>
);

export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 7V3.5h9.5V13H13" />
    <path d="M3.5 7H13v9.5H3.5V7Z" />
  </svg>
);

export const IconChevron = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7.5 4.5 13 10l-5.5 5.5" />
  </svg>
);

export const IconCube = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 2.5 17 6v8l-7 3.5L3 14V6l7-3.5Z" />
    <path d="M3 6l7 3.5L17 6M10 9.5v8" />
  </svg>
);

export const IconBook = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 4.5c2.5-1 5-1 7 .5v11c-2-1.5-4.5-1.5-7-.5v-11Z" />
    <path d="M17 4.5c-2.5-1-5-1-7 .5v11c2-1.5 4.5-1.5 7-.5v-11Z" />
  </svg>
);

export const IconPalette = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10" cy="10" r="7.5" />
    <circle cx="7.5" cy="8" r="1.1" />
    <circle cx="12.5" cy="8" r="1.1" />
    <circle cx="10" cy="13" r="1.1" />
  </svg>
);

export const IconBolt = IconSafety;
