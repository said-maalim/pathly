export const SCHOOLS = [
  { id: 'berea', name: 'Berea College', abbr: 'BC' },
  { id: 'georgetown', name: 'Georgetown University', abbr: 'GU' },
] as const;

export type SchoolId = typeof SCHOOLS[number]['id'];
export type School = typeof SCHOOLS[number];

export const ROLE_COPY: Record<'student' | 'dso', string> = {
  student: 'Check your visa status, submit requests, and message your DSO.',
  dso: 'Review requests, monitor compliance, and keep students in status.',
};

export const ROUTES = {
  home: '/',
  studentPortal: '/student-portal',
  dsoPortal: '/dso-portal',
  forgotPassword: '#',
} as const;

export const STORAGE_KEY = 'pathly_school';
