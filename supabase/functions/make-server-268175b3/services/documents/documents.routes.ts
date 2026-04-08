/**
 * Documents Routes
 * HTTP endpoints for document management
 */

import { Hono } from 'npm:hono';
import { documentsService } from './documents.service.ts';
import { authMiddleware, requireRole } from '../../middleware/auth.ts';
import { asyncHandler } from '../../middleware/error-handler.ts';

export const documentsRoutes = new Hono();

// Apply auth middleware to all routes
documentsRoutes.use('*', authMiddleware);

/**
 * GET /documents/my-documents
 * Get documents for current student
 */
documentsRoutes.get('/my-documents', requireRole(['student']), asyncHandler(async (c) => {
  const userId = c.get('userId');
  const documents = await documentsService.getMyDocuments(userId);
  
  return c.json({ documents });
}));

/**
 * GET /documents/student/:studentId
 * Get documents for a specific student (DSO or student themselves)
 */
documentsRoutes.get('/student/:studentId', asyncHandler(async (c) => {
  const studentId = c.req.param('studentId');
  const documents = await documentsService.getStudentDocuments(studentId);
  
  return c.json({ documents });
}));

/**
 * GET /documents/school/:schoolId
 * Get all documents for a school (DSO only)
 */
documentsRoutes.get(
  '/school/:schoolId',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const schoolId = c.req.param('schoolId');
    const userSchoolId = c.get('schoolId');
    
    if (schoolId !== userSchoolId) {
      return c.json({ error: 'Forbidden: Can only access your own school' }, 403);
    }
    
    const documents = await documentsService.getSchoolDocuments(schoolId);
    
    return c.json({ documents });
  })
);

/**
 * GET /documents/:documentId
 * Get document details
 */
documentsRoutes.get('/:documentId', asyncHandler(async (c) => {
  const documentId = c.req.param('documentId');
  const document = await documentsService.getDocumentById(documentId);
  
  return c.json({ document });
}));

/**
 * GET /documents/:documentId/download
 * Get download URL for document
 */
documentsRoutes.get('/:documentId/download', asyncHandler(async (c) => {
  const documentId = c.req.param('documentId');
  const url = await documentsService.getDownloadUrl(documentId);
  
  return c.json({ url });
}));

/**
 * POST /documents/upload
 * Upload a new document (DSO only for now)
 */
documentsRoutes.post(
  '/upload',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const body = await c.req.json();
    
    const {
      studentId,
      title,
      documentType,
      category,
      fileName,
      fileSizeBytes,
      fileType,
      storagePath,
      notes
    } = body;
    
    if (!studentId || !title || !documentType || !fileName || !storagePath) {
      return c.json({ 
        error: 'Student ID, title, document type, file name, and storage path are required' 
      }, 400);
    }
    
    const document = await documentsService.createDocument({
      studentId,
      title,
      documentType,
      category,
      fileName,
      fileSizeBytes,
      fileType,
      storagePath,
      notes
    }, userId, userRole);
    
    return c.json({ success: true, document });
  })
);

/**
 * DELETE /documents/:documentId
 * Delete a document (DSO only)
 */
documentsRoutes.delete(
  '/:documentId',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const documentId = c.req.param('documentId');
    const result = await documentsService.deleteDocument(documentId);
    
    return c.json(result);
  })
);
