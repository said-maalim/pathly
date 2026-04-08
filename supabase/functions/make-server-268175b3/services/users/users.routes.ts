/**
 * Users Routes
 * HTTP endpoints for user profile management
 */

import { Hono } from 'npm:hono';
import { usersService } from './users.service.ts';
import { authMiddleware } from '../../middleware/auth.ts';
import { asyncHandler } from '../../middleware/error-handler.ts';

export const usersRoutes = new Hono();

// Apply auth middleware to all routes
usersRoutes.use('*', authMiddleware);

/**
 * GET /users/profile
 * Get current user's profile
 */
usersRoutes.get('/profile', asyncHandler(async (c) => {
  const userId = c.get('userId');
  const user = await usersService.getMyProfile(userId);
  
  return c.json({ profile: user });
}));

/**
 * PUT /users/profile
 * Update current user's profile
 */
usersRoutes.put('/profile', asyncHandler(async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { fullName, preferredName, phone, avatarUrl } = body;
  
  const user = await usersService.updateMyProfile(userId, {
    fullName,
    preferredName,
    phone,
    avatarUrl
  });
  
  return c.json({ success: true, profile: user });
}));

/**
 * GET /users/:userId
 * Get user by ID
 */
usersRoutes.get('/:userId', asyncHandler(async (c) => {
  const userId = c.req.param('userId');
  const user = await usersService.getUserById(userId);
  
  return c.json({ user });
}));
