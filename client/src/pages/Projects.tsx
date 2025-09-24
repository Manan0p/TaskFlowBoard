import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Plus, MoreVertical, Folder, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProjectModal from '@/components/ProjectModal';
import { apiRequest } from '@/lib/queryClient';
import { type Project, type Task } from '@shared/schema';

export default function Projects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    retry: false,
  });

  const { data: allTasks = [] } = useQuery<{ tasks: Task[] }>({
    queryKey: ['/api/tasks'],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest('DELETE', `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: 'Success',
        description: 'Project deleted successfully.',
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle unauthorized errors at page level
  useEffect(() => {
    // This would be better handled with React Query error boundaries
    // but for simplicity, we'll handle it here
  }, []);

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This will also delete all associated tasks.`)) {
      deleteMutation.mutate(projectId);
    }
  };

  const getProjectStats = (projectId: string) => {
    const tasksData = Array.isArray(allTasks) ? [] : allTasks?.tasks || [];
    const tasks = tasksData.filter((task: any) => task.projectId === projectId) || [];
    const completedTasks = tasks.filter((task: any) => task.status === 'done').length;
    return {
      totalTasks: tasks.length,
      completedTasks,
    };
  };

  const formatDate = (date: string | null | Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-projects-title">
            Projects
          </h2>
          <Button onClick={() => setProjectModalOpen(true)} data-testid="button-create-project">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-projects-title">
                    No projects yet
                  </h3>
                  <p className="text-muted-foreground text-sm" data-testid="text-no-projects-description">
                    Get started by creating your first project to organize your tasks.
                  </p>
                </div>
                <Button onClick={() => setProjectModalOpen(true)} data-testid="button-create-first-project">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const stats = getProjectStats(project.id);
              
              return (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg line-clamp-2" data-testid={`text-project-name-${project.id}`}>
                      {project.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-project-menu-${project.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          data-testid={`button-delete-project-${project.id}`}
                        >
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3" data-testid={`text-project-description-${project.id}`}>
                        {project.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center" data-testid={`text-project-total-tasks-${project.id}`}>
                          <Folder className="mr-1 h-3 w-3" />
                          {stats.totalTasks} tasks
                        </span>
                        <span className="flex items-center" data-testid={`text-project-completed-tasks-${project.id}`}>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {stats.completedTasks} done
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground" data-testid={`text-project-created-date-${project.id}`}>
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />
    </>
  );
}
