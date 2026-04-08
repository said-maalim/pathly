/**
 * Students Routes
 * HTTP endpoints for student management
 */

import { Hono } from 'npm:hono';
import { studentsService } from './students.service.ts';
import { authMiddleware, requireRole } from '../../middleware/auth.ts';
import { asyncHandler } from '../../middleware/error-handler.ts';

export const studentsRoutes = new Hono();

// Apply auth middleware to all routes
studentsRoutes.use('*', authMiddleware);

/**
 * GET /students/my-profile
 * Get current student's profile
 */
studentsRoutes.get('/my-profile', requireRole(['student']), asyncHandler(async (c) => {
  const userId = c.get('userId');
  const profile = await studentsService.getMyProfile(userId);

  return c.json(profile);
}));

/**
 * GET /students/school/:schoolId
 * Get all students for a school (DSO only)
 */
studentsRoutes.get(
  '/school/:schoolId',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const schoolId = c.req.param('schoolId');
    const userSchoolId = c.get('schoolId');

    // Verify DSO can only access their own school
    if (schoolId !== userSchoolId) {
      return c.json({ error: 'Forbidden: Can only access your own school' }, 403);
    }

    const students = await studentsService.getStudentsBySchool(schoolId);

    return c.json({ students });
  })
);

/**
 * GET /students/:studentId
 * Get student details
 */
studentsRoutes.get('/:studentId', asyncHandler(async (c) => {
  const studentId = c.req.param('studentId');
  const student = await studentsService.getStudentById(studentId);

  return c.json({ student });
}));

/**
 * PUT /students/:studentId/visa
 * Update student visa information (DSO only)
 */
studentsRoutes.put(
  '/:studentId/visa',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const studentId = c.req.param('studentId');
    const userId = c.get('userId');
    const body = await c.req.json();

    // Accept both `visaStatus` (canonical) and `status` (legacy frontend key)
    // Accept both `visaExpirationDate` and `expirationDate` for the same reason
    const payload = {
      visaType: body.visaType,
      visaStatus: body.visaStatus ?? body.status,
      visaExpirationDate: body.visaExpirationDate ?? body.expirationDate
    };

    console.log('[VISA UPDATE] studentId:', studentId, 'payload:', JSON.stringify(payload));

    const student = await studentsService.updateVisaInfo(studentId, payload, userId);

    console.log('[VISA UPDATE] result visa_status:', student?.visa_status, 'visa_expiration_date:', student?.visa_expiration_date);

    return c.json({ success: true, student });
  })
);

/**
 * PUT /students/:studentId/sevis
 * Update student SEVIS status (DSO only)
 */
studentsRoutes.put(
  '/:studentId/sevis',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const studentId = c.req.param('studentId');
    const userId = c.get('userId');
    const body = await c.req.json();

    const { sevisStatus, compliance, nextCheckDate } = body;

    if (!sevisStatus || !compliance) {
      return c.json({ error: 'SEVIS status and compliance are required' }, 400);
    }

    const student = await studentsService.updateSEVISStatus(
      studentId,
      { sevisStatus, compliance, nextCheckDate },
      userId
    );

    return c.json({ success: true, student });
  })
);

/**
 * PUT /students/:studentId/passport
 * Update student passport information (DSO only)
 */
studentsRoutes.put(
  '/:studentId/passport',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const studentId = c.req.param('studentId');
    const userId = c.get('userId');
    const body = await c.req.json();

    const { passportExpirationDate } = body;

    if (!passportExpirationDate) {
      return c.json({ error: 'Passport expiration date is required' }, 400);
    }

    const student = await studentsService.updatePassportInfo(
      studentId,
      { passportExpirationDate },
      userId
    );

    return c.json({ success: true, student });
  })
);
