import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Eye,
  Calendar,
  Trophy,
  Clock,
  Filter,
} from "lucide-react";
import { userApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: number;
  quiz_title: string;
  category: string;
  subcategory?: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  time_taken: number;
  date_taken: string;
  passed: boolean;
}

type SortField =
  | "quiz_title"
  | "category"
  | "subcategory"
  | "score"
  | "percentage"
  | "date_taken"
  | "time_taken";
type SortOrder = "asc" | "desc";

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date_taken");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterAndSortHistory();
  }, [history, searchTerm, sortField, sortOrder]);

  const fetchHistory = async () => {
    try {
      const response = await userApi.getHistory();

      const fixedHistory = (response.data.history || []).map((item: any) => ({
        ...item,
        time_taken: Number(item.time_taken) || 0,
        date_taken: item.date_taken || "",
      }));
      setHistory(fixedHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortHistory = () => {
    const filtered = history.filter(
      (item) =>
        item.quiz_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.subcategory &&
          item.subcategory.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "date_taken") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredHistory(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-full"></div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Quiz History
          </h1>
          <p className="text-muted-foreground">
            Track your progress and review past quiz performances
          </p>
        </div>

        {history.length === 0 ? (
          <Card className="shadow-elegant animate-bounce-in">
            <CardContent className="text-center py-16">
              <Trophy className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Quiz History</h3>
              <p className="text-muted-foreground mb-6">
                You haven't taken any quizzes yet. Start your learning journey!
              </p>
              <Button asChild className="gradient-primary">
                <Link to="/">Browse Quizzes</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-elegant animate-fade-in">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Your Quiz History</CardTitle>
                  <CardDescription>
                    {filteredHistory.length} of {history.length} quiz
                    {history.length !== 1 ? "es" : ""}
                  </CardDescription>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search quizzes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("quiz_title")}
                      >
                        <div className="flex items-center">
                          Quiz Title
                          {getSortIcon("quiz_title")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("category")}
                      >
                        <div className="flex items-center">
                          Category
                          {getSortIcon("category")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort("subcategory")}
                      >
                        <div className="flex items-center">
                          Subcategory
                          {getSortIcon("subcategory")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort("score")}
                      >
                        <div className="flex items-center justify-end">
                          Score
                          {getSortIcon("score")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort("percentage")}
                      >
                        <div className="flex items-center justify-end">
                          Percentage
                          {getSortIcon("percentage")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort("time_taken")}
                      >
                        <div className="flex items-center justify-end">
                          Time
                          {getSortIcon("time_taken")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort("date_taken")}
                      >
                        <div className="flex items-center justify-end">
                          Date
                          {getSortIcon("date_taken")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.quiz_title}</div>
                            {item.subcategory && (
                              <div className="text-sm text-muted-foreground">
                                {item.subcategory}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.subcategory ? (
                            <Badge variant="secondary">
                              {item.subcategory}
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.correct_answers}/{item.total_questions}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-muted/30">
                            <span
                              className={getScoreColor(item.percentage)}
                              style={{ fontWeight: "bold" }}
                            >
                              {item.percentage}%
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(item.time_taken)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(item.date_taken)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hover-scale"
                          >
                            <Link to={`/history/${item.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
