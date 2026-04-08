/**
 * Authentication Middleware
 * Handle JWT verification and user context
 */

import { Context, Next } from 'npm:hono';
import { getSupabaseAdmin } from '../config/database.ts';

/**
 * Verify authentication token and attach user to context
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'Missing authorization header' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Invalid authorization format' }, 401);
  }
  
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('Auth error:', error?.message || 'Invalid token');
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  // Attach user to context
  c.set('user', user);
  c.set('userId', user.id);
  
  await next();
}

/**
 * Require specific user roles
 */
export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get user's role from database
    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      console.error('Error fetching user role:', error?.message);
      return c.json({ error: 'User not found' }, 404);
    }
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: user.role
      }, 403);
    }
    
    // Attach role and school to context
    c.set('userRole', user.role);
    c.set('schoolId', user.school_id);
    
    await next();
  };
}

/**
 * Optional auth - doesn't fail if no token provided
 */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const supabase = getSupabaseAdmin();
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        c.set('user', user);
        c.set('userId', user.id);
      }
    }
  }
  
  await next();
}
