import { useState, useCallback } from 'react';
import { AUDIENCE_TABS, STUDENT_EXTRA_ROWS } from './constants';
import type { AudienceTab } from './constants';

export function AudienceTabs() {
  const [activeKey, setActiveKey] = useState<string>(AUDIENCE_TABS[0].key);

  const activeTab = AUDIENCE_TABS.find((t) => t.key === activeKey) as AudienceTab;

  const handleTabClick = useCallback((key: string) => {
    setActiveKey(key);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = AUDIENCE_TABS.findIndex((t) => t.key === activeKey);
      let nextIndex = currentIndex;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % AUDIENCE_TABS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + AUDIENCE_TABS.length) % AUDIENCE_TABS.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = AUDIENCE_TABS.length - 1;
      } else {
        return;
      }

      setActiveKey(AUDIENCE_TABS[nextIndex].key);
      // Move focus to the new tab button
      const tablist = e.currentTarget;
      const buttons = tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons[nextIndex]?.focus();
    },
    [activeKey],
  );

  return (
    <section className="lp-aud lp-section" id="audiences">
      <div className="lp-wrap">
        <h2 className="lp-h2">Built for the people on both sides of the desk.</h2>

        {/* Tab bar */}
        <div
          className="lp-tabs"
          role="tablist"
          aria-label="Audience"
          onKeyDown={handleKeyDown}
        >
          {AUDIENCE_TABS.map((tab) => (
            <button
              key={tab.key}
              className="lp-tab"
              role="tab"
              aria-selected={tab.key === activeKey}
              aria-controls={`panel-${tab.key}`}
              id={`tab-${tab.key}`}
              tabIndex={tab.key === activeKey ? 0 : -1}
              onClick={() => handleTabClick(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panel */}
        <div
          className="lp-aud-grid"
          role="tabpanel"
          id={`panel-${activeTab.key}`}
          aria-labelledby={`tab-${activeTab.key}`}
        >
          {/* Left: heading + tick list */}
          <div>
            <h3>{activeTab.heading}</h3>
            <ul className="lp-ticks">
              {activeTab.ticks.map((tick) => (
                <li key={tick}>{tick}</li>
              ))}
            </ul>
          </div>

          {/* Right: panel preview */}
          <div className="lp-panel">
            <h4>{activeTab.panelTitle}</h4>
            {activeTab.panelRows.map((row) => (
              <div className="lp-row" key={row.label}>
                <span className="lp-pip" style={{ background: row.color }} />
                {row.label}
                <em>{row.meta}</em>
              </div>
            ))}
            {activeTab.panelBar && (
              <div className="lp-bar">
                <span
                  className="lp-bar-fill"
                  style={{ width: `${activeTab.panelBar.widthPercent}%` }}
                />
              </div>
            )}
            {/* Student tab extra rows */}
            {activeTab.key === 'stu' &&
              STUDENT_EXTRA_ROWS.map((row) => (
                <div className="lp-row" key={row.label} style={{ marginTop: 12 }}>
                  <span className="lp-pip" style={{ background: row.color }} />
                  {row.label}
                  <em>{row.meta}</em>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
