import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Trophy,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { userApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface HistoryDetail {
  id: number;
  quiz_title: string;
  category: string;
  subcategory?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  percentage: number;
  time_taken: number;
  date_taken: string;
  passed: boolean;
  answers: Array<{
    question: string;
    options: string[];
    user_answer: Array<string>;
    correct_answer: Array<string>;
    is_correct: boolean;
  }>;
}

export default function HistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchHistoryDetail();
    }
  }, [id]);

  const fetchHistoryDetail = async () => {
    try {
      const response = await userApi.getHistoryDetail(parseInt(id!));
      setDetail(response.data.history);
    } catch (error) {
      console.error("Error fetching history detail:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz history details. Please try again.",
        variant: "destructive",
      });
      navigate("/history");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (percentage: number) => {
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

  if (!detail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">History Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The quiz history you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => navigate("/history")}
            className="gradient-primary"
          >
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(detail.percentage);
  const correctAnswers = detail.answers.filter((a) => a.is_correct).length;
  const incorrectAnswers = detail.answers.length - correctAnswers;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/history")}
          className="mb-6 hover-scale"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>

        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">{detail.quiz_title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{detail.category}</Badge>
            {detail.subcategory && (
              <Badge variant="outline">{detail.subcategory}</Badge>
            )}
            <Badge variant={scoreBadge.variant}>{scoreBadge.text}</Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Taken on {formatDate(detail.date_taken)}
          </p>
        </div>

        <Card className="shadow-elegant mb-8 animate-bounce-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center mx-auto mb-4">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(
                        detail.percentage
                      )}`}
                    >
                      {detail.percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {detail.correct_answers}/{detail.total_questions}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Correct Answers</span>
                  </div>
                  <Badge variant="default" className="gradient-success">
                    {correctAnswers}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span>Incorrect Answers</span>
                  </div>
                  <Badge variant="destructive">{incorrectAnswers}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Time Taken</span>
                  </div>
                  <Badge variant="secondary">
                    {formatTime(detail.time_taken)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span>Accuracy Rate</span>
                  </div>
                  <Badge variant="secondary">
                    {Math.round(
                      (correctAnswers / detail.total_questions) * 100
                    )}
                    %
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant mb-8 animate-fade-in">
          <CardHeader>
            <CardTitle>Question-by-Question Review</CardTitle>
            <CardDescription>
              Review each question with your answers and the correct solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {detail.answers.map((answer, index) => (
              <div key={index}>
                <div
                  className={`p-6 rounded-lg border-2 ${
                    answer.is_correct
                      ? "border-success/20 bg-success/5"
                      : "border-destructive/20 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium flex-1 pr-4 leading-relaxed">
                      <span className="text-primary font-bold">
                        Q{index + 1}.
                      </span>{" "}
                      {answer.question}
                    </h4>
                    {answer.is_correct ? (
                      <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="grid gap-3">
                    {answer.options.map((option, optionIndex) => {
                      const userAnswerText = answer.user_answer[1];
                      const correctAnswerText = answer.correct_answer[1];

                      const isUserAnswer = option === userAnswerText;
                      const isCorrectAnswer = option === correctAnswerText;

                      let styles = "p-3 rounded-lg text-sm transition-colors";

                      if (isCorrectAnswer) {
                        styles +=
                          " bg-success/20 text-success border border-success/30";
                      } else if (isUserAnswer && !answer.is_correct) {
                        styles +=
                          " bg-destructive/20 text-destructive border border-destructive/30";
                      } else {
                        styles += " bg-muted/50 text-muted-foreground";
                      }

                      return (
                        <div key={optionIndex} className={styles}>
                          <div className="flex items-center justify-between">
                            <span className="flex-1">{option}</span>
                            <div className="flex gap-2 text-xs">
                              {isUserAnswer && (
                                <Badge variant="outline" className="text-xs">
                                  Your Answer
                                </Badge>
                              )}
                              {isCorrectAnswer && (
                                <Badge
                                  variant="default"
                                  className="text-xs gradient-success"
                                >
                                  Correct
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {index < detail.answers.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in">
          <Button variant="outline" asChild className="hover-scale">
            <Link to="/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Link>
          </Button>

          <Button variant="outline" asChild className="hover-scale">
            <Link to="/statistics">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Statistics
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
