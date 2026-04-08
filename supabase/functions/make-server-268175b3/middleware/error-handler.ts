/**
 * Global Error Handler
 * Centralized error handling and formatting
 */

import { Context } from 'npm:hono';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);
  
  // Determine status code based on error message
  let status = 500;
  let message = 'Internal server error';
  
  if (err.message.includes('not found')) {
    status = 404;
    message = 'Resource not found';
  } else if (err.message.includes('Unauthorized') || err.message.includes('Invalid token')) {
    status = 401;
    message = 'Unauthorized';
  } else if (err.message.includes('Forbidden') || err.message.includes('permission')) {
    status = 403;
    message = 'Forbidden';
  } else if (err.message.includes('validation') || err.message.includes('required')) {
    status = 400;
    message = 'Validation error';
  } else if (err.message.includes('duplicate') || err.message.includes('already exists')) {
    status = 409;
    message = 'Conflict';
  }
  
  return c.json({
    error: message,
    details: err.message,
    timestamp: new Date().toISOString()
  }, status);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: (c: Context) => Promise<Response>) {
  return async (c: Context) => {
    try {
      return await fn(c);
    } catch (error) {
      return errorHandler(error as Error, c);
    }
  };
}
