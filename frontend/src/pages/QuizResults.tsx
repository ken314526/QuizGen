import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  RotateCcw,
  Eye,
  TrendingUp,
} from "lucide-react";
import { quizApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface QuizResult {
  id: number;
  quizId: number;
  quiz_title: string;
  category?: string;
  subcategory?: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  time_taken?: number;
  percentage?: number;
  passed?: boolean;
  answers: Array<{
    question: string;
    selected_option: string;
    correct_option: string;
    is_correct: boolean;
  }>;
}

export default function QuizResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchResults();
    }
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await quizApi.getResults(parseInt(id!));
      setResult(response.data.result);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz results. Please try again.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const secds = (seconds % 60).toFixed(1);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${parseFloat(secds)}s`;
    }
    return `${parseFloat(secds)}s`;
  };

  const getScoreColor = (percentage?: number) => {
    if (percentage === undefined) return "text-muted";
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (percentage?: number) => {
    if (percentage === undefined)
      return { text: "No Score", variant: "default" as const };
    if (percentage >= 90)
      return { text: "Excellent!", variant: "default" as const };
    if (percentage >= 80)
      return { text: "Great!", variant: "secondary" as const };
    if (percentage >= 70)
      return { text: "Good", variant: "secondary" as const };
    if (percentage >= 60) return { text: "Fair", variant: "outline" as const };
    return { text: "Needs Improvement", variant: "destructive" as const };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The quiz results you're looking for don't exist.
          </p>
          <Button onClick={() => navigate("/")} className="gradient-primary">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(result.percentage);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 animate-bounce-in">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-muted-foreground">Here's how you performed</p>
        </div>

        <Card className="shadow-elegant mb-8 animate-fade-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">{result.quiz_title}</CardTitle>
            <CardDescription className="flex flex-wrap justify-center gap-2 mt-2">
              {result.category && (
                <Badge variant="secondary">{result.category}</Badge>
              )}
              {result.subcategory && (
                <Badge variant="outline">{result.subcategory}</Badge>
              )}
              <Badge variant={scoreBadge.variant}>{scoreBadge.text}</Badge>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center mx-auto mb-4">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(
                        result.percentage
                      )}`}
                    >
                      {result.percentage !== undefined
                        ? `${result.percentage}%`
                        : "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.correct_answers}/{result.total_questions}
                    </div>
                  </div>
                </div>
                <Progress
                  value={
                    result.percentage !== undefined ? result.percentage : 0
                  }
                  className="w-40 mx-auto"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                <div className="font-semibold text-success">
                  {result.correct_answers}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <div className="font-semibold text-destructive">
                  {result.total_questions - result.correct_answers}
                </div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="font-semibold text-primary">
                  {formatTime(result.time_taken)}
                </div>
                <div className="text-sm text-muted-foreground">Time Taken</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant mb-8 animate-fade-in">
          <CardHeader>
            <CardTitle>Detailed Results</CardTitle>
            <CardDescription>
              Review your answers and see the correct solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.answers.map((answer, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  answer.is_correct
                    ? "border-success/20 bg-success/5"
                    : "border-destructive/20 bg-destructive/5"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium flex-1 pr-4">
                    {index + 1}. {answer.question}
                  </h4>
                  {answer.is_correct ? (
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                </div>

                <div className="text-sm">
                  Your answer:{" "}
                  <span className="font-semibold">
                    {answer.selected_option}
                  </span>
                </div>
                {!answer.is_correct && (
                  <div className="text-sm">
                    Correct answer:{" "}
                    <span className="font-semibold">
                      {answer.correct_option}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in">
          <Button variant="outline" asChild className="hover-scale">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <Button variant="outline" asChild className="hover-scale">
            <Link to="/history">
              <Eye className="mr-2 h-4 w-4" />
              View History
            </Link>
          </Button>

          <Button variant="outline" asChild className="hover-scale">
            <Link to="/statistics">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Statistics
            </Link>
          </Button>

          <Button asChild className="gradient-primary hover-scale">
            <Link to={`/quiz/${result.quizId}`}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
