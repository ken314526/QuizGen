import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { quizApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer?: string;
  difficulty?: string;
}

interface Quiz {
  id: number;
  title: string;
  category: string;
  subcategory?: string;
  time_duration: number;
  questions: Question[];
}

const optionLetters = ["A", "B", "C", "D", "E", "F"];

export default function AttemptQuiz() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuiz();
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [timeLeft, quizStarted]);

  const fetchQuiz = async () => {
    try {
      const response = await quizApi.getQuiz(parseInt(id!));
      const { quiz, questions } = response.data;

      const formattedQuestions = questions.map((q: any) => ({
        id: q.id,
        question: q.text,
        options: q.options,
        correct_answer: q.correct,
        difficulty: q.difficulty,
      }));

      setQuiz({
        ...quiz,
        questions: formattedQuestions,
        time_duration: quiz.time_duration || quiz.duration || 10,
      });

      setTimeLeft((quiz.time_duration || quiz.duration || 10) * 60);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    setStartedAt(new Date());
    setQuizStarted(true);
  };

  const handleAnswerChange = (value: string) => {
    if (!quiz) return;
    const qid = quiz.questions[currentQuestion].id;
    setAnswers((prev) => ({
      ...prev,
      [qid]: value,
    }));
  };

  const goToNext = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    setIsSubmitting(true);
    try {
      const correctAnswers = Object.entries(answers).reduce(
        (count, [qidStr, selectedOption]) => {
          const qid = Number(qidStr);
          const question = quiz.questions.find((q) => q.id === qid);
          if (!question) return count;

          if (
            selectedOption.toString() === question.correct_answer.toString()
          ) {
            return count + 1;
          }
          return count;
        },
        0
      );

      const payload = {
        quizId: quiz.id,
        category: quiz.category,
        subcategory: quiz.subcategory || "",
        totalQuestions: quiz.questions.length,
        answeredQuestions: Object.keys(answers).length,
        correctAnswers,
        incorrectAnswers: Object.keys(answers).length - correctAnswers,
        unansweredQuestions:
          quiz.questions.length - Object.keys(answers).length,
        score: Math.round((correctAnswers / quiz.questions.length) * 100),
        timeTaken: quiz.time_duration * 60 - timeLeft,
        duration: quiz.time_duration * 60,
        userAnswers: answers,
        startedAt: startedAt
          ? startedAt.toISOString()
          : new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const response = await quizApi.submitQuiz(quiz.id, payload);

      toast({
        title: "Quiz submitted!",
        description: "Your answers have been submitted successfully.",
      });

      navigate(`/results/${response.data.result_id || quiz.id}`);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Submission failed",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Quiz Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The quiz you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")} className="gradient-primary">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-elegant animate-bounce-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">{quiz.title}</CardTitle>
            <CardDescription className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="secondary">{quiz.category}</Badge>
              {quiz.subcategory && (
                <Badge variant="outline">{quiz.subcategory}</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Questions</p>
                  <p className="text-sm text-muted-foreground">
                    {quiz.questions.length} questions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Time Limit</p>
                  <p className="text-sm text-muted-foreground">
                    {quiz.time_duration} minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Once you start the quiz, the timer will begin. Make sure you're
                ready!
              </p>
              <Button
                onClick={startQuiz}
                className="gradient-primary hover-scale"
                size="lg"
              >
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const question = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-40 bg-card/95 backdrop-blur border-b shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">{quiz.title}</h1>
              <Badge variant="secondary">{quiz.category}</Badge>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg shadow-card">
              <Clock
                className={`h-4 w-4 ${
                  timeLeft < 300 ? "text-destructive" : "text-primary"
                }`}
              />
              <span
                className={`font-mono font-bold ${
                  timeLeft < 300 ? "text-destructive" : "text-primary"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestion + 1} of {quiz.questions.length}
              </span>
              <span>{getAnsweredCount()} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-elegant animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">
              {question.question}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={handleAnswerChange}
              className="space-y-3"
            >
              {question.options.map((option, idx) => {
                const letter = optionLetters[idx];
                return (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent hover:border-accent-foreground/20 transition-colors"
                  >
                    <RadioGroupItem
                      value={idx.toString()}
                      id={`option-${idx}`}
                    />
                    <Label
                      htmlFor={`option-${idx}`}
                      className="flex-1 cursor-pointer text-sm leading-relaxed"
                    >
                      {letter}. {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentQuestion === 0}
            className="hover-scale"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <div className="flex gap-3">
            {currentQuestion === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="gradient-success hover-scale"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Quiz
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goToNext}
                className="gradient-primary hover-scale"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
