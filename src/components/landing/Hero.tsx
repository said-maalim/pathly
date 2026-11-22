import { DEMO_MAILTO } from './constants';

export function Hero() {
  return (
    <section className="lp-hero" style={{ paddingBottom: 96 }}>
      <div className="lp-wrap lp-hero-grid">
        {/* ── Copy column ──────────────────────────────────────────── */}
        <div>
          <h1>Keep every international student in status, before it becomes a problem.</h1>
          <p className="lp-lead">
            Pathly gives your international office one place to track visas, SEVIS records,
            work authorization, and student requests, so nothing expires unnoticed.
          </p>
          <div className="lp-cta-row">
            <a className="lp-btn lp-btn-primary" href={DEMO_MAILTO}>
              Request a demo
            </a>
            <a className="lp-btn lp-btn-ghost" href="#how">
              See how it works
            </a>
          </div>
          <p className="lp-assure">
            FERPA-compliant, with bank-level encryption for sensitive data.
          </p>
        </div>

        {/* ── Product preview ──────────────────────────────────────── */}
        <div
          className="lp-stage"
          aria-label="Preview of a student's immigration journey in Pathly"
          role="img"
        >
          <div className="lp-win">
            {/* Title bar */}
            <div className="lp-win-bar">
              <span className="lp-win-dot" aria-hidden="true" />
              <span className="lp-win-dot" aria-hidden="true" />
              <span className="lp-win-dot" aria-hidden="true" />
              <span className="lp-win-label">Student profile</span>
            </div>

            {/* Student identity */}
            <div className="lp-who">
              <div className="lp-avatar" aria-hidden="true">PP</div>
              <div>
                <h3>Priya Patel</h3>
                <small>F-1 · BS Computer Science</small>
              </div>
              <span className="lp-tag">In compliance</span>
            </div>

            {/* Journey timeline */}
            <div className="lp-journey" aria-hidden="true">
              <div className="lp-step lp-step-done">
                <div className="lp-dot">✓</div>
                <strong>F-1 status</strong>Active
              </div>
              <div className="lp-step lp-step-done">
                <div className="lp-dot">✓</div>
                <strong>CPT</strong>Approved
              </div>
              <div className="lp-step lp-step-now">
                <div className="lp-dot">3</div>
                <strong>OPT</strong>In review
              </div>
              <div className="lp-step">
                <div className="lp-dot">4</div>
                <strong>STEM OPT</strong>Upcoming
              </div>
            </div>

            {/* Feed rows */}
            <div className="lp-feed">
              <div className="lp-row">
                <span className="lp-pip" style={{ background: 'var(--lp-amber)' }} />
                Passport expires in 28 days. Reminder sent.
                <em>Today</em>
              </div>
              <div className="lp-row">
                <span className="lp-pip" style={{ background: 'var(--lp-green)' }} />
                SEVIS record synced with no errors
                <em>9:02 AM</em>
              </div>
            </div>
          </div>

          {/* Floating card */}
          <div className="lp-float" aria-hidden="true">
            <b>OPT request ready for review</b>
            <span>All documents received. Awaiting DSO approval.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
