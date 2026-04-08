/**
 * Pathly Platform - Main Server Entry Point
 * Refactored service-based architecture using Relational Database
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { initializeStorage } from './config/database.ts';
import { errorHandler } from './middleware/error-handler.ts';

// Import route modules
import { authRoutes } from './services/auth/auth.routes.ts';
import { usersRoutes } from './services/users/users.routes.ts';
import { studentsRoutes } from './services/students/students.routes.ts';
import { requestsRoutes } from './services/requests/requests.routes.ts';
import { documentsRoutes } from './services/documents/documents.routes.ts';
import { rosterRoutes } from './services/roster/roster.routes.ts';

// Initialize Hono app
const app = new Hono();

// ==================== MIDDLEWARE ====================

// Logger middleware
app.use('*', logger(console.log));

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600
}));

// ==================== HEALTH CHECK ====================

app.get('/make-server-268175b3/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'relational'
  });
});

// ==================== MOUNT ROUTES ====================

app.route('/make-server-268175b3/auth', authRoutes);
app.route('/make-server-268175b3/users', usersRoutes);
app.route('/make-server-268175b3/students', studentsRoutes);
app.route('/make-server-268175b3/requests', requestsRoutes);
app.route('/make-server-268175b3/documents', documentsRoutes);
app.route('/make-server-268175b3/roster', rosterRoutes);

// ==================== ERROR HANDLING ====================

app.onError(errorHandler);

// ==================== NOT FOUND ====================

app.notFound((c) => {
  return c.json({
    error: 'Not found',
    path: c.req.path,
    method: c.req.method
  }, 404);
});

// ==================== INITIALIZATION ====================

// Initialize storage on startup
console.log('🚀 Initializing Pathly server...');
await initializeStorage();
console.log('✅ Server initialized successfully');

// ==================== START SERVER ====================

Deno.serve(app.fetch);