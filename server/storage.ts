import {
  users,
  projects,
  tasks,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type UpdateTask,
  type TaskWithProject,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  deleteProject(id: string, userId: string): Promise<boolean>;
  
  // Task operations
  getTasks(userId: string, projectId?: string, status?: string, priority?: string, deadline?: { from?: string; to?: string }): Promise<TaskWithProject[]>;
  getTask(id: string, userId: string): Promise<TaskWithProject | undefined>;
  createTask(task: InsertTask, userId: string): Promise<Task>;
  updateTask(id: string, task: UpdateTask, userId: string): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    tasksByStatus: { status: string; count: number }[];
  }>;
  
  getOverdueTasks(userId: string): Promise<TaskWithProject[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }
  
  async getProject(id: string, userId: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project;
  }
  
  async createProject(project: InsertProject, userId: string): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, userId })
      .returning();
    return newProject;
  }
  
  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return (result.rowCount || 0) > 0;
  }
  
  // Task operations
  async getTasks(
    userId: string, 
    projectId?: string, 
    status?: string, 
    priority?: string, 
    deadline?: { from?: string; to?: string }
  ): Promise<TaskWithProject[]> {
    let whereConditions = [eq(tasks.userId, userId)];
    
    if (projectId) {
      whereConditions.push(eq(tasks.projectId, projectId));
    }
    
    if (status) {
      whereConditions.push(eq(tasks.status, status));
    }
    
    if (priority) {
      whereConditions.push(eq(tasks.priority, priority));
    }
    
    if (deadline?.from) {
      whereConditions.push(gte(tasks.deadline, deadline.from));
    }
    
    if (deadline?.to) {
      whereConditions.push(lte(tasks.deadline, deadline.to));
    }
    
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        deadline: tasks.deadline,
        projectId: tasks.projectId,
        userId: tasks.userId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: projects,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...whereConditions))
      .orderBy(desc(tasks.createdAt));
  }
  
  async getTask(id: string, userId: string): Promise<TaskWithProject | undefined> {
    const [task] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        deadline: tasks.deadline,
        projectId: tasks.projectId,
        userId: tasks.userId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: projects,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task;
  }
  
  async createTask(task: InsertTask, userId: string): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({ ...task, userId })
      .returning();
    return newTask;
  }
  
  async updateTask(id: string, task: UpdateTask, userId: string): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return updatedTask;
  }
  
  async deleteTask(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return (result.rowCount || 0) > 0;
  }
  
  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    tasksByStatus: { status: string; count: number }[];
  }> {
    // Get total projects
    const [projectCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId));
    
    // Get total tasks
    const [taskCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.userId, userId));
    
    // Get completed tasks
    const [completedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "done")));
    
    // Get overdue tasks
    const today = new Date().toISOString().split('T')[0];
    const [overdueCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        sql`${tasks.deadline} < ${today}`,
        sql`${tasks.status} != 'done'`
      ));
    
    // Get tasks by status
    const tasksByStatus = await db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)`
      })
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .groupBy(tasks.status);
    
    return {
      totalProjects: projectCount.count,
      totalTasks: taskCount.count,
      completedTasks: completedCount.count,
      overdueTasks: overdueCount.count,
      tasksByStatus,
    };
  }
  
  async getOverdueTasks(userId: string): Promise<TaskWithProject[]> {
    const today = new Date().toISOString().split('T')[0];
    
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        deadline: tasks.deadline,
        projectId: tasks.projectId,
        userId: tasks.userId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: projects,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(
        eq(tasks.userId, userId),
        sql`${tasks.deadline} < ${today}`,
        sql`${tasks.status} != 'done'`
      ))
      .orderBy(asc(tasks.deadline));
  }
}

export const storage = new DatabaseStorage();
