/**
 * Landing page constants — copy, data objects, and config.
 * All section content lives here so components stay markup-only.
 */

/** Single place to change the demo CTA destination. */
export const DEMO_MAILTO = 'mailto:hello@pathly.app';

/** Route for the "Access portal" / sign-in link. */
export const ACCESS_ROUTE = 'sign-in';

// ─── Proof strip ────────────────────────────────────────────────────────────────

export interface ProofItem {
  bold: string;
  rest: string;
}

export const PROOF_ITEMS: ProofItem[] = [
  { bold: 'One workspace', rest: 'for DSOs and students' },
  { bold: 'Every request type', rest: 'CPT, OPT, STEM OPT, I-20' },
  { bold: 'Early warnings', rest: 'on visas, passports, SEVIS' },
  { bold: 'Built for universities', rest: 'not adapted from HR tools' },
];

// ─── Audience tabs ──────────────────────────────────────────────────────────────

export interface AudiencePanelRow {
  color: string; // CSS variable name, e.g. 'var(--lp-red)'
  label: string;
  meta: string;
}

export interface AudiencePanelBar {
  widthPercent: number;
}

export interface AudienceTab {
  key: string;
  label: string;
  heading: string;
  ticks: string[];
  panelTitle: string;
  panelRows: AudiencePanelRow[];
  /** Optional progress bar shown after the first row (student tab). */
  panelBar?: AudiencePanelBar;
}

export const AUDIENCE_TABS: AudienceTab[] = [
  {
    key: 'dso',
    label: 'For DSOs',
    heading: 'Spend your day on decisions, not data entry.',
    ticks: [
      'Prioritized queue of requests, alerts, and expiring documents',
      'Approve, decline, or request more information in one click',
      'Import a roster and see every student\u2019s status instantly',
      'Message students without leaving their record',
    ],
    panelTitle: 'Priority workflow',
    panelRows: [
      { color: 'var(--lp-red)', label: 'Visa expiring in under 30 days', meta: 'High' },
      { color: 'var(--lp-amber)', label: 'CPT extension, undergrad to grad', meta: 'Review' },
      { color: 'var(--lp-red)', label: 'SEVIS sync error', meta: 'High' },
    ],
  },
  {
    key: 'stu',
    label: 'For students',
    heading: 'Know where you stand, and what to do next.',
    ticks: [
      'See your visa, passport, and SEVIS status on one screen',
      'Choose a request and see exactly which documents you need',
      'Track every request from submitted to approved',
      'Message your DSO directly, with no more lost emails',
    ],
    panelTitle: 'Your requests',
    panelRows: [
      { color: 'var(--lp-amber)', label: 'OPT application', meta: 'In review' },
    ],
    panelBar: { widthPercent: 60 },
  },
];

/** Extra rows shown after the bar in the student tab panel. */
export const STUDENT_EXTRA_ROWS: AudiencePanelRow[] = [
  { color: 'var(--lp-green)', label: 'Travel signature', meta: 'Approved' },
  { color: 'var(--lp-blue)', label: 'New message from your DSO', meta: '2m ago' },
];

// ─── Capabilities ───────────────────────────────────────────────────────────────

export interface Capability {
  title: string;
  description: string;
  chips?: string[];
}

export const CAPABILITIES: Capability[] = [
  {
    title: 'Compliance monitoring',
    description:
      'See expiring visas, passports, and SEVIS errors ranked by urgency, with the student and the next step attached to each alert.',
    chips: ['Visa expiry', 'SEVIS sync', 'Passport dates'],
  },
  {
    title: 'Request workflows',
    description:
      'Students pick a request type, see what documents they need, and submit once. DSOs approve, decline, or ask for more information in a single view.',
    chips: ['CPT', 'OPT', 'STEM OPT', 'Travel signature', 'Transfer'],
  },
  {
    title: 'Document management',
    description:
      'Collect, verify, and store immigration documents against each student\u2019s record, and know exactly what is missing.',
  },
  {
    title: 'Messaging',
    description:
      'Talk to students inside the platform, next to the request they are asking about, instead of across scattered email threads.',
  },
  {
    title: 'Reporting',
    description:
      'Track enrollment, visa types, SEVIS status, and compliance across your whole population, and export it when someone asks.',
  },
];

// ─── How it works ───────────────────────────────────────────────────────────────

export interface HowStep {
  title: string;
  description: string;
}

export const HOW_STEPS: HowStep[] = [
  {
    title: 'Import your roster',
    description:
      'Upload student records from your existing system. Pathly builds each profile and flags what\u2019s missing.',
  },
  {
    title: 'Students submit requests',
    description:
      'Students log in, choose a request, attach documents, and track progress without emailing your office.',
  },
  {
    title: 'Your team reviews and decides',
    description:
      'Work through a prioritized queue, approve in a click, and keep every decision on the student\u2019s record.',
  },
];

// ─── Security ───────────────────────────────────────────────────────────────────

export interface SecurityPoint {
  title: string;
  description: string;
}

export const SECURITY_POINTS: SecurityPoint[] = [
  {
    title: 'FERPA-compliant',
    description:
      'Access follows your office\u2019s roles, so people see only the records they are responsible for.',
  },
  {
    title: 'Bank-level encryption',
    description: 'Sensitive data and documents are encrypted in transit and at rest.',
  },
  {
    title: 'A record of every action',
    description:
      'Approvals, edits, and messages stay attached to the student\u2019s file for audits.',
  },
];

// ─── Nav links (smooth-scroll anchors) ──────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Who it\u2019s for', href: '#audiences' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'How it works', href: '#how' },
  { label: 'Security', href: '#security' },
];
