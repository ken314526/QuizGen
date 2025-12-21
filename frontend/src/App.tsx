import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/Navbar";
import { Chatbot } from "@/components/Chatbot";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import CreateQuiz from "./pages/CreateQuiz";
import AttemptQuiz from "./pages/AttemptQuiz";
import QuizResults from "./pages/QuizResults";
import History from "./pages/History";
import HistoryDetail from "./pages/HistoryDetail";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/"
                    element={<ProtectedRoute><Home /></ProtectedRoute>}
                  />
                  <Route
                    path="/profile"
                    element={<ProtectedRoute><Profile /></ProtectedRoute>}
                  />
                  <Route
                    path="/create-quiz"
                    element={<ProtectedRoute><CreateQuiz /></ProtectedRoute>}
                  />
                  <Route
                    path="/quiz/:id"
                    element={<ProtectedRoute><AttemptQuiz /></ProtectedRoute>}
                  />
                  <Route
                    path="/results/:id"
                    element={<ProtectedRoute><QuizResults /></ProtectedRoute>}
                  />
                  <Route
                    path="/history"
                    element={<ProtectedRoute><History /></ProtectedRoute>}
                  />
                  <Route
                    path="/history/:id"
                    element={<ProtectedRoute><HistoryDetail /></ProtectedRoute>}
                  />
                  <Route
                    path="/statistics"
                    element={<ProtectedRoute><Statistics /></ProtectedRoute>}
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Chatbot />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
