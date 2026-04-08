/**
 * Roster Import Routes
 *
 * All endpoints are scoped to DSO and admin roles only.
 * schoolId is ALWAYS read from auth context (c.get('schoolId')) — never from
 * the request body — preventing cross-tenant writes.
 *
 * Endpoints:
 *   POST /roster/upload           — upload file, parse, validate, preview
 *   POST /roster/:id/confirm      — commit to DB + send invitations
 *   GET  /roster/history          — list all imports for DSO's school
 *   GET  /roster/:id              — get import detail
 *   GET  /roster/:id/errors       — download error rows as CSV
 */

import { Hono } from 'npm:hono';
import { rosterService } from './roster.service.ts';
import { authMiddleware, requireRole } from '../../middleware/auth.ts';
import { asyncHandler } from '../../middleware/error-handler.ts';

export const rosterRoutes = new Hono();

// All roster routes require authentication + DSO/admin role
rosterRoutes.use('*', authMiddleware);
rosterRoutes.use('*', requireRole(['dso', 'admin']));

// ─── POST /roster/upload ──────────────────────────────────────────────────────
// Accepts multipart/form-data with a 'file' field (CSV or XLSX).
// Returns UploadPreviewResponse — no DB student writes yet.

rosterRoutes.post('/upload', asyncHandler(async (c) => {
  const schoolId = c.get('schoolId') as string;
  const userId = c.get('userId') as string;

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return c.json({
      error: 'MISSING_FILE',
      message: 'A file must be provided in the "file" form field',
    }, 400);
  }

  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!allowed.includes(ext)) {
    return c.json({
      error: 'INVALID_FILE_TYPE',
      message: `File must be a CSV or Excel file. Received: ${ext}`,
    }, 400);
  }

  // 25MB limit (matches storage bucket)
  if (file.size > 26_214_400) {
    return c.json({
      error: 'FILE_TOO_LARGE',
      message: 'File size must not exceed 25MB',
    }, 400);
  }

  const preview = await rosterService.uploadAndPreview(file, schoolId, userId);
  return c.json(preview, 200);
}));

// ─── POST /roster/:id/confirm ─────────────────────────────────────────────────
// Commits the validated rows to the database. Idempotent guard: only
// imports in 'processing' status can be confirmed.

rosterRoutes.post('/:id/confirm', asyncHandler(async (c) => {
  const importId = c.req.param('id');
  const schoolId = c.get('schoolId') as string;
  const userId = c.get('userId') as string;

  const result = await rosterService.confirmImport(importId, schoolId, userId);
  return c.json(result, 200);
}));

// ─── GET /roster/history ──────────────────────────────────────────────────────
// IMPORTANT: this route must be registered before /roster/:id so Hono
// doesn't match 'history' as the :id param.

rosterRoutes.get('/history', asyncHandler(async (c) => {
  const schoolId = c.get('schoolId') as string;

  const imports = await rosterService.getHistory(schoolId);
  return c.json({ imports }, 200);
}));

// ─── GET /roster/:id ──────────────────────────────────────────────────────────

rosterRoutes.get('/:id', asyncHandler(async (c) => {
  const importId = c.req.param('id');
  const schoolId = c.get('schoolId') as string;

  const record = await rosterService.getDetail(importId, schoolId);
  return c.json({ import: record }, 200);
}));

// ─── GET /roster/:id/errors ───────────────────────────────────────────────────
// Returns a CSV file for the DSO to download.

rosterRoutes.get('/:id/errors', asyncHandler(async (c) => {
  const importId = c.req.param('id');
  const schoolId = c.get('schoolId') as string;

  const csv = await rosterService.buildErrorCsv(importId, schoolId);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="import-errors-${importId.slice(0, 8)}.csv"`,
    },
  });
}));
