/**
 * Messaging Routes
 * HTTP endpoints for DSO ↔ Student two-way messaging.
 *
 * All routes require auth. Role-specific routes enforce via requireRole.
 * requireRole also sets c.get('schoolId') and c.get('userRole') on the context.
 */

import { Hono } from 'npm:hono';
import { messagingService } from './messaging.service.ts';
import { authMiddleware, requireRole } from '../../middleware/auth.ts';
import { asyncHandler } from '../../middleware/error-handler.ts';

export const messagingRoutes = new Hono();

// All messaging routes require a valid JWT
messagingRoutes.use('*', authMiddleware);

// ── Send ─────────────────────────────────────────────────────────────────────

/**
 * POST /messaging/send
 * Send a message. Works for both DSO → student and student → DSO.
 */
messagingRoutes.post(
  '/send',
  requireRole(['student', 'dso', 'admin']),
  asyncHandler(async (c) => {
    const senderId   = c.get('userId')   as string;
    const schoolId   = c.get('schoolId') as string;
    const senderRole = c.get('userRole') as string;
    const body       = await c.req.json();

    const { recipientId, subject, bodyText, templateRef, recipientType, bulkFilter, parentId, threadId } = body;

    if (!subject || !bodyText) {
      return c.json({ error: 'Subject and body are required' }, 400);
    }

    const message = await messagingService.sendMessage(senderId, schoolId, senderRole, {
      recipientId,
      subject,
      body: bodyText,
      templateRef,
      recipientType,
      bulkFilter,
      parentId,
      threadId,
    });

    return c.json({ success: true, message });
  })
);

// ── Inbox (student) ───────────────────────────────────────────────────────────

/**
 * GET /messaging/inbox
 * Student inbox: messages where recipient_id = current user.
 */
messagingRoutes.get(
  '/inbox',
  requireRole(['student']),
  asyncHandler(async (c) => {
    const userId   = c.get('userId') as string;
    const messages = await messagingService.getStudentInbox(userId);
    return c.json({ messages });
  })
);

// ── Inbox (DSO) ───────────────────────────────────────────────────────────────

/**
 * GET /messaging/dso-inbox
 * DSO inbox: all student messages for this school.
 */
messagingRoutes.get(
  '/dso-inbox',
  requireRole(['dso', 'admin']),
  asyncHandler(async (c) => {
    const schoolId = c.get('schoolId') as string;
    const messages = await messagingService.getDSOInbox(schoolId);
    return c.json({ messages });
  })
);

// ── Outbox (any role) ─────────────────────────────────────────────────────────

/**
 * GET /messaging/sent
 * Messages sent by the current user.
 */
messagingRoutes.get(
  '/sent',
  requireRole(['student', 'dso', 'admin']),
  asyncHandler(async (c) => {
    const userId   = c.get('userId') as string;
    const messages = await messagingService.getSentMessages(userId);
    return c.json({ messages });
  })
);

// ── Thread ────────────────────────────────────────────────────────────────────

/**
 * GET /messaging/thread/:threadId
 * Full conversation thread (all messages with the same thread_id).
 */
messagingRoutes.get(
  '/thread/:threadId',
  requireRole(['student', 'dso', 'admin']),
  asyncHandler(async (c) => {
    const threadId = c.req.param('threadId');
    const messages = await messagingService.getThread(threadId);
    return c.json({ messages });
  })
);

// ── Mark as read ──────────────────────────────────────────────────────────────

/**
 * PUT /messaging/:id/read
 * Mark a single message as read.
 */
messagingRoutes.put(
  '/:id/read',
  requireRole(['student', 'dso', 'admin']),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    await messagingService.markAsRead(id);
    return c.json({ success: true });
  })
);

// ── Unread count ──────────────────────────────────────────────────────────────

/**
 * GET /messaging/unread-count
 * Unread message count for the current user.
 * DSO: counts unread student messages for the school.
 * Student: counts unread messages addressed to this user.
 */
messagingRoutes.get(
  '/unread-count',
  requireRole(['student', 'dso', 'admin']),
  asyncHandler(async (c) => {
    const userId   = c.get('userId')   as string;
    const userRole = c.get('userRole') as string;
    const schoolId = c.get('schoolId') as string;
    const count    = await messagingService.getUnreadCount(userId, userRole, schoolId);
    return c.json({ count });
  })
);
