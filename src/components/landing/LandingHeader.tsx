import { NAV_LINKS, DEMO_MAILTO, ACCESS_ROUTE } from './constants';

interface LandingHeaderProps {
  onNavigate: (page: string) => void;
}

export function LandingHeader({ onNavigate }: LandingHeaderProps) {
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-nav">
        <a className="lp-logo" href="#top" aria-label="Pathly – back to top">
          <span className="lp-logo-icon" aria-hidden="true">🌐</span>
          Pathly
        </a>

        <nav className="lp-links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="lp-nav-right">
          <button
            className="lp-btn lp-btn-ghost"
            onClick={() => onNavigate(ACCESS_ROUTE)}
            type="button"
          >
            Access portal
          </button>
          <a className="lp-btn lp-btn-primary" href={DEMO_MAILTO}>
            Request a demo
          </a>
        </div>
      </div>
    </header>
  );
}
