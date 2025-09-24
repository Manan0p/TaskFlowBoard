import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, Trello, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/projects", icon: FolderKanban, label: "Projects" },
    { path: "/kanban", icon: Trello, label: "Kanban Board" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Trello className="text-primary text-xl" />
            <span className="text-xl font-bold text-foreground">TaskFlow</span>
          </div>
          <button className="lg:hidden" onClick={onClose} data-testid="button-close-sidebar">
            ✕
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={onClose}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          
          <div className="mt-8">
            <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Account
            </h3>
            <div className="mt-2 space-y-1">
              <Link
                href="/profile"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={onClose}
                data-testid="nav-profile"
              >
                <User className="mr-3 h-4 w-4" />
                Profile
              </Link>
              <a
                href="/api/logout"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                data-testid="nav-logout"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </a>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
