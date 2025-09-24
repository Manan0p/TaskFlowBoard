import { Bell, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth() as { user: User | undefined };

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button 
          className="lg:hidden mr-4" 
          onClick={onMenuClick}
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
          {title}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-accent" data-testid="button-notifications">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-center space-x-2">
          {user?.profileImageUrl && (
            <img
              src={user.profileImageUrl}
              alt="User avatar"
              className="w-8 h-8 rounded-full object-cover"
              data-testid="img-user-avatar"
            />
          )}
          <span className="text-sm font-medium text-foreground" data-testid="text-user-name">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email || "User"
            }
          </span>
        </div>
      </div>
    </header>
  );
}
