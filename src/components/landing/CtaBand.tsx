import { DEMO_MAILTO } from './constants';

export function CtaBand() {
  return (
    <section className="lp-cta-section" id="demo">
      <div className="lp-wrap">
        <div className="lp-cta-box">
          <div>
            <h2>See Pathly with your own workflow in mind.</h2>
            <p>Book a 30-minute walkthrough for your international office.</p>
          </div>
          <a className="lp-btn lp-btn-demo" href={DEMO_MAILTO}>
            Request a demo
          </a>
        </div>
      </div>
    </section>
  );
}
