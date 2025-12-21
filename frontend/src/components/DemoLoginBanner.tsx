import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, User, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DemoLoginBanner() {
  const user = localStorage.getItem('user');
  
  if (user) return null;

  return (
    <Card className="mb-8 border-2 border-primary/20 bg-primary/5 shadow-elegant animate-bounce-in">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Try QuizZen Demo</h3>
            <p className="text-muted-foreground mb-4">
              Experience the full functionality with our demo account. All features are working with realistic dummy data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-card p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Email:</span>
                </div>
                <code className="text-sm bg-muted px-2 py-1 rounded">demo@quizzen.com</code>
              </div>
              <div className="bg-card p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Password:</span>
                </div>
                <code className="text-sm bg-muted px-2 py-1 rounded">demo123</code>
              </div>
              <Button asChild className="gradient-primary hover-scale sm:self-center">
                <Link to="/login">
                  Try Demo Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}