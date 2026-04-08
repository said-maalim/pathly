/**
 * Authentication Routes
 * HTTP endpoints for authentication
 */

import { Hono } from 'npm:hono';
import { authService } from './auth.service.ts';
import { asyncHandler } from '../../middleware/error-handler.ts';

export const authRoutes = new Hono();

/**
 * POST /auth/signup/student
 * Register a new student account
 */
authRoutes.post('/signup/student', asyncHandler(async (c) => {
  const body = await c.req.json();

  const { email, password, name, studentIdNumber, schoolId } = body;

  if (!email || !password || !name || !studentIdNumber || !schoolId) {
    return c.json({
      error: 'VALIDATION_ERROR',
      field: 'all',
      message: 'Email, password, name, student ID, and school ID are required'
    }, 400);
  }

  const result = await authService.signupStudent({
    email,
    password,
    name,
    studentIdNumber,
    schoolId
  });

  return c.json(result);
}));

/**
 * POST /auth/signup/dso
 * Register a new DSO account
 */
authRoutes.post('/signup/dso', asyncHandler(async (c) => {
  const body = await c.req.json();

  const { email, password, name, schoolId } = body;

  if (!email || !password || !name || !schoolId) {
    return c.json({
      error: 'All fields are required'
    }, 400);
  }

  const result = await authService.signupDSO({
    email,
    password,
    name,
    schoolId
  });

  return c.json(result);
}));
