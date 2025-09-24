import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  valueColor = "text-foreground"
}: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-label`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${valueColor}`} data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
            {value}
          </p>
        </div>
        <div className={`p-3 ${iconBgColor} rounded-full`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
