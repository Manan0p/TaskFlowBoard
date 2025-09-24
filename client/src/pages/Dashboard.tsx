import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Folder, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { type TaskWithProject } from '@shared/schema';

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: { status: string; count: number }[];
}

const COLORS = ['#9CA3AF', '#3B82F6', '#10B981'];

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    retry: false,
  });

  const { data: overdueTasks = [], isLoading: overdueLoading } = useQuery<TaskWithProject[]>({
    queryKey: ['/api/dashboard/overdue-tasks'],
    retry: false,
  });

  // Handle unauthorized errors at page level
  useEffect(() => {
    const handleError = (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 500);
      }
    };

    // Note: Error handling would be better implemented in a query error boundary
    // but for simplicity, we'll handle it per component
  }, [toast]);

  if (statsLoading || overdueLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-6 border border-border animate-pulse">
              <div className="h-16"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-6 border border-border animate-pulse">
              <div className="h-64"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chartData = stats?.tasksByStatus.map(item => ({
    name: item.status === 'todo' ? 'Todo' : item.status === 'in-progress' ? 'In Progress' : 'Done',
    value: item.count,
    status: item.status,
  })) || [];

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysOverdue = (deadline: string | null) => {
    if (!deadline) return 0;
    const today = new Date();
    const dueDate = new Date(deadline);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-welcome-message">
          Welcome back!
        </h2>
        <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          icon={Folder}
        />
        
        <StatsCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          icon={Clock}
          iconBgColor="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        
        <StatsCard
          title="Completed"
          value={stats?.completedTasks || 0}
          icon={CheckCircle}
          iconBgColor="bg-green-100 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        
        <StatsCard
          title="Overdue"
          value={stats?.overdueTasks || 0}
          icon={AlertTriangle}
          iconBgColor="bg-red-100 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
          valueColor="text-destructive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-chart-title">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No tasks yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-overdue-title">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {overdueTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm" data-testid="text-no-overdue">
                  No overdue tasks! 🎉
                </p>
              ) : (
                overdueTasks.map((task) => {
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

                  const daysOverdue = getDaysOverdue(task.deadline);

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg ${priorityStyles[task.priority as keyof typeof priorityStyles]}`}
                      data-testid={`overdue-task-${task.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground text-sm" data-testid={`text-overdue-task-title-${task.id}`}>
                          {task.title}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${priorityBadgeStyles[task.priority as keyof typeof priorityBadgeStyles]}`}
                          data-testid={`badge-overdue-priority-${task.id}`}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground" data-testid={`text-overdue-days-${task.id}`}>
                        {daysOverdue === 1 ? '1 day' : `${daysOverdue} days`} overdue
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
