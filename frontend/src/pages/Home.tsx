import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Play, PlusCircle, Users } from 'lucide-react';
import { quizApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { DemoLoginBanner } from '@/components/DemoLoginBanner';

interface Quiz {
  id: number;
  title: string;
  category: string;
  subcategory: string;
  num_questions: number;
  time_duration: number;
  description?: string;
  difficulty?: string;
}

export default function Home() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await quizApi.getQuizzes();
      setQuizzes(response.data.quizzes || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 px-4 text-center gradient-card">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Welcome to{' '}
            <span className="gradient-primary bg-clip-text text-transparent">
              QuizZen
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in">
            Challenge yourself with engaging quizzes and track your progress
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-in">
            <Button size="lg" asChild className="gradient-primary shadow-elegant">
              <Link to="/create-quiz">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Quiz
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="hover-scale">
              <Link to="/history">
                <Clock className="mr-2 h-5 w-5" />
                View History
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Available Quizzes</h2>
            <p className="text-muted-foreground">
              Discover and take engaging quizzes on various topics
            </p>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No quizzes available</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create a quiz and get started!
              </p>
              <Button asChild className="gradient-primary">
                <Link to="/create-quiz">Create Your First Quiz</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz, index) => (
                <Card 
                  key={quiz.id} 
                  className="quiz-card animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 line-clamp-2">
                          {quiz.title}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {quiz.category}
                          </Badge>
                          {quiz.subcategory && (
                            <Badge variant="outline" className="text-xs">
                              {quiz.subcategory}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{quiz.num_questions} questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(quiz.time_duration)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      asChild 
                      className="w-full gradient-primary hover-scale"
                    >
                      <Link to={`/quiz/${quiz.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Start Quiz
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}