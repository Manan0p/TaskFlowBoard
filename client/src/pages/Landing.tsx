import { Trello } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <Trello className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-app-title">
                TaskFlow
              </h1>
              <p className="text-muted-foreground" data-testid="text-app-description">
                Streamline your projects with our powerful task management system
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get started by signing in to manage your projects and tasks
              </p>
              
              <Button 
                asChild 
                className="w-full"
                data-testid="button-sign-in"
              >
                <a href="/api/login">
                  Sign In to Continue
                </a>
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Organize • Prioritize • Deliver
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
