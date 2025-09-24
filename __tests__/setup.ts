// Jest setup file for API testing
import { jest } from '@jest/globals';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.REPL_ID = 'test-repl-id';
process.env.REPLIT_DOMAINS = 'localhost:3000,test.replit.dev';

// Increase timeout for database operations
jest.setTimeout(30000);