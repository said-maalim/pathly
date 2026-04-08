/**
 * Requests Routes
 * HTTP endpoints for student requests
 */

import { Hono } from 'npm:hono';
import { requestsService } from './requests.service.ts';
import { authMiddleware, requireRole } from '../../middleware/auth.ts';
import { asyncHandler } from '../../middleware/error-handler.ts';

export const requestsRoutes = new Hono();

// Apply auth middleware to all routes
requestsRoutes.use('*', authMiddleware);

/**
 * POST /requests/submit
 * Submit a new request (Students only)
 */
requestsRoutes.post('/submit', requireRole(['student']), asyncHandler(async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { requestType, requestName, reason, formData, uploadedFiles, priority } = body;
  
  if (!requestType || !requestName) {
    return c.json({ error: 'Request type and name are required' }, 400);
  }
  
  const request = await requestsService.submitRequest(userId, {
    requestType,
    requestName,
    reason,
    formData,
    uploadedFiles,
    priority
  });
  
  return c.json({ success: true, request });
}));

/**
 * GET /requests/my-requests
 * Get all requests for current student
 */
requestsRoutes.get('/my-requests', requireRole(['student']), asyncHandler(async (c) => {
  const userId = c.get('userId');
  const requests = await requestsService.getStudentRequests(userId);
  
  return c.json({ requests });
}));

/**
 * GET /requests/school/:schoolId
 * Get all requests for a school (DSO only)
 */
requestsRoutes.get(
  '/school/:schoolId',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const schoolId = c.req.param('schoolId');
    const userSchoolId = c.get('schoolId');
    
    // Verify DSO can only access their own school
    if (schoolId !== userSchoolId) {
      return c.json({ error: 'Forbidden: Can only access your own school' }, 403);
    }
    
    // Get query params for filtering
    const status = c.req.query('status');
    const requestType = c.req.query('requestType');
    const priority = c.req.query('priority');
    
    const requests = await requestsService.getSchoolRequests(schoolId, {
      status,
      requestType,
      priority
    });
    
    return c.json({ requests });
  })
);

/**
 * GET /requests/:requestId
 * Get request details
 */
requestsRoutes.get('/:requestId', asyncHandler(async (c) => {
  const requestId = c.req.param('requestId');
  const request = await requestsService.getRequestById(requestId);
  
  return c.json({ request });
}));

/**
 * PUT /requests/:requestId/status
 * Update request status (DSO only)
 */
requestsRoutes.put(
  '/:requestId/status',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const requestId = c.req.param('requestId');
    const userId = c.get('userId');
    const body = await c.req.json();
    
    const { status, notes, internalNotes } = body;
    
    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }
    
    const request = await requestsService.updateRequestStatus(
      requestId,
      { status, notes, internalNotes },
      userId
    );
    
    return c.json({ success: true, request });
  })
);

/**
 * GET /requests/school/:schoolId/stats
 * Get request statistics (DSO only)
 */
requestsRoutes.get(
  '/school/:schoolId/stats',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const schoolId = c.req.param('schoolId');
    const userSchoolId = c.get('schoolId');
    
    if (schoolId !== userSchoolId) {
      return c.json({ error: 'Forbidden: Can only access your own school' }, 403);
    }
    
    const stats = await requestsService.getSchoolStats(schoolId);
    
    return c.json({ stats });
  })
);
