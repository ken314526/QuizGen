import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, Clock, X } from "lucide-react";
import { quizApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TomSelect from "tom-select";
import "tom-select/dist/css/tom-select.default.css";
import { Input } from "@/components/ui/input";

interface Category {
  name: string;
  subcategories: string[];
}

export default function CreateQuiz() {
  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    numQuestions: "",
    timeDuration: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<string[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const subcategorySelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await quizApi.getCategories();
      setCategories(response.data.categories || []);
    } catch {
      const fallbackCategories: Category[] = [
        {
          name: "Technology",
          subcategories: [
            "Programming",
            "AI & ML",
            "Web Development",
            "Mobile Development",
          ],
        },
        {
          name: "Science",
          subcategories: ["Physics", "Chemistry", "Biology", "Mathematics"],
        },
        {
          name: "History",
          subcategories: [
            "World War II",
            "Ancient Civilizations",
            "Modern History",
          ],
        },
        {
          name: "Geography",
          subcategories: [
            "World Capitals",
            "Physical Geography",
            "Countries & Flags",
          ],
        },
        {
          name: "Literature",
          subcategories: ["Classic Literature", "Modern Fiction", "Poetry"],
        },
      ];
      setCategories(fallbackCategories);
    }
  };

  useEffect(() => {
    setFilteredCategories(categories.map((cat) => cat.name));
  }, [categories]);

  useEffect(() => {
    if (formData.category) {
      const category = categories.find((cat) => cat.name === formData.category);
      setFilteredSubcategories(category?.subcategories || []);
    } else {
      setFilteredSubcategories([]);
    }
  }, [formData.category, categories]);

  useEffect(() => {
    if (!categorySelectRef.current) return;

    const ts = new TomSelect(categorySelectRef.current, {
      options: filteredCategories.map((cat) => ({ value: cat, text: cat })),
      create: true,
      onChange: (value: string) => {
        setFormData((prev) => ({ ...prev, category: value, subcategory: "" }));
      },
      persist: false,
      dropdownParent: "body",
    });

    ts.setValue(formData.category);

    return () => ts.destroy();
  }, [formData.category, filteredCategories]);

  useEffect(() => {
    if (!subcategorySelectRef.current) return;

    const ts = new TomSelect(subcategorySelectRef.current, {
      options: filteredSubcategories.map((sub) => ({ value: sub, text: sub })),
      create: true,
      onChange: (value: string) => {
        setFormData((prev) => ({ ...prev, subcategory: value }));
      },
      persist: false,
      dropdownParent: "body",
    });

    ts.setValue(formData.subcategory);

    return () => ts.destroy();
  }, [filteredSubcategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.category ||
      !formData.numQuestions ||
      !formData.timeDuration
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const numQuestions = parseInt(formData.numQuestions);
    const timeDuration = parseInt(formData.timeDuration);

    if (numQuestions < 1 || numQuestions > 100) {
      toast({
        title: "Invalid number of questions",
        description: "Number of questions must be between 1 and 100.",
        variant: "destructive",
      });
      return;
    }

    if (timeDuration < 1 || timeDuration > 300) {
      toast({
        title: "Invalid time duration",
        description: "Time duration must be between 1 and 300 minutes.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await quizApi.createQuiz({
        category: formData.category,
        subcategory: formData.subcategory || null,
        questionCount: numQuestions,
        duration: timeDuration,
      });

      toast({
        title: "Quiz created successfully!",
        description: "Your quiz has been created and is ready to use.",
      });

      navigate(`/quiz/${response.data.quiz_id}`);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Failed to create quiz",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Create New Quiz</h1>
          <p className="text-muted-foreground">
            Set up your quiz parameters and let AI generate engaging questions
          </p>
        </div>

        <Card className="shadow-elegant animate-bounce-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Quiz Configuration
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  ref={categorySelectRef}
                  disabled={isLoading}
                  className="tom-select"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                <select
                  id="subcategory"
                  ref={subcategorySelectRef}
                  disabled={isLoading || !formData.category}
                  className="tom-select"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="numQuestions"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.numQuestions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        numQuestions: e.target.value,
                      }))
                    }
                    placeholder="Enter number of questions (1-100)"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeDuration">Time Duration (minutes) *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="timeDuration"
                    type="number"
                    min="1"
                    max="300"
                    value={formData.timeDuration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        timeDuration: e.target.value,
                      }))
                    }
                    placeholder="Enter time duration (1-300 minutes)"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {(formData.category || formData.subcategory) && (
                <div className="space-y-2">
                  <Label>Selected Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.category && (
                      <Badge variant="default" className="gradient-primary">
                        {formData.category}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0 hover:bg-transparent"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              category: "",
                              subcategory: "",
                            }))
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {formData.subcategory && (
                      <Badge variant="secondary">
                        {formData.subcategory}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0 hover:bg-transparent"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              subcategory: "",
                            }))
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary hover-scale"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating Quiz...
                  </div>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Quiz
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
