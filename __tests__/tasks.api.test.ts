/// <reference types="jest" />
import request from 'supertest';
import { Express } from 'express';
import { registerRoutes } from '../server/routes';
import { storage } from '../server/storage';
import express from 'express';

describe('Tasks API', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  // Mock authenticated user for testing
  const mockUser = {
    claims: {
      sub: 'test-user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    }
  };

  // Mock authentication middleware for tests
  beforeEach(() => {
    // Mock the isAuthenticated middleware to pass through with test user
    jest.spyOn(require('../server/replitAuth'), 'isAuthenticated').mockImplementation((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      // First create a project to associate the task with
      const mockProject = {
        id: 'test-project-123',
        name: 'Test Project',
        description: 'Test project description',
        userId: mockUser.claims.sub,
        createdAt: new Date()
      };

      jest.spyOn(storage, 'createTask').mockResolvedValue({
        id: 'test-task-123',
        title: 'Test Task',
        description: 'Test task description',
        status: 'todo',
        priority: 'medium',
        deadline: null,
        projectId: mockProject.id,
        userId: mockUser.claims.sub,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        status: 'todo',
        priority: 'medium',
        projectId: mockProject.id
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: 'test-task-123',
        title: 'Test Task',
        description: 'Test task description',
        status: 'todo',
        priority: 'medium',
        projectId: mockProject.id,
        userId: mockUser.claims.sub
      });

      expect(storage.createTask).toHaveBeenCalledWith(taskData, mockUser.claims.sub);
    });

    it('should return 400 for invalid task data', async () => {
      const invalidTaskData = {
        // Missing required title field
        description: 'Test task description',
        status: 'todo',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTaskData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid task data');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/tasks', () => {
    it('should retrieve tasks for authenticated user', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          description: 'First task',
          status: 'todo',
          priority: 'high',
          deadline: null,
          projectId: 'project-1',
          userId: mockUser.claims.sub,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: 'project-1',
            name: 'Project 1',
            description: 'Test project',
            userId: mockUser.claims.sub,
            createdAt: new Date()
          }
        }
      ];

      jest.spyOn(storage, 'getTasks').mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0]).toMatchObject({
        id: 'task-1',
        title: 'Task 1',
        status: 'todo',
        priority: 'high'
      });

      expect(storage.getTasks).toHaveBeenCalledWith(
        mockUser.claims.sub,
        undefined, // projectId
        undefined, // status
        undefined, // priority
        undefined  // deadline
      );
    });

    it('should apply filters when provided', async () => {
      jest.spyOn(storage, 'getTasks').mockResolvedValue([]);

      const response = await request(app)
        .get('/api/tasks?projectId=test-project&status=todo&priority=high')
        .expect(200);

      expect(storage.getTasks).toHaveBeenCalledWith(
        mockUser.claims.sub,
        'test-project',
        'todo',
        'high',
        undefined
      );
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task successfully', async () => {
      const mockUpdatedTask = {
        id: 'test-task-123',
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'in-progress',
        priority: 'high',
        deadline: null,
        projectId: 'project-1',
        userId: mockUser.claims.sub,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(storage, 'updateTask').mockResolvedValue(mockUpdatedTask);

      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'in-progress',
        priority: 'high'
      };

      const response = await request(app)
        .put('/api/tasks/test-task-123')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'test-task-123',
        title: 'Updated Task Title',
        status: 'in-progress',
        priority: 'high'
      });

      expect(storage.updateTask).toHaveBeenCalledWith(
        'test-task-123',
        updateData,
        mockUser.claims.sub
      );
    });

    it('should return 404 when task not found', async () => {
      jest.spyOn(storage, 'updateTask').mockResolvedValue(undefined);

      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/tasks/nonexistent-task')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Task not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task successfully', async () => {
      jest.spyOn(storage, 'deleteTask').mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/tasks/test-task-123')
        .expect(204);

      expect(response.body).toEqual({});
      expect(storage.deleteTask).toHaveBeenCalledWith('test-task-123', mockUser.claims.sub);
    });

    it('should return 404 when task not found', async () => {
      jest.spyOn(storage, 'deleteTask').mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/tasks/nonexistent-task')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Task not found');
    });
  });

  describe('Authentication Guards', () => {
    beforeEach(() => {
      // Mock authentication to fail
      jest.spyOn(require('../server/replitAuth'), 'isAuthenticated').mockImplementation((req: any, res: any, next: any) => {
        return res.status(401).json({ message: 'Unauthorized' });
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401)
        .expect({ message: 'Unauthorized' });

      await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task', projectId: 'test-project' })
        .expect(401)
        .expect({ message: 'Unauthorized' });

      await request(app)
        .put('/api/tasks/test-task-123')
        .send({ title: 'Updated Title' })
        .expect(401)
        .expect({ message: 'Unauthorized' });

      await request(app)
        .delete('/api/tasks/test-task-123')
        .expect(401)
        .expect({ message: 'Unauthorized' });
    });
  });
});