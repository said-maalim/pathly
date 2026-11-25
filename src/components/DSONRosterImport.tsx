import { useState, useRef, useEffect, useCallback } from 'react';
import './di-roster.css';
import { getRosterHistory } from '../services/roster.service';
import type { RosterImport } from '../types';

// ─── Field definitions ────────────────────────────────────────────────────────

interface FieldDef { k: string; l: string; req?: boolean; a: string[] }

const FIELDS: FieldDef[] = [
  { k: 'sid',  l: 'Student ID',       req: true,  a: ['student id','studentid','student_id','id'] },
  { k: 'fn',   l: 'First name',       req: true,  a: ['first name','firstname','first_name','given name'] },
  { k: 'ln',   l: 'Last name',        req: true,  a: ['last name','lastname','last_name','surname','family name'] },
  { k: 'em',   l: 'Email',            req: true,  a: ['email','e-mail','email address'] },
  { k: 'sev',  l: 'SEVIS ID',                     a: ['sevis','sevis id','sevis_id'] },
  { k: 'prog', l: 'Program',                       a: ['program','major','degree'] },
  { k: 'vis',  l: 'Visa type',                     a: ['visa','visa type','status'] },
  { k: 'end',  l: 'Program end date',              a: ['program end','end date','program end date','program_end_date','i-20 end'] },
];

const SAMPLE = `Student ID,First Name,Last Name,Email,SEVIS ID,Major,Visa,Program End,Advisor
S2041,Amara,Okafor,amara.okafor@university.edu,N0012345678,BS Computer Science,F-1,2027-05-15,K. Rivera
S2042,Wei,Zhang,wei.zhang@university.edu,N0012345679,MS Data Science,F-1,2026-12-18,K. Rivera
S2043,Lucia,Fernandez,lucia.fernandez@university.edu,N0012345680,BA Economics,F-1,2027-05-15,J. Hart
S2044,Rahul,Mehta,rahul.mehta@university,N0012345681,BS Biology,F-1,2028-05-12,J. Hart
S2045,Fatima,,fatima.alhassan@university.edu,N0012345682,MS Engineering,J-1,2027-08-01,K. Rivera
S2046,Tomas,Novak,tomas.novak@university.edu,,BA Physics,F-1,2027-05-15,J. Hart
S2047,Yuki,Tanaka,yuki.tanaka@university.edu,N00123,BS Design,F-1,05/15/2027,K. Rivera
S2041,Amara,Okafor,a.okafor2@university.edu,N0012345678,BS Computer Science,F-1,2027-05-15,K. Rivera
S1002,Priya,Patel,ppatel@university.edu,N0099887766,BS Computer Science,F-1,2026-12-20,J. Hart
S2049,Daniel,Reyes,daniel.reyes@university.edu,N0012345684,MS Public Health,F-1,not a date,K. Rivera
S2050,Grace,Kim,grace.kim@university.edu,N0012345685,BS Nursing,F-1,2028-05-12,J. Hart
S2051,Omar,Haddad,omar.haddad@university.edu,N0012345686,MBA,F-1,2027-05-15,K. Rivera`;

const EXISTING = new Set(['S1002', 'S1001']);

