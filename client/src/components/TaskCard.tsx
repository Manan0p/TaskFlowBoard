import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Folder } from 'lucide-react';
import { TaskWithProject } from '@shared/schema';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithProject;
  onClick: () => void;
}

const priorityStyles = {
  high: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20',
  medium: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  low: 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20',
};

const priorityBadgeStyles = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-background p-4 rounded-lg border border-border cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:-translate-y-1",
        priorityStyles[task.priority as keyof typeof priorityStyles],
        isDragging && "opacity-50 shadow-lg transform rotate-2",
        task.status === 'done' && "opacity-75"
      )}
      onClick={onClick}
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-foreground line-clamp-2" data-testid={`text-task-title-${task.id}`}>
          {task.title}
        </h4>
        <span
          className={cn(
            "px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2",
            priorityBadgeStyles[task.priority as keyof typeof priorityBadgeStyles]
          )}
          data-testid={`badge-priority-${task.id}`}
        >
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>
      
      {task.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-task-description-${task.id}`}>
          {task.description}
        </p>
      )}
      
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        {task.deadline ? (
          <span className={cn("flex items-center", isOverdue && "text-destructive")} data-testid={`text-task-deadline-${task.id}`}>
            <Calendar className="mr-1 h-3 w-3" />
            {isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(task.deadline)}
          </span>
        ) : (
          <span></span>
        )}
        <span className="flex items-center" data-testid={`text-task-project-${task.id}`}>
          <Folder className="mr-1 h-3 w-3" />
          {task.project.name}
        </span>
      </div>
    </div>
  );
}
