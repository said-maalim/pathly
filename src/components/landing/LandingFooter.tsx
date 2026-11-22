import { ACCESS_ROUTE } from './constants';

interface LandingFooterProps {
  onNavigate: (page: string) => void;
}

export function LandingFooter({ onNavigate }: LandingFooterProps) {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-foot">
        <a className="lp-logo" href="#top" aria-label="Pathly – back to top">
          <span className="lp-logo-icon" aria-hidden="true">🌐</span>
          Pathly
        </a>

        <nav aria-label="Footer">
          <a href="#capabilities">Capabilities</a>
          <a href="#security">Security</a>
          <button
            type="button"
            onClick={() => onNavigate(ACCESS_ROUTE)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              color: 'inherit',
              padding: 0,
            }}
          >
            Access portal
          </button>
        </nav>

        <span>© 2026 Pathly. All rights reserved.</span>
      </div>
    </footer>
  );
}
