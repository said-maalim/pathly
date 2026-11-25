import { useState, useEffect, useRef, useCallback } from 'react';
import './dso-requests.css';
import { projectId } from '../utils/supabase/info';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentOption {
  id: string;
  name: string;
  email: string;
  program?: string;
  groups?: string[];
}

interface RequestRow {
  id: number;
  t: string;
  ty: 'doc' | 'form' | 'conf' | 'other';
  st: 'Active' | 'Completed' | 'Overdue';
  aud: string;
  n: number;
  done: number;
  due: string;
  pend: string[];
  docs?: string[];
  fields?: string[];
  stm?: string;
  isNew?: boolean;
}

type ReqType = 'doc' | 'form' | 'conf' | 'other' | null;

interface DocItem { n: string; r: boolean }

interface FormState {
  rec: StudentOption[];
  type: ReqType;
  docs: DocItem[];
  fields: string[];
  due: string;
  pri: 'Normal' | 'High' | 'Urgent';
  attach: boolean;
  stm: string;
  ttl: string;
  msg: string;
  remind: boolean;
  notify: boolean;
}

export interface DSORequestActionsDashboardProps {
  onBack: () => void;
  onCreateNew?: () => void;
  onViewDetail?: (id: string) => void;
  userData?: any;
  students?: StudentOption[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GR: [string, string][] = [
  ['opt', 'OPT ending in 60 days'],
  ['grad', 'Graduating this term'],
  ['visa', 'Visa expiring soon'],
];

const TY: [string, string, string, string][] = [
  ['doc',  '📄', 'Document upload',  'Collect passports, letters, I-94s and more'],
  ['form', '📝', 'Form submission',   'Students fill in structured fields'],
  ['conf', '✅', 'Confirmation',      'A simple acknowledge-and-confirm'],
  ['other','✨', 'Other',             'Something else? Write your own request'],
];

const TP = [
  { k: 'CPT documents',     s: 'Document upload', type: 'doc'  as const, t: 'Upload documents for your CPT request',         m: 'Hi {first_name}, to finish reviewing your CPT request we need the documents below.',          docs: ['Job offer letter','Advisor approval letter','Current I-20'],    due: 7  },
  { k: 'Travel signature',  s: 'Document upload', type: 'doc'  as const, t: 'Documents needed for travel signature',          m: 'Hi {first_name}, before I can sign your I-20 for travel, please upload the items below.',   docs: ['Current I-20','Passport (photo page)','Travel itinerary'],     due: 5  },
  { k: 'Employment details',s: 'Form submission', type: 'form' as const, t: 'Tell us about your employment',                  m: 'Hi {first_name}, please fill in your employment details so we can update your record.',     fields:['Employer name','Job title','Start date','End date','Hours per week'], due: 7 },
  { k: 'Confirm address',   s: 'Confirmation',    type: 'conf' as const, t: 'Confirm your U.S. address',                     m: 'Hi {first_name}, immigration rules require us to keep your address current.',               stm: 'I confirm that my current U.S. residential address in Pathly is correct, and I will report any change within 10 days.', due: 3 },
];

const FF = ['Employer name','Job title','Start date','End date','Hours per week','Supervisor email','U.S. address','Phone number'];
const DS = ['Passport (photo page)','Current I-20','I-94 record','Advisor letter','Job offer letter','Proof of enrollment'];
const TYI: Record<string, [string, string, string]> = {
  doc:   ['📄', '#dbeafe', 'Document'],
  form:  ['📝', '#ede9fe', 'Form'],
  conf:  ['✅', '#dcfce7', 'Confirmation'],
  other: ['✨', '#fef3c7', 'Request'],
};

function iso(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmt(s: string) {
  return new Date(s + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function days(d: string) {
  return Math.round((new Date(d + 'T12:00').getTime() - new Date(iso(0) + 'T12:00').getTime()) / 864e5);
}
function dueTxt(r: RequestRow) {
  if (!r.due) return '';
  const d = days(r.due);
  if (r.st === 'Completed') return `Due ${fmt(r.due)}`;
  if (d < 0) return `Overdue by ${-d} day${d < -1 ? 's' : ''}`;
  if (d === 0) return 'Due today';
  return `Due ${fmt(r.due)} · in ${d} days`;
}
function tgc(st: string) {
  if (st === 'Active') return 'drq-t-blue';
  if (st === 'Completed') return 'drq-t-green';
  return 'drq-t-red';
}
function pct(r: RequestRow) { return Math.round(r.done / r.n * 100); }
function pc(p: number) { return p >= 90 ? '#16a34a' : p >= 60 ? '#d97706' : '#dc2626'; }
function esc(s: string) { return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!)); }
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

const INITIAL_REQUESTS: RequestRow[] = [
  { id:1, t:'Passport Copy Upload',         ty:'doc',  st:'Active',    aud:'Bulk (156 students)',   n:156,  done:122,  due:iso(10), pend:['Aisha Rahman','Daniel Kim','Omar Siddiqui'],    docs:['Passport (photo page)'] },
  { id:2, t:'OPT Employment Information',   ty:'form', st:'Active',    aud:'Bulk (89 students)',    n:89,   done:40,   due:iso(9),  pend:['Sarah Lee','Priya Patel','Michael Chen'],         fields:['Employer name','Job title','Start date','End date'] },
  { id:3, t:'SEVIS Status Acknowledgement', ty:'conf', st:'Active',    aud:'Bulk (1,247 students)', n:1247, done:1147, due:'',      pend:['Daniel Kim','Aisha Rahman'],                      stm:'I acknowledge that I have reviewed my current SEVIS status.' },
  { id:4, t:'Signed I-20 Document',         ty:'doc',  st:'Completed', aud:'Student',              n:1,    done:1,    due:iso(-4), pend:[],                                                 docs:['Signed I-20'] },
  { id:5, t:'Address Update Form',          ty:'form', st:'Overdue',   aud:'Bulk (234 students)',   n:234,  done:54,   due:iso(-6), pend:['QA Student Test','Michael Chen','Sarah Lee'],      fields:['U.S. address','Phone number'] },
];

const INITIAL_FORM: FormState = {
  rec: [], type: null, docs: [], fields: [], due: '', pri: 'Normal',
  attach: false, stm: '', ttl: '', msg: 'Hi {first_name},\n\n', remind: true, notify: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DSORequestActionsDashboard({
  onBack, onViewDetail, userData, students: studentsProp,
}: DSORequestActionsDashboardProps) {
  const [tab, setTab]           = useState<'list' | 'new'>('list');
  const [requests, setRequests] = useState<RequestRow[]>(INITIAL_REQUESTS);
  const [openRows, setOpenRows] = useState<Set<number>>(new Set());
  const [filters, setFilters]   = useState({ q: '', ty: 'all', st: 'all' });
  const [students, setStudents] = useState<StudentOption[]>(studentsProp ?? []);
  const [form, setForm]         = useState<FormState>({ ...INITIAL_FORM });
  const [sgQ, setSgQ]           = useState('');
  const [sgHi, setSgHi]         = useState(0);
  const [sgOpen, setSgOpen]     = useState(false);
  const [daddVal, setDaddVal]   = useState('');
  const [showOk, setShowOk]     = useState(false);
  const [okTitle, setOkTitle]   = useState('');
  const [okBody, setOkBody]     = useState('');
  const [toast, setToast]       = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const scrollRef  = useRef<HTMLDivElement>(null);
  const rcInputRef = useRef<HTMLInputElement>(null);

  // load students from API if not provided as prop
  useEffect(() => {
    if (studentsProp && studentsProp.length > 0) { setStudents(studentsProp); return; }
    const token = userData?.data?.session?.access_token;
    const uid = userData?.data?.user?.user_metadata?.schoolId
              ?? userData?.data?.user?.user_metadata?.universityId ?? '';
    if (!token || !uid) return;
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-268175b3/students/school/${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const list = d.students ?? d.data ?? (Array.isArray(d) ? d : []);
        setStudents(list.map((s: any) => ({
          id: s.id,
          name: s.user?.full_name ?? s.user?.email ?? s.email ?? 'Unknown',
          email: s.user?.email ?? s.email ?? '',
          program: s.program ?? '',
          groups: [],
        })));
      })
      .catch(() => {});
  }, [studentsProp, userData]);

  // keep prop-driven students in sync
  useEffect(() => { if (studentsProp) setStudents(studentsProp); }, [studentsProp]);

  function showToast(msg: string) {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  }

  // ─── List tab helpers ──────────────────────────────────────────────────────

  function toggleRow(id: number) {
    setOpenRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const filteredRequests = requests.filter(r =>
    (filters.ty === 'all' || r.ty === filters.ty) &&
    (filters.st === 'all' || r.st === filters.st) &&
    r.t.toLowerCase().includes(filters.q.toLowerCase()),
  );

  function dupRequest(id: number) {
    const x = requests.find(r => r.id === id)!;
    setForm({
      ...INITIAL_FORM,
      type: x.ty,
      ttl: x.t,
      docs: (x.docs ?? []).map(n => ({ n, r: true })),
      fields: x.fields ?? [],
      stm: x.stm ?? '',
      due: iso(7),
      msg: 'Hi {first_name},\n\n',
    });
    setTab('new');
    scrollRef.current && (scrollRef.current.scrollTop = 0);
    showToast(`Duplicated "${x.t}". Pick recipients and send.`);
  }

  // ─── New request form helpers ──────────────────────────────────────────────

  const first = () => form.rec[0] ? form.rec[0].name.split(' ')[0] : 'there';

  const suggestions = students.filter(s =>
    !form.rec.some(r => r.id === s.id) &&
    (s.name.toLowerCase().includes(sgQ.toLowerCase()) || s.email.toLowerCase().includes(sgQ.toLowerCase())),
  );

  function addRec(s: StudentOption) {
    setForm(f => ({ ...f, rec: [...f.rec, s] }));
    setSgQ(''); setSgHi(0); setSgOpen(false);
    rcInputRef.current?.focus();
  }
  function rmRec(id: string) { setForm(f => ({ ...f, rec: f.rec.filter(r => r.id !== id) })); }

  function addGroup(key: string) {
    const toAdd = students.filter(s => (s.groups ?? []).includes(key) && !form.rec.some(r => r.id === s.id));
    if (toAdd.length === 0) {
      // when no real students have groups tagged, add a demo set
      showToast('No students in that group (demo data)');
      return;
    }
    setForm(f => ({ ...f, rec: [...f.rec, ...toAdd] }));
  }

  function applyTpl(idx: number) {
    const t = TP[idx];
    setForm(f => ({
      ...f,
      type: t.type,
      ttl: t.t,
      msg: t.m,
      docs: (t.docs ?? []).map(n => ({ n, r: true })),
      fields: (t as any).fields ?? [],
      stm: (t as any).stm ?? '',
      due: iso(t.due),
    }));
    showToast('Template applied · edit anything');
  }

  function addDoc() {
    if (!daddVal.trim()) return;
    setForm(f => ({ ...f, docs: [...f.docs, { n: daddVal.trim(), r: true }] }));
    setDaddVal('');
  }

  function resetForm() {
    setForm({ ...INITIAL_FORM, msg: 'Hi {first_name},\n\n' });
    setSgQ(''); setSgHi(0); setSgOpen(false); setDaddVal(''); setShowOk(false);
    scrollRef.current && (scrollRef.current.scrollTop = 0);
  }

  function checks(): [boolean, string, string, string][] {
    const { rec, type, docs, fields, stm, ttl, msg, due } = form;
    const bodyMsg = msg.replace(/^\s*Hi\s*\{first_name\}\s*,?/i, '').trim();
    const hasItems = type === 'doc' ? docs.length > 0
      : type === 'form' ? fields.length > 0
      : type === 'conf' ? stm.trim().length > 0
      : type === 'other' ? bodyMsg.length > 0 : false;
    return [
      [rec.length > 0, 'a recipient', 'drq-sec1', 'Recipients'],
      [!!type, 'a request type', 'drq-sec2', 'Request'],
      [!!type && !!ttl.trim() && hasItems,
        !type ? 'details' : !ttl.trim() ? 'a title'
          : type === 'conf' ? 'a statement' : type === 'other' ? 'a message'
          : `at least one ${type === 'doc' ? 'document' : 'field'}`,
        type ? 'drq-sec3' : 'drq-sec2', 'Details'],
      [!!due, 'a due date', 'drq-sec4', 'Deadline'],
    ];
  }

  function sendRequest() {
    const c = checks();
    const miss = c.find(x => !x[0]);
    if (miss) {
      const el = document.getElementById(miss[2]);
      el?.scrollIntoView({ block: 'center' });
      el?.classList.add('flash');
      setTimeout(() => el?.classList.remove('flash'), 1200);
      showToast('Still needed: ' + miss[1]);
      return;
    }
    const n = form.rec.length;
    const newReq: RequestRow = {
      id: Date.now(), t: form.ttl.trim(), ty: form.type!,
      st: 'Active', aud: n === 1 ? form.rec[0].name : `Bulk (${n} students)`,
      n, done: 0, due: form.due,
      pend: form.rec.slice(0, 3).map(r => r.name),
      docs: form.docs.map(d => d.n), fields: form.fields.slice(), stm: form.stm,
      isNew: true,
    };
    setRequests(prev => [newReq, ...prev]);
    setOkTitle(`Request sent to ${n} student${n > 1 ? 's' : ''}`);
    const tyLabel = TY.find(x => x[0] === form.type)?.[2] ?? '';
    const owner = n > 1 ? 'their' : form.rec[0].name.split(' ')[0] + '’s';
    setOkBody(`"${form.ttl.trim()}" is now in ${owner} Request Center. Due ${fmt(form.due)}${form.remind ? ', with automatic reminders on' : ''}.`);
    setShowOk(true);
  }

  // ─── Preview renderer ──────────────────────────────────────────────────────

  function renderPreview() {
    const { type, docs, fields, stm, ttl, msg, due, pri, attach } = form;
    const dueLabel = due ? `Due ${fmt(due)}` : 'No due date';
    const msgReplaced = msg.trim().replace(/\{first_name\}/g, first());
    let body = '';
    if (type === 'doc') body = docs.length
      ? docs.map(d => `<div class="drq-rq-it"><span>📄</span>${esc(d.n)}${d.r ? '' : ' <span style="color:#9ca3af">(optional)</span>'}<em>Upload</em></div>`).join('')
      : '<div class="drq-rq-it" style="color:#9ca3af">Documents you add appear here</div>';
    else if (type === 'form') body = fields.length
      ? fields.map(f => `<div class="drq-rq-ff">${esc(f)}<div></div></div>`).join('') + '<button class="drq-rq-go" tabindex="-1">Submit</button>'
      : '<div class="drq-rq-it" style="color:#9ca3af">Fields you pick appear here</div>';
    else if (type === 'conf') body = `<div class="drq-rq-cf">${esc(stm.trim() || 'Your statement appears here')}</div><label class="drq-chk" style="margin:0 0 6px"><input type="checkbox" disabled /> I confirm</label><button class="drq-rq-go" tabindex="-1">Confirm</button>`;
    else if (type === 'other') body = attach ? '<div class="drq-rq-it"><span>📎</span>Attach files<em>Upload</em></div><button class="drq-rq-go" tabindex="-1">Submit</button>' : '';
    else body = '<div class="drq-rq-it" style="color:#9ca3af">Choose a request type to see it here</div>';

    const priClass = pri === 'Urgent' ? 'drq-t-red' : pri === 'High' ? 'drq-t-amber' : 'drq-t-gray';
    return `<div class="drq-rq">
      <div class="drq-fr"><span class="drq-av" style="width:22px;height:22px;font-size:9px;background:linear-gradient(135deg,#2563eb,#6366f1)">QD</span>DSO · New request<span style="margin-left:auto" class="drq-tg ${priClass}">${pri}</span></div>
      <h4 class="${ttl ? '' : 'ph'}">${esc(ttl || 'Your request title')}</h4>
      <span class="drq-tg drq-t-blue">${dueLabel}</span>
      ${msgReplaced ? `<p>${esc(msgReplaced)}</p>` : '<div style="height:10px"></div>'}
      ${body}
    </div>`;
  }

  const sumMsg = useCallback(() => {
    const c = checks();
    const miss = c.filter(x => !x[0]);
    if (!miss.length) {
      const tyLabel = TY.find(x => x[0] === form.type)?.[2] ?? '';
      return `<b>Ready.</b> ${form.rec.length} student${form.rec.length > 1 ? 's' : ''} · ${tyLabel} · Due ${fmt(form.due)}`;
    }
    return `Still needed: <b>${miss.map(x => x[1]).join(', ')}</b>`;
  }, [form]);

  const isReady = checks().every(x => x[0]);

  // ─── Render: list tab ─────────────────────────────────────────────────────

  function renderListTab() {
    const ov = requests.filter(r => r.st === 'Overdue');
    const counts = {
      all: requests.length,
      Active: requests.filter(r => r.st === 'Active').length,
      Completed: requests.filter(r => r.st === 'Completed').length,
      Overdue: ov.length,
    };
    const statCards: [string, string, string, string][] = [
      ['all',       '📄', '#dbeafe', 'Total requests'],
      ['Active',    '➤', '#dcfce7', 'Active'],
      ['Completed', '✓', '#ede9fe', 'Completed'],
      ['Overdue',   '⏱', '#fee2e2', 'Overdue'],
    ];

    return (
      <div>
        {/* stats */}
        <div className="drq-stats">
          {statCards.map(([key, ic, bg, lbl]) => (
            <button key={key} className="drq-sc" aria-pressed={filters.st === key || (key === 'all' && filters.st === 'all')}
              onClick={() => setFilters(f => ({ ...f, st: f.st === key ? 'all' : key === 'all' ? 'all' : key }))}>
              <i style={{ background: bg }}>{ic}</i>
              <div>
                <b>{counts[key as keyof typeof counts]}</b>
                <span>{lbl}</span>
              </div>
            </button>
          ))}
        </div>

        {/* overdue banner */}
        {ov.length > 0 && (
          <div className="drq-attn">
            <span className="drq-attn-icon">⚠️</span>
            <div className="drq-attn-msg">
              <b>{ov.length === 1 ? ov[0].t + ' is overdue' : `${ov.length} requests are overdue`}</b>
              <small>{ov.reduce((a, x) => a + x.n - x.done, 0).toLocaleString()} students still haven't responded</small>
            </div>
            <button className="drq-btn drq-btn-sm" onClick={() => showToast('Reminders sent for all overdue requests')}>Send reminder</button>
            <button className="drq-btn drq-btn-sm" onClick={() => setFilters(f => ({ ...f, st: 'Overdue' }))}>Review</button>
          </div>
        )}

        {/* filter bar */}
        <div className="drq-fbar">
          <label className="drq-find">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.6"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
            <input value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
              placeholder="Search requests…" aria-label="Search requests" />
          </label>
          <select value={filters.ty} onChange={e => setFilters(f => ({ ...f, ty: e.target.value }))} aria-label="Type">
            <option value="all">All types</option>
            <option value="doc">Document</option>
            <option value="form">Form</option>
            <option value="conf">Confirmation</option>
            <option value="other">Other</option>
          </select>
          <select value={filters.st} onChange={e => setFilters(f => ({ ...f, st: e.target.value }))} aria-label="Status">
            <option value="all">All statuses</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Overdue</option>
          </select>
        </div>

        {/* rows */}
        {filteredRequests.length === 0 ? (
          <div className="drq-hint">No requests match your filters.</div>
        ) : filteredRequests.map(x => {
          const [ic, bg] = TYI[x.ty];
          const p = pct(x);
          const isOpen = openRows.has(x.id);
          return (
            <article key={x.id} className={`drq-rw${isOpen ? ' open' : ''}`}>
              <div className="drq-rh">
                <span className="drq-ri" style={{ background: bg }}>{ic}</span>
                <button className="drq-rm" style={{ border: 0, background: 'none', textAlign: 'left', padding: 0, flex: 1, minWidth: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => toggleRow(x.id)} aria-expanded={isOpen}>
                  <span className="drq-t">
                    {x.t}
                    <span className={`drq-tg ${tgc(x.st)}`}>{x.st}</span>
                    {x.isNew && <span className="drq-tg drq-t-gray">New</span>}
                  </span>
                  <span className="drq-mt">{TYI[x.ty][2]} · {x.aud}{x.due ? ` · ${dueTxt(x)}` : ''}</span>
                </button>
                <div className="drq-rp">
                  {x.done.toLocaleString()} / {x.n.toLocaleString()} completed
                  <div className="drq-bar2">
                    <div className="drq-track"><i style={{ width: `${p}%`, background: pc(p) }} /></div>
                    <span>{p}%</span>
                  </div>
                </div>
                <div className="drq-ra">
                  {x.st !== 'Completed' && (
                    <button className="drq-btn drq-btn-sm"
                      onClick={() => showToast(`Reminder sent to ${(x.n - x.done).toLocaleString()} students`)}>
                      🔔 Remind
                    </button>
                  )}
                  <button className="drq-btn drq-btn-sm" onClick={() => dupRequest(x.id)}>⧉ Duplicate</button>
                </div>
                <button className="drq-chev" onClick={() => toggleRow(x.id)} aria-label="Toggle details">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6l4 4 4-4"/></svg>
                </button>
              </div>
              <div className="drq-rx">
                <h5>{x.pend.length ? `Waiting on ${(x.n - x.done).toLocaleString()} students` : 'Everyone has responded'}</h5>
                {x.pend.map(name => (
                  <div key={name} className="drq-pr">
                    <span className="drq-av" style={{ width: 26, height: 26, fontSize: 10, background: '#6366f1' }}>{initials(name)}</span>
                    {name}
                    <button className="drq-btn drq-btn-xs" style={{ marginLeft: 'auto' }}
                      onClick={() => showToast('Reminder sent to ' + name.split(' ')[0])}>Remind</button>
                  </div>
                ))}
                {x.pend.length > 0 && x.n - x.done > x.pend.length && (
                  <div style={{ fontSize: 12.5, color: '#6b7280', paddingTop: 4 }}>
                    + {(x.n - x.done - x.pend.length).toLocaleString()} more
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <button className="drq-btn drq-btn-sm"
                    onClick={() => onViewDetail ? onViewDetail(String(x.id)) : showToast('Open request details')}>
                    View full details →
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  // ─── Render: new request tab ──────────────────────────────────────────────

  function renderNewTab() {
    const c = checks();
    const { type, docs, fields, stm, ttl, msg, due, pri, attach, remind, notify } = form;

    const msgTip = form.rec.length > 1
      ? <><b>&#123;first_name&#125;</b> becomes each student's own name: {form.rec.slice(0,3).map(x => x.name.split(' ')[0]).join(', ')}{form.rec.length > 3 ? '…' : ''}</>
      : form.rec.length
      ? <><b>&#123;first_name&#125;</b> becomes <b>{form.rec[0].name.split(' ')[0]}</b></>
      : <><b>&#123;first_name&#125;</b> becomes the name of each recipient you add</>;

    return (
      <div>
        {/* step indicators */}
        <div className="drq-steps">
          {c.map((x, i) => (
            <a key={i} className={`drq-st${x[0] ? ' dn' : ''}`}
              href={`#drq-sec${i + 1}`}
              onClick={e => { e.preventDefault(); document.getElementById(`drq-sec${i + 1}`)?.scrollIntoView({ block: 'start' }); }}>
              <i>{x[0] ? '✓' : i + 1}</i>{x[3]}
            </a>
          ))}
        </div>

        <div className="drq-grid">
          <div>

            {/* Step 1: Who */}
            <section className={`drq-card${c[0][0] ? ' done' : ''}`} id="drq-sec1">
              <div className="drq-ch">
                <span className="drq-cn">1</span>
                <div><h2>Who is this for?</h2><p>Add one student or send to a whole group at once.</p></div>
              </div>
              <div className="drq-rc" onClick={() => rcInputRef.current?.focus()}>
                {form.rec.map(s => (
                  <span key={s.id} className="drq-pk">
                    <span className="drq-av" style={{ width: 22, height: 22, fontSize: 9, background: '#6366f1' }}>{initials(s.name)}</span>
                    {s.name}
                    <button onClick={e => { e.stopPropagation(); rmRec(s.id); }} aria-label={`Remove ${s.name}`}>✕</button>
                  </span>
                ))}
                <input ref={rcInputRef} value={sgQ} placeholder={form.rec.length ? '' : 'Search students by name or email…'}
                  autoComplete="off" role="combobox" aria-expanded={sgOpen} aria-label="Add recipient"
                  onChange={e => { setSgQ(e.target.value); setSgHi(0); setSgOpen(true); }}
                  onFocus={() => setSgOpen(true)}
                  onBlur={() => setTimeout(() => setSgOpen(false), 150)}
                  onKeyDown={e => {
                    const l = suggestions;
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSgHi(h => Math.min(h + 1, l.length - 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setSgHi(h => Math.max(h - 1, 0)); }
                    else if (e.key === 'Enter' && l[sgHi]) { e.preventDefault(); addRec(l[sgHi]); }
                    else if (e.key === 'Backspace' && !sgQ && form.rec.length) {
                      setForm(f => ({ ...f, rec: f.rec.slice(0, -1) }));
                    }
                    else if (e.key === 'Escape') setSgOpen(false);
                  }} />
                {sgOpen && suggestions.length > 0 && (
                  <div className="drq-sg on" role="listbox">
                    {suggestions.slice(0, 6).map((s, k) => (
                      <button key={s.id} role="option" className={k === sgHi ? 'hi' : ''}
                        onMouseDown={e => { e.preventDefault(); addRec(s); }}>
                        <span className="drq-av" style={{ width: 28, height: 28, fontSize: 11, background: '#6366f1' }}>{initials(s.name)}</span>
                        {s.name}
                        <small>{s.email}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="drq-pills">
                <span>Add a group:</span>
                {GR.map(([key, lbl]) => (
                  <button key={key} className="drq-pill" onClick={() => addGroup(key)}>+ {lbl}</button>
                ))}
              </div>
            </section>

            {/* Step 2: What */}
            <section className={`drq-card${c[1][0] ? ' done' : ''}`} id="drq-sec2">
              <div className="drq-ch">
                <span className="drq-cn">2</span>
                <div><h2>What do you need?</h2><p>Start from a template or choose a type.</p></div>
              </div>
              <span className="drq-lbl" style={{ marginTop: 0 }}>Quick start <small>· fills in everything below, you can edit it</small></span>
              <div className="drq-tpl">
                {TP.map((t, i) => (
                  <button key={i} className="drq-tp" onClick={() => applyTpl(i)}>
                    {t.k}<small>{t.s}</small>
                  </button>
                ))}
              </div>
              <span className="drq-lbl">Request type</span>
              <div className="drq-types" role="radiogroup">
                {TY.map(([key, ic, name, desc]) => (
                  <button key={key} className="drq-ty" role="radio" aria-checked={type === key} data-ty={key}
                    onClick={() => setForm(f => ({ ...f, type: key as ReqType }))}>
                    <span className="drq-ck">✓</span>
                    <div className="drq-ty-ic">{ic}</div>
                    <b>{name}</b><span>{desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Step 3: Details */}
            <section className={`drq-card${c[2][0] ? ' done' : ''}`} id="drq-sec3">
              <div className="drq-ch">
                <span className="drq-cn">3</span>
                <div>
                  <h2>Details</h2>
                  <p>{type ? { doc: 'Name the documents and what you want to say.', form: 'Pick the fields students need to complete.', conf: 'Write the statement they will confirm.', other: 'Describe what you need in the message below.' }[type] : 'Choose a request type first.'}</p>
                </div>
              </div>

              {!type && <div className="drq-hint">Pick a type above and the right fields show up here.</div>}

              {type && (
                <div>
                  <label className="drq-lbl" style={{ marginTop: 0 }} htmlFor="drq-ttl">Title</label>
                  <input className="drq-fld" id="drq-ttl" maxLength={80}
                    placeholder="e.g. Upload documents for your CPT request"
                    value={ttl} onChange={e => setForm(f => ({ ...f, ttl: e.target.value }))} />

                  <label className="drq-lbl" htmlFor="drq-msg">
                    {type === 'other' ? 'What do you need from the student?' : 'Message to student'}
                    {' '}<small>{type === 'other' ? '· required, in your own words' : '· optional'}</small>
                  </label>
                  <textarea className="drq-fld" id="drq-msg" style={{ height: 120 }}
                    placeholder="Write your message…" value={msg}
                    onChange={e => setForm(f => ({ ...f, msg: e.target.value }))} />
                  <p className="drq-note">{msgTip}</p>

                  {type === 'doc' && (
                    <div>
                      <span className="drq-lbl">Required documents</span>
                      {docs.map((d, i) => (
                        <div key={i} className="drq-dr">
                          <span>📄</span>
                          <span className="drq-dnm">{d.n}</span>
                          <button className="drq-tgl" aria-pressed={d.r}
                            onClick={() => setForm(f => ({ ...f, docs: f.docs.map((x, j) => j === i ? { ...x, r: !x.r } : x) }))}>
                            {d.r ? 'Required' : 'Optional'}
                          </button>
                          <button className="drq-x" onClick={() => setForm(f => ({ ...f, docs: f.docs.filter((_, j) => j !== i) }))} aria-label={`Remove ${d.n}`}>✕</button>
                        </div>
                      ))}
                      <div className="drq-add">
                        <input className="drq-fld" placeholder="Add a document, then press Enter"
                          value={daddVal} onChange={e => setDaddVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDoc(); } }} />
                        <button className="drq-btn" onClick={addDoc}>Add</button>
                      </div>
                      <div className="drq-chs">
                        {DS.filter(d2 => !docs.some(d => d.n === d2)).map(d2 => (
                          <button key={d2} onClick={() => setForm(f => ({ ...f, docs: [...f.docs, { n: d2, r: true }] }))}>
                            + {d2}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {type === 'form' && (
                    <div>
                      <span className="drq-lbl">Fields the student will fill in</span>
                      <div className="drq-chs">
                        {FF.map(f2 => (
                          <button key={f2} aria-pressed={fields.includes(f2)}
                            onClick={() => setForm(f => ({ ...f, fields: f.fields.includes(f2) ? f.fields.filter(x => x !== f2) : [...f.fields, f2] }))}>
                            {f2}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {type === 'conf' && (
                    <div>
                      <label className="drq-lbl" htmlFor="drq-stm">Statement to confirm</label>
                      <textarea className="drq-fld" id="drq-stm"
                        placeholder="e.g. I confirm that my current U.S. address is correct…"
                        value={stm} onChange={e => setForm(f => ({ ...f, stm: e.target.value }))} />
                    </div>
                  )}

                  {type === 'other' && (
                    <label className="drq-chk">
                      <input type="checkbox" checked={attach}
                        onChange={e => setForm(f => ({ ...f, attach: e.target.checked }))} />
                      <span><b>Let students upload files</b> with their response <span style={{ color: '#9ca3af' }}>(optional)</span></span>
                    </label>
                  )}
                </div>
              )}
            </section>

            {/* Step 4: Deadline */}
            <section className={`drq-card${c[3][0] ? ' done' : ''}`} id="drq-sec4">
              <div className="drq-ch">
                <span className="drq-cn">4</span>
                <div><h2>Deadline &amp; follow-up</h2><p>Set when you need it and how hard to nudge.</p></div>
              </div>
              <div className="drq-two">
                <div>
                  <span className="drq-lbl" id="drq-dl">Due date</span>
                  <div className="drq-dues">
                    {([['Tomorrow', 1], ['3 days', 3], ['1 week', 7], ['2 weeks', 14]] as [string, number][]).map(([lbl, n]) => (
                      <button key={n} aria-pressed={due === iso(n)}
                        onClick={() => setForm(f => ({ ...f, due: iso(n) }))}>{lbl}</button>
                    ))}
                  </div>
                  <input className="drq-fld" type="date" value={due} aria-labelledby="drq-dl"
                    onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
                </div>
                <div>
                  <span className="drq-lbl" id="drq-pl">Priority</span>
                  <div className="drq-seg" role="radiogroup" aria-labelledby="drq-pl">
                    {(['Normal', 'High', 'Urgent'] as const).map(p => (
                      <button key={p} role="radio" aria-checked={pri === p} data-p={p}
                        onClick={() => setForm(f => ({ ...f, pri: p }))}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              <label className="drq-chk">
                <input type="checkbox" checked={remind} onChange={e => setForm(f => ({ ...f, remind: e.target.checked }))} />
                <span><b>Auto-remind</b> students 2 days before it's due and when it's overdue</span>
              </label>
              <label className="drq-chk">
                <input type="checkbox" checked={notify} onChange={e => setForm(f => ({ ...f, notify: e.target.checked }))} />
                <span><b>Notify me</b> when a student submits</span>
              </label>
            </section>

          </div>

          {/* preview sidebar */}
          <aside className="drq-pv" aria-label="Live preview">
            <div className="drq-pvt"><h3>PREVIEW</h3></div>
            <div className="drq-dev">
              <div className="drq-dev-bar">
                <i /><i /><i /><span style={{ marginLeft: 6 }}>Student portal · Request Center</span>
              </div>
              <div className="drq-dev-body" dangerouslySetInnerHTML={{ __html: renderPreview() }} aria-live="polite" />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ─── Root render ──────────────────────────────────────────────────────────

  return (
    <div className="drq-page" style={{ position: 'relative' }}>
      <div ref={scrollRef} className="drq-scroll">
        <div className="drq-wrap">

          {/* page header */}
          <div className="drq-hh">
            <span className="drq-hi">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 9v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h3M6 8l2 2 6-6"/>
              </svg>
            </span>
            <div>
              <h1 style={{ fontSize: 26, letterSpacing: '-.6px', margin: '0 0 4px', color: '#111827' }}>Action Requests</h1>
              <p style={{ color: '#6b7280', fontSize: 14.5, margin: 0 }}>Ask students for documents, forms and confirmations, and see who has responded.</p>
            </div>
          </div>

          {/* tabs */}
          <div className="drq-tabs" role="tablist" aria-label="Action requests">
            <button role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}>
              All requests <span className="drq-tcount">{requests.length}</span>
            </button>
            <button role="tab" aria-selected={tab === 'new'} className="drq-new-tab"
              onClick={() => { setTab('new'); scrollRef.current && (scrollRef.current.scrollTop = 0); }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
                <path d="M14 2L7 9M14 2l-4.5 12-2.5-5-5-2.5L14 2z"/>
              </svg>
              New request
            </button>
          </div>

          {tab === 'list' && (
            <div role="tabpanel" aria-labelledby="All requests">{renderListTab()}</div>
          )}
          {tab === 'new' && !showOk && (
            <div role="tabpanel" aria-labelledby="New request">{renderNewTab()}</div>
          )}
        </div>
      </div>

      {/* sticky footer — new tab only */}
      {tab === 'new' && !showOk && (
        <div className="drq-foot">
          <button className="drq-btn" onClick={() => { resetForm(); setTab('list'); }}>Cancel</button>
          <div className="drq-foot-sum" dangerouslySetInnerHTML={{ __html: sumMsg() }} />
          <button className="drq-btn" onClick={() => showToast('Draft saved (demo)')}>Save draft</button>
          <button className={`drq-btn drq-btn-p`} aria-disabled={!isReady}
            onClick={sendRequest}
            style={!isReady ? { background: '#bfd0f7', boxShadow: 'none', cursor: 'not-allowed', filter: 'none' } : {}}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M14 2L7 9M14 2l-4.5 12-2.5-5-5-2.5L14 2z"/>
            </svg>
            Send request
          </button>
        </div>
      )}

      {/* success overlay */}
      {showOk && (
        <div className="drq-ok on">
          <div>
            <div className="drq-tick">✓</div>
            <h2>{okTitle}</h2>
            <p>{okBody}</p>
            <div className="drq-ok-actions">
              <button className="drq-btn" onClick={() => { resetForm(); setTab('new'); }}>Create another</button>
              <button className="drq-btn drq-btn-p" onClick={() => { resetForm(); setTab('list'); }}>View in Action Requests</button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      <div className={`drq-toast${toast ? ' on' : ''}`} role="status">{toast}</div>
    </div>
  );
}
