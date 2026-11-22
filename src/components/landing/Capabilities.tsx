import { CAPABILITIES } from './constants';

export function Capabilities() {
  return (
    <section className="lp-section" id="capabilities">
      <div className="lp-wrap">
        <h2 className="lp-h2">Everything an international office handles, in one system.</h2>
        <p className="lp-sub">Replace the inbox, the spreadsheet, and the folder of PDFs.</p>

        <div className="lp-caps">
          {CAPABILITIES.map((cap) => (
            <div className="lp-cap" key={cap.title}>
              <h3>{cap.title}</h3>
              <div>
                <p>{cap.description}</p>
                {cap.chips && cap.chips.length > 0 && (
                  <div className="lp-chips">
                    {cap.chips.map((chip) => (
                      <span className="lp-chip" key={chip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