const MOCK_HISTORY = [
  { f: 'fall_2026_roster.csv',    by: 'QA DSO Test', d: 'Nov 18, 2026 · 2:14 PM',  n: 1284, ok: 1271, wn: 9,  er: 4,  st: 'With errors' },
  { f: 'sevis_updates_oct.xlsx',  by: 'K. Rivera',   d: 'Oct 30, 2026 · 9:02 AM',  n: 312,  ok: 312,  wn: 0,  er: 0,  st: 'Completed' },
  { f: 'transfer_students.csv',   by: 'QA DSO Test', d: 'Oct 12, 2026 · 4:40 PM',  n: 58,   ok: 0,    wn: 0,  er: 58, st: 'Failed' },
  { f: 'summer_cohort.csv',       by: 'J. Hart',     d: 'Jun 3, 2026 · 11:15 AM',  n: 204,  ok: 198,  wn: 6,  er: 0,  st: 'Completed' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportStep = 1 | 2 | 3 | 4;
type TabView = 'new' | 'hist';
type RowStatus = 'ok' | 'wn' | 'er';
type FilterKey = 'ok' | 'wn' | 'er';

interface ParsedFile { name: string; size: number; headers: string[]; rows: string[][] }
interface Mapping { [header: string]: string }

interface ValidatedRow {
  i: number;
  rec: Record<string, string>;
  er: string[];
  wn: string[];
  s: RowStatus;
}

interface LocalHistEntry {
  f: string; by: string; d: string; n: number; ok: number; wn: number; er: number; st: string; isNew?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
      else cell += ch;
    } else if (ch === '"') { quoted = true; }
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => x.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(x => x.trim())) rows.push(row);
  return rows;
}

function autoMap(headers: string[]): Mapping {
  const used = new Set<string>();
  const map: Mapping = {};
  headers.forEach(h => {
    const n = h.toLowerCase().trim().replace(/\s+/g, ' ');
    const field = FIELDS.find(f => !used.has(f.k) && (f.l.toLowerCase() === n || f.a.includes(n)));
    if (field) { map[h] = field.k; used.add(field.k); } else map[h] = 'ign';
  });
  return map;
}

function validateRows(rows: string[][], headers: string[], mapping: Mapping): ValidatedRow[] {
  const idx: Record<string, number> = {};
  Object.entries(mapping).forEach(([h, k]) => { if (k !== 'ign') idx[k] = headers.indexOf(h); });
  const seen: Record<string, number> = {};
  return rows.map((row, ri) => {
    const g = (k: string) => idx[k] == null ? '' : (row[idx[k]] ?? '').trim();
    const rec: Record<string, string> = {};
    FIELDS.forEach(f => { rec[f.k] = g(f.k); });
    const er: string[] = [], wn: string[] = [];
    FIELDS.filter(f => f.req).forEach(f => { if (!rec[f.k]) er.push(`${f.l} is missing`); });
    if (rec.em && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(rec.em)) er.push('Email looks invalid');
    if (rec.end && rec.end !== '') {
      const validFmt = /^\d{4}-\d{2}-\d{2}$/.test(rec.end) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rec.end);
      if (!validFmt || isNaN(new Date(rec.end).getTime())) er.push("Program end date isn't a valid date");
    }
    if (rec.sev && !/^N\d{10}$/.test(rec.sev)) er.push('SEVIS ID must be N followed by 10 digits');
    if (rec.sid) {
      if (seen[rec.sid]) er.push(`Duplicate Student ID (also row ${seen[rec.sid]})`);
      else seen[rec.sid] = ri + 2;
    }
    if (!rec.sev && idx.sev != null) wn.push('No SEVIS ID — you can add it later');
    if (rec.sid && EXISTING.has(rec.sid)) wn.push('Already in Pathly — record will be updated');
    const s: RowStatus = er.length ? 'er' : wn.length ? 'wn' : 'ok';
    return { i: ri + 2, rec, er, wn, s };
  });
}

