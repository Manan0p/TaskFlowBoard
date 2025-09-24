import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import KanbanBoard from '@/components/KanbanBoard';
import TaskModal from '@/components/TaskModal';
import { type TaskWithProject, type Project } from '@shared/schema';

export default function KanbanPage() {
  const { toast } = useToast();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    retry: false,
  });

  const { data: tasksResponse, isLoading } = useQuery<{ tasks: TaskWithProject[] }>({
    queryKey: ['/api/tasks', selectedProject === 'all' ? undefined : selectedProject],
    queryFn: async () => {
      const url = selectedProject === 'all' 
        ? '/api/tasks' 
        : `/api/tasks?projectId=${selectedProject}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (response.status === 401) {
        throw new Error('401: Unauthorized');
      }
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    retry: false,
  });

  // Handle unauthorized errors at page level
  useEffect(() => {
    // Error handling would be better with React Query error boundaries
  }, []);

  const tasks = tasksResponse?.tasks || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Kanban Board</h2>
          <div className="flex space-x-2">
            <div className="w-40 h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-24 h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 border border-border min-h-[500px] animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-kanban-title">
            Kanban Board
          </h2>
          <div className="flex space-x-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48" data-testid="select-project-filter">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setTaskModalOpen(true)} data-testid="button-add-task">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-projects-kanban">
              No projects found
            </h3>
            <p className="text-muted-foreground text-sm" data-testid="text-create-project-first">
              Create a project first to start managing tasks.
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-tasks-kanban">
              No tasks found
            </h3>
            <p className="text-muted-foreground text-sm mb-4" data-testid="text-create-task-first">
              {selectedProject === 'all' 
                ? "Create your first task to get started."
                : "No tasks found for the selected project."
              }
            </p>
            <Button onClick={() => setTaskModalOpen(true)} data-testid="button-create-first-task">
              <Plus className="mr-2 h-4 w-4" />
              Create First Task
            </Button>
          </div>
        ) : (
          <KanbanBoard tasks={tasks} />
        )}
      </div>

      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
    </>
  );
}
