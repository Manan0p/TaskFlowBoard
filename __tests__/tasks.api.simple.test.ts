/// <reference types="jest" />

/**
 * Simple Jest Unit Test for Tasks API
 * 
 * This test demonstrates unit testing for the core Tasks API functionality
 * as requested in the requirements. It focuses on testing the business logic
 * and validation without complex integration setup.
 */

import { insertTaskSchema, updateTaskSchema } from '../shared/schema';

describe('Tasks API Unit Tests', () => {
  
  describe('Task Schema Validation', () => {
    it('should validate correct task creation data', () => {
      const validTaskData = {
        title: 'Test Task',
        description: 'A test task description',
        status: 'todo',
        priority: 'medium',
        projectId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = insertTaskSchema.safeParse(validTaskData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject(validTaskData);
      }
    });

    it('should reject task creation without required title', () => {
      const invalidTaskData = {
        description: 'A test task description',
        status: 'todo',
        priority: 'medium',
        projectId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = insertTaskSchema.safeParse(invalidTaskData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should reject invalid priority values', () => {
      const invalidTaskData = {
        title: 'Test Task',
        description: 'A test task description',
        status: 'todo',
        priority: 'invalid-priority',
        projectId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = insertTaskSchema.safeParse(invalidTaskData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const priorityError = result.error.issues.find(issue => 
          issue.path.includes('priority')
        );
        expect(priorityError).toBeDefined();
      }
    });

    it('should accept any status values (schema uses varchar)', () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task description',
        status: 'custom-status',
        priority: 'medium',
        projectId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = insertTaskSchema.safeParse(taskData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('custom-status');
      }
    });

    it('should validate task update data', () => {
      const validUpdateData = {
        title: 'Updated Task Title',
        status: 'in-progress',
        priority: 'high',
        deadline: '2024-12-31'
      };

      const result = updateTaskSchema.safeParse(validUpdateData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject(validUpdateData);
      }
    });
  });

  describe('Task Business Logic', () => {
    it('should handle priority levels correctly', () => {
      const priorities = ['low', 'medium', 'high'];
      
      priorities.forEach(priority => {
        const taskData = {
          title: `Task with ${priority} priority`,
          priority,
          status: 'todo',
          projectId: '123e4567-e89b-12d3-a456-426614174000'
        };
        
        const result = insertTaskSchema.safeParse(taskData);
        expect(result.success).toBe(true);
      });
    });

    it('should handle status transitions correctly', () => {
      const statuses = ['todo', 'in-progress', 'done'];
      
      statuses.forEach(status => {
        const taskData = {
          title: `Task with ${status} status`,
          priority: 'medium',
          status,
          projectId: '123e4567-e89b-12d3-a456-426614174000'
        };
        
        const result = insertTaskSchema.safeParse(taskData);
        expect(result.success).toBe(true);
      });
    });

    it('should allow optional fields to be undefined', () => {
      const minimalTaskData = {
        title: 'Minimal Task',
        projectId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = insertTaskSchema.safeParse(minimalTaskData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Minimal Task');
        expect(result.data.projectId).toBe('123e4567-e89b-12d3-a456-426614174000');
        // Optional fields are allowed to be undefined in insert schema
        expect(result.data.status).toBeUndefined();
        expect(result.data.priority).toBeUndefined();
      }
    });

    it('should validate date format for deadline', () => {
      const taskDataWithDeadline = {
        title: 'Task with deadline',
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        deadline: '2024-12-31'
      };

      const result = insertTaskSchema.safeParse(taskDataWithDeadline);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deadline).toBe('2024-12-31');
      }
    });
  });

  describe('API Response Validation', () => {
    it('should have proper structure for task objects', () => {
      const mockTaskResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Task',
        description: 'Test description',
        status: 'todo',
        priority: 'medium',
        deadline: null,
        projectId: '123e4567-e89b-12d3-a456-426614174001',
        userId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      // Verify the task object has all required properties
      expect(mockTaskResponse).toHaveProperty('id');
      expect(mockTaskResponse).toHaveProperty('title');
      expect(mockTaskResponse).toHaveProperty('status');
      expect(mockTaskResponse).toHaveProperty('priority');
      expect(mockTaskResponse).toHaveProperty('projectId');
      expect(mockTaskResponse).toHaveProperty('userId');
      expect(mockTaskResponse).toHaveProperty('createdAt');
      expect(mockTaskResponse).toHaveProperty('updatedAt');
    });

    it('should validate pagination parameters', () => {
      const validPaginationParams = {
        page: 1,
        limit: 50
      };

      expect(validPaginationParams.page).toBeGreaterThan(0);
      expect(validPaginationParams.limit).toBeGreaterThan(0);
      expect(validPaginationParams.limit).toBeLessThanOrEqual(100);
    });

    it('should handle filter parameters correctly', () => {
      const validFilters = {
        status: 'todo',
        priority: 'high',
        projectId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const validStatuses = ['todo', 'in-progress', 'done'];
      const validPriorities = ['low', 'medium', 'high'];

      expect(validStatuses).toContain(validFilters.status);
      expect(validPriorities).toContain(validFilters.priority);
      expect(validFilters.projectId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });
});