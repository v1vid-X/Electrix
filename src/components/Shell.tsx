import { Link, NavLink, Outlet } from 'react-router-dom';
import { IconBook, IconCube, IconPalette } from './ui/Icon';

const NAV = [
  { to: '/lessons', label: 'Lessons', Icon: IconBook },
  { to: '/lab', label: 'The Lab', Icon: IconCube },
  { to: '/style', label: 'Style', Icon: IconPalette },
];

export function Shell() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/92 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5 no-underline">
            <Mark />
            <span className="font-sans text-[15px] font-semibold tracking-tight text-ink">
              Circuit Brain
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {NAV.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] px-3 no-underline',
                    'font-sans text-[14px] transition-colors duration-[120ms]',
                    isActive
                      ? 'bg-surface-2 text-ink'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                  ].join(' ')
                }
              >
                <Icon size={17} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="mt-24 border-t border-line">
        <div className="mx-auto max-w-[1320px] px-4 py-6 font-sans text-[12.5px] text-ink-3 sm:px-6">
          Everything here runs on USB power or small batteries. Never on mains.
        </div>
      </footer>
    </div>
  );
}

/** The mark: a resistor between two nodes. Drawn, not an emoji. */
function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="25" height="25" rx="6" fill="var(--color-surface-2)" stroke="var(--color-line-strong)" />
      <path
        d="M4 13h3.5l1.5-4 2 8 2-8 2 8 1.5-4H22"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
