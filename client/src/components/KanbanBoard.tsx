import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { type TaskWithProject } from '@shared/schema';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  tasks: TaskWithProject[];
}

const statusConfig = {
  todo: {
    title: 'Todo',
    color: 'bg-gray-400',
  },
  'in-progress': {
    title: 'In Progress',
    color: 'bg-blue-500',
  },
  done: {
    title: 'Done',
    color: 'bg-green-500',
  },
};

export default function KanbanBoard({ tasks }: KanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<TaskWithProject | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<string>('todo');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
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
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    },
  });

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(task => task.id === activeId);
    if (!activeTask) return;

    // If dropped on a column (status), update the task status
    if (Object.keys(statusConfig).includes(overId)) {
      const newStatus = overId;
      if (activeTask.status !== newStatus) {
        updateTaskMutation.mutate({ taskId: activeId, status: newStatus });
      }
    }

    setActiveTask(null);
  };

  const handleTaskClick = (task: TaskWithProject) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleCreateTask = (status: string) => {
    setSelectedTask(null);
    setDefaultStatus(status);
    setTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setTaskModalOpen(false);
    setSelectedTask(null);
    setDefaultStatus('todo');
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const columnTasks = getTasksByStatus(status);
            
            return (
              <div
                key={status}
                id={status}
                className="bg-card rounded-lg p-4 border border-border min-h-[500px]"
                data-testid={`column-${status}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center">
                    <div className={cn("w-3 h-3 rounded-full mr-2", config.color)} />
                    {config.title}
                    <span className="ml-2 px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full" data-testid={`count-${status}`}>
                      {columnTasks.length}
                    </span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreateTask(status)}
                    data-testid={`button-add-task-${status}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <SortableContext
                  items={columnTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {createPortal(
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onClick={() => {}}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <TaskModal
        open={taskModalOpen}
        onClose={handleCloseModal}
        task={selectedTask || undefined}
        defaultStatus={defaultStatus}
      />
    </>
  );
}
