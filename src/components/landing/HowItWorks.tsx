import { HOW_STEPS } from './constants';

export function HowItWorks() {
  return (
    <section className="lp-section" id="how" style={{ background: 'var(--lp-bg)' }}>
      <div className="lp-wrap">
        <h2 className="lp-h2">Up and running before the next semester starts.</h2>

        <div className="lp-how-grid">
          {HOW_STEPS.map((step) => (
            <div key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
