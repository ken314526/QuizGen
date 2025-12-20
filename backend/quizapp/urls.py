from django.urls import path
from . import views


urlpatterns = [
  path('api/quizzes/', views.QuizListView.as_view()),
  path('api/quizzes/<int:quiz_id>/', views.QuizDetailView.as_view()),
  path('api/quizzes/create/', views.CreateQuizView.as_view()),
  path('api/quizzes/<int:history_id>/results/', views.QuizResultView.as_view()),
  path('api/history/', views.HistoryListView.as_view()),
  path('api/history/<int:history_id>/', views.HistoryDetailView.as_view()),
  path('api/profile/', views.ProfileView.as_view()),
  path('api/statistics/', views.StatisticsView.as_view()),
  path('api/categories/', views.CategoryListView.as_view()),
  path('api/chatbot/', views.ChatbotAPIView.as_view()),
  path('api/login/', views.login_view),
  path('api/signup/', views.signup_view),
  path('api/logout/', views.logout_view),
  path('api/delete-account/', views.delete_account_view),
]