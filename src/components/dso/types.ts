/**
 * Shared DSOView type — used by both DSOShell, DSOSidebar, and UniversityDSOPortal.
 * Centralising here avoids a circular import from the parent.
 */
export type DSOView =
  | 'dashboard'
  | 'student-center'
  | 'compliance'
  | 'document-center'
  | 'request-center'
  | 'communication-center'
  | 'roster-import'
  | 'admin-settings'
  | 'request-actions-dashboard'
  | 'create-request-action'
  | 'request-action-detail';
