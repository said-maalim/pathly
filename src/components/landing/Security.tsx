import { SECURITY_POINTS } from './constants';

export function Security() {
  return (
    <section className="lp-sec lp-section" id="security">
      <div className="lp-wrap">
        <h2 className="lp-h2">Student records deserve better than a shared drive.</h2>
        <p className="lp-sub">
          Immigration data is some of the most sensitive information your office holds. Pathly
          is built to protect it.
        </p>

        <div className="lp-sec-grid">
          {SECURITY_POINTS.map((point) => (
            <div key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