function csvq(v: unknown) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function downloadCSV(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

function sz(b: number) {
  return b > 1_048_576 ? (b / 1_048_576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
}

function histStatusClass(st: string) {
  if (st === 'Completed') return 'di-t-green';
  if (st === 'Failed') return 'di-t-red';
  return 'di-t-amber';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DSONRosterImport() {
  const [tab, setTab]           = useState<TabView>('new');
  const [step, setStep]         = useState<ImportStep>(1);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed]     = useState<ParsedFile | null>(null);
  const [mapping, setMapping]   = useState<Mapping>({});
  const [validated, setValidated] = useState<ValidatedRow[]>([]);
  const [filter, setFilter]     = useState<FilterKey | 'all'>('all');
  const [skipErrors, setSkipErrors] = useState(true);
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);
  const [history, setHistory]   = useState<LocalHistEntry[]>(MOCK_HISTORY);
  const [toast, setToast]       = useState('');
  const fileRef   = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval>>();
  const toastRef  = useRef<ReturnType<typeof setTimeout>>();

  // load real history on tab switch
  useEffect(() => {
    if (tab !== 'hist') return;
    getRosterHistory()
      .then(list => {
        if (!list?.length) return;
        setHistory(list.map((h: RosterImport) => ({
          f: h.file_name,
          by: 'DSO',
          d: new Date(h.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
          n: (h.created_student_ids?.length ?? 0) + (h.updated_student_ids?.length ?? 0) + (h.failed_rows ?? 0),
          ok: h.created_student_ids?.length ?? 0,
          wn: h.updated_student_ids?.length ?? 0,
          er: h.failed_rows ?? 0,
          st: h.status === 'completed' ? 'Completed' : h.status === 'failed' ? 'Failed' : 'With errors',
        })));
      })
      .catch(() => {}); // fall back to mock data
  }, [tab]);

  function showToast(msg: string) {
    clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(''), 2200);
  }

  // ─── File handling ──────────────────────────────────────────────────────────

  function loadText(name: string, size: number, text: string) {
    const rows = parseCSV(text);
    if (rows.length < 2) { showToast('That file has no data rows'); return; }
    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);
    const map = autoMap(headers);
    setParsed({ name, size, headers, rows: dataRows });
    setMapping(map);
    setStep(2);
    scrollRef.current && (scrollRef.current.scrollTop = 0);
  }

  function handleFile(f: File | null | undefined) {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['csv', 'xlsx', 'xls'].includes(ext)) { showToast('Unsupported type — use CSV, XLSX or XLS'); return; }
    if (f.size > 25 * 1024 * 1024) { showToast('File is larger than 25 MB'); return; }
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = () => loadText(f.name, f.size, String(reader.result));
      reader.readAsText(f);
    } else {
      showToast('Excel is parsed on the server. Using sample data for this demo.');
      loadText(f.name, f.size, SAMPLE);
    }
  }

  // ─── Step navigation ────────────────────────────────────────────────────────

  function goToStep3() {
    if (!parsed) return;
    const v = validateRows(parsed.rows, parsed.headers, mapping);
    setValidated(v);
    setFilter('all');
    setStep(3);
    scrollRef.current && (scrollRef.current.scrollTop = 0);
  }

  function startImport() {
    const c = counts();
    const n = c.ok + c.wn + (skipErrors ? 0 : c.er);
    if (!n) return;
    setStep(4); setProgress(0); setDone(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(100, prev + 4 + Math.floor(Math.random() * 7));
        if (next >= 100) {
          clearInterval(timerRef.current);
          setDone(true);
          // add to history
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          setHistory(h => [{ f: parsed!.name, by: 'QA DSO Test', d: dateStr, n: parsed!.rows.length, ok: c.ok, wn: c.wn, er: skipErrors ? c.er : 0, st: c.er && skipErrors ? 'With errors' : 'Completed', isNew: true }, ...h]);
        }
        return next;
      });
    }, 120);
  }

  function reset() {
    clearInterval(timerRef.current);
    setStep(1); setParsed(null); setMapping({}); setValidated([]);
    setFilter('all'); setSkipErrors(true); setProgress(0); setDone(false);
    scrollRef.current && (scrollRef.current.scrollTop = 0);
  }

  // ─── Derived ────────────────────────────────────────────────────────────────

  const counts = useCallback(() => ({
    ok: validated.filter(r => r.s === 'ok').length,
    wn: validated.filter(r => r.s === 'wn').length,
    er: validated.filter(r => r.s === 'er').length,
  }), [validated]);

  const mappedKeys = Object.values(mapping).filter(k => k !== 'ign');
  const missingRequired = FIELDS.filter(f => f.req && !mappedKeys.includes(f.k));
  const importCount = (() => { const c = counts(); return c.ok + c.wn + (skipErrors ? 0 : c.er); })();
  const isBlocked = !skipErrors && counts().er > 0;

  // ─── Render: Stepper ────────────────────────────────────────────────────────

  function renderStepper() {
    const labels = ['Upload', 'Map columns', 'Review', 'Import'];
    return (
      <div className="di-stp">
        {labels.map((lbl, i) => {
          const n = (i + 1) as ImportStep;
          const cls = step === n ? 'cur' : step > n ? 'dn' : '';
          return (
            <>
              <button key={n} className={`di-sp ${cls}`}
                onClick={() => { if (step > n && step < 4) setStep(n); }}
                disabled={!(step > n && step < 4)}
                aria-current={step === n ? 'step' : undefined}>
                <i>{step > n ? '✓' : n}</i>
                <span>{lbl}</span>
              </button>
              {i < 3 && <div key={`ln-${i}`} className={`di-ln${step > n ? ' dn' : ''}`} />}
            </>
          );
        })}
      </div>
    );
  }

  // ─── Render: Step 1 ─────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="di-g2">
        <div>
          <div
            className={`di-dz${dragging ? ' drag' : ''}`}
            tabIndex={0} role="button" aria-label="Choose a file to upload"
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}>
            <div>
              <div className="di-dz-ic">
                <svg width="30" height="30" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 11V2M4.5 5.5L8 2l3.5 3.5M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3"/>
                </svg>
              </div>
              <h2>Drop your roster here</h2>
              <p>or <u>browse your computer</u></p>
              <div className="di-fmt">
                <span>CSV</span><span>XLSX</span><span>XLS</span><span>Up to 25 MB</span>
              </div>
            </div>
          </div>
          <div className="di-alt">or</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <button className="di-btn" onClick={() => loadText('sample_roster.csv', SAMPLE.length, SAMPLE)}>
              ✨ Try it with a sample file
            </button>
          </div>
        </div>

        <aside className="di-guide">
          <h3>Before you upload</h3>
          <ul>
            <li><i>✓</i><span><b>Four columns are required:</b> Student ID, First name, Last name and Email.</span></li>
            <li><i>✓</i><span>Dates can be <b>YYYY-MM-DD</b> or <b>MM/DD/YYYY</b>. SEVIS IDs look like <b>N0012345678</b>.</span></li>
            <li><i>✓</i><span>Existing students (matched by Student ID) are <b>updated</b>. New ones are <b>created</b>.</span></li>
            <li><i>✓</i><span>Your column names don't have to match — you'll map them in the next step.</span></li>
          </ul>
          <div className="di-lock">
            <span>🔒</span>
            <span><b>Nothing is saved until you confirm.</b> You'll review every row first.</span>
          </div>
          <div className="di-tpls">
            <button className="di-btn" onClick={() => downloadCSV('pathly_roster_template.csv', 'Student ID,First Name,Last Name,Email,SEVIS ID,Program,Visa,Program End\nS0001,Jane,Doe,jane.doe@university.edu,N0012345678,BS Biology,F-1,2027-05-15\n')}>
              ⬇ Download CSV template
            </button>
            <button className="di-btn" onClick={() => showToast('Excel template download (wire to your file service)')}>
              ⬇ Download Excel template
            </button>
          </div>
        </aside>
      </div>
    );
  }

  // ─── Render: Step 2 ─────────────────────────────────────────────────────────

  function renderStep2() {
    if (!parsed) return null;
    const matched = Object.values(mapping).filter(k => k !== 'ign').length;

    return (
      <div className="di-card">
        <div className="di-fh">
          <span className="di-fh-ic">📄</span>
          <div className="di-fh-info">
            <b>{parsed.name}</b>
            <span>{sz(parsed.size)} · {parsed.rows.length.toLocaleString()} rows · {parsed.headers.length} columns</span>
          </div>
          <button className="di-btn" style={{ marginLeft: 'auto' }} onClick={reset}>Replace file</button>
        </div>

        <div className="di-mp">
          {/* mapping table */}
          <div className="di-mt">
            <div className="di-mr hd">
              <span>Column in your file</span><span /><span>Pathly field</span>
            </div>
            {parsed.headers.map((h, hi) => {
              const k = mapping[h] ?? 'ign';
              const preview = parsed.rows.slice(0, 2).map(r => r[hi]).filter(Boolean).join(' · ');
              return (
                <div key={h} className="di-mr">
                  <div className="di-mr-src">
                    <b>{h}</b>
                    <span>{preview}</span>
                  </div>
                  <span className="di-mr-ar">→</span>
                  <select className={k === 'ign' ? 'ign' : ''} value={k}
                    aria-label={`Map ${h}`}
                    onChange={e => {
                      const next = e.target.value;
                      setMapping(prev => {
                        const updated = { ...prev };
                        // un-assign if another header already holds this field
                        if (next !== 'ign') {
                          Object.keys(updated).forEach(hdr => { if (updated[hdr] === next) updated[hdr] = 'ign'; });
                        }
                        updated[h] = next;
                        return updated;
                      });
                    }}>
                    <option value="ign">Don't import</option>
                    {FIELDS.map(f => (
                      <option key={f.k} value={f.k}
                        disabled={Object.values(mapping).includes(f.k) && k !== f.k}>
                        {f.l}{f.req ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* required fields summary */}
          <aside className="di-sm">
            <h4>{matched} of {parsed.headers.length} columns matched</h4>
            {FIELDS.filter(f => f.req).map(f => {
              const mapped = Object.values(mapping).includes(f.k);
              return (
                <div key={f.k} className={`di-rq ${mapped ? 'ok' : 'no'}`}>
                  <i>{mapped ? '✓' : '!'}</i>{f.l}
                </div>
              );
            })}
            <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 12, lineHeight: 1.45 }}>
              We matched what we could by name. Anything marked "Don't import" is ignored.
            </p>
          </aside>
        </div>

        <div className="di-act">
          <button className="di-btn" onClick={reset}>Back</button>
          <span className="di-act-sum">
            {missingRequired.length
              ? <>Map <b>{missingRequired.map(f => f.l).join(', ')}</b> to continue</>
              : 'Required columns are mapped.'}
          </span>
          <button className="di-btn di-btn-p" aria-disabled={missingRequired.length > 0}
            onClick={() => { if (!missingRequired.length) goToStep3(); else showToast('Map the required columns first'); }}>
            Review rows →
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Step 3 ─────────────────────────────────────────────────────────

  function renderStep3() {
    const c = counts();
    const rows = filter === 'all' ? validated : validated.filter(r => r.s === filter);
    const statCards: [FilterKey, string, string, string][] = [
      ['ok', 'Ready to import', '#dcfce7', '✓'],
      ['wn', 'Needs a look',    '#fef3c7', '!'],
      ['er', 'Errors',          '#fee2e2', '✕'],
    ];

    return (
      <div>
        <div className="di-rs">
          {statCards.map(([key, lbl, bg, ic]) => (
            <button key={key} className="di-rc" style={{ border: `1.5px solid ${filter === key ? '#2563eb' : '#e5e7eb'}`, boxShadow: filter === key ? '0 0 0 3px rgba(37,99,235,.1)' : undefined }}
              aria-pressed={filter === key}
              onClick={() => setFilter(f => f === key ? 'all' : key)}>
              <div className="di-rc-ic" style={{ background: bg }}>{ic}</div>
              <div><b>{c[key]}</b><span>{lbl}</span></div>
            </button>
          ))}
        </div>

        <div className="di-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 15 }}>
              {filter === 'all' ? 'All rows' : { ok: 'Ready rows', wn: 'Rows with warnings', er: 'Rows with errors' }[filter]}
              <span style={{ color: '#6b7280', fontWeight: 400 }}> · {rows.length}</span>
            </b>
            {filter !== 'all' && <button className="di-link" onClick={() => setFilter('all')}>Show all</button>}
            {c.er > 0 && (
              <button className="di-link" style={{ marginLeft: 'auto' }}
                onClick={() => {
                  const erRows = validated.filter(r => r.s === 'er');
                  downloadCSV('import_errors.csv', 'Row,Student ID,Email,Error\n' + erRows.map(r => [r.i, r.rec.sid, r.rec.em, r.er.join('; ')].map(csvq).join(',')).join('\n'));
                }}>
                ⬇ Download error report
              </button>
            )}
          </div>

          <div className="di-tw">
            <table>
              <thead>
                <tr><th>Row</th><th>Student</th><th>Student ID</th><th>Email</th><th>Status</th><th>Details</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6b7280', padding: 28 }}>No rows here.</td></tr>
                ) : rows.map(r => (
                  <tr key={r.i} className={r.s}>
                    <td>{r.i}</td>
                    <td><b>{(r.rec.fn + ' ' + r.rec.ln).trim() || '—'}</b></td>
                    <td>{r.rec.sid || '—'}</td>
                    <td>{r.rec.em || '—'}</td>
                    <td>
                      <span className={`di-tg ${r.s === 'ok' ? 'di-t-green' : r.s === 'wn' ? 'di-t-amber' : 'di-t-red'}`}>
                        {r.s === 'ok' ? 'Ready' : r.s === 'wn' ? 'Warning' : 'Error'}
                      </span>
                    </td>
                    <td>
                      {r.er.map((msg, i) => <div key={i} className="di-msg">{msg}</div>)}
                      {r.wn.map((msg, i) => <div key={i} className="di-msg w">{msg}</div>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {c.er > 0 && (
            <label className="di-opt">
              <input type="checkbox" checked={skipErrors} onChange={e => setSkipErrors(e.target.checked)} />
              <span><b>Skip rows with errors</b> and import everything else (recommended)</span>
            </label>
          )}

          <div className="di-act">
            <button className="di-btn" onClick={() => setStep(2)}>Back</button>
            <span className="di-act-sum">
              {isBlocked
                ? 'Fix your file or skip the error rows to continue'
                : <><b>{importCount.toLocaleString()}</b> students will be imported{c.er && skipErrors ? `, ${c.er} skipped` : ''}</>}
            </span>
            <button className="di-btn di-btn-p"
              aria-disabled={isBlocked || !importCount}
              style={isBlocked || !importCount ? { background: '#bfd0f7', boxShadow: 'none', cursor: 'not-allowed', filter: 'none' } : {}}
              onClick={() => {
                if (isBlocked) { showToast('Skip the error rows to continue'); return; }
                if (!importCount) return;
                startImport();
              }}>
              Import {importCount.toLocaleString()} students
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Step 4 ─────────────────────────────────────────────────────────

  function renderStep4() {
    const c = counts();
    const n = c.ok + c.wn + (skipErrors ? 0 : c.er);
    const updated = validated.filter(r => r.s !== 'er' && EXISTING.has(r.rec.sid)).length;
    const created = n - updated;
    const circumference = 226;
    const offset = circumference - circumference * progress / 100;

    if (!done) return (
      <div className="di-card">
        <div className="di-fin">
          <div className="di-ring">
            <svg width="84" height="84" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="36" fill="none" stroke="#eef0f3" strokeWidth="7" />
              <circle cx="42" cy="42" r="36" fill="none" stroke="url(#di-g)" strokeWidth="7"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
              <defs>
                <linearGradient id="di-g">
                  <stop stopColor="#2563eb" /><stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <b>{progress}%</b>
          </div>
          <h2>Importing students…</h2>
          <p>{Math.round(n * progress / 100).toLocaleString()} of {n.toLocaleString()} saved. Keep this page open.</p>
        </div>
      </div>
    );

    return (
      <div className="di-card">
        <div className="di-fin">
          <div className="di-tick">✓</div>
          <h2>Import complete</h2>
          <p>{n.toLocaleString()} students were saved from <b>{parsed?.name}</b>.</p>
          <div className="di-out">
            <div><b>{(created).toLocaleString()}</b><span>Created</span></div>
            <div><b>{updated.toLocaleString()}</b><span>Updated</span></div>
            <div><b>{skipErrors ? c.er : 0}</b><span>Skipped</span></div>
          </div>
          <div className="di-fa">
            <button className="di-btn" onClick={() => { reset(); setTab('new'); }}>Import another file</button>
            <button className="di-btn di-btn-p" onClick={() => setTab('hist')}>View history →</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: History tab ─────────────────────────────────────────────────────

  function renderHistory() {
    const thS: React.CSSProperties = { padding: '9px 14px', textAlign: 'left' as const, fontSize: 12, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#fafbfc', whiteSpace: 'nowrap' as const };
    const tdS: React.CSSProperties = { padding: '12px 14px', fontSize: 13.5, borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' as const, color: '#111827' };

    return (
      <div className="di-card" style={{ padding: '8px 8px 4px' }}>
        <div className="di-tw" style={{ maxHeight: 'none', border: 0 }}>
          <table className="di-ht">
            <thead>
              <tr>
                <th style={thS}>File</th>
                <th style={thS}>Imported by</th>
                <th style={thS}>Rows</th>
                <th style={thS}>Result</th>
                <th style={thS}>Status</th>
                <th style={thS} />
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td style={tdS}>
                    <div className="di-fn">
                      <div className="di-fn-ic">{/xls/.test(h.f) ? '📊' : '📄'}</div>
                      <div>
                        <span style={{ fontWeight: 600 }}>{h.f}</span>
                        {h.isNew && <> <span className="di-tg di-t-gray">New</span></>}
                        <small>{h.d}</small>
                      </div>
                    </div>
                  </td>
                  <td style={tdS}>{h.by}</td>
                  <td style={tdS}>{h.n.toLocaleString()}</td>
                  <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#166534' }}>{h.ok.toLocaleString()} saved</span>
                    {h.wn > 0 && <> · <span style={{ color: '#92400e' }}>{h.wn} warnings</span></>}
                    {h.er > 0 && <> · <span style={{ color: '#991b1b' }}>{h.er} errors</span></>}
                  </td>
                  <td style={tdS}>
                    <span className={`di-tg ${histStatusClass(h.st)}`}>{h.st}</span>
                  </td>
                  <td style={{ ...tdS, textAlign: 'right' }}>
                    {h.er > 0 && (
                      <button className="di-btn di-btn-sm" onClick={() => showToast('Error report downloaded (demo)')}>
                        ⬇ Error report
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Root render ─────────────────────────────────────────────────────────────

  return (
    <div className="di-page">
      <div ref={scrollRef} className="di-scroll">
        <div className="di-wrap">

          {/* page header */}
          <div className="di-hh">
            <span className="di-hi">
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 11V2M4.5 5.5L8 2l3.5 3.5M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3"/>
              </svg>
            </span>
            <div>
              <h1 style={{ fontSize: 26, letterSpacing: '-.6px', margin: '0 0 2px', color: '#111827' }}>Data Imports</h1>
              <p style={{ color: '#6b7280', fontSize: 14.5, margin: 0 }}>Onboard or update students in bulk. Every row is checked before anything is saved.</p>
            </div>
          </div>

          {/* tabs */}
          <div className="di-tabs" role="tablist" aria-label="Data imports">
            <button role="tab" aria-selected={tab === 'new'}
              onClick={() => setTab('new')}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 11V2M4.5 5.5L8 2l3.5 3.5M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3"/>
              </svg>
              New import
            </button>
            <button role="tab" aria-selected={tab === 'hist'}
              onClick={() => setTab('hist')}>
              History <span className="di-hc">{history.length}</span>
            </button>
          </div>

          {/* new import panel */}
          {tab === 'new' && (
            <div role="tabpanel">
              {renderStepper()}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </div>
          )}

          {/* history panel */}
          {tab === 'hist' && (
            <div role="tabpanel">{renderHistory()}</div>
          )}
        </div>
      </div>

      {/* hidden file input */}
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />

      {/* toast */}
      <div className={`di-toast${toast ? ' on' : ''}`} role="status">{toast}</div>
    </div>
  );
}
