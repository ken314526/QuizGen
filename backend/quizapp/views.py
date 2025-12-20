from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.utils.timezone import make_aware, is_naive,  now
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from datetime import datetime, date
from calendar import monthrange
from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate
import json
from .models import User, Quiz, Question, QuizHistory, UserAnswer, Category, SubCategory
from .utils import generate_quiz, create_quiz as save_quiz

from django.db.models import Avg, Count
from datetime import timedelta

User = get_user_model()


def to_quiz_data(quiz):
    return {
        "id": quiz.id,
        "title": quiz.title,
        "category": quiz.category.name,
        "subcategory": quiz.subcategory.name if getattr(quiz, "subcategory", None) else "",
        "num_questions": quiz.questions.count(),
        "time_duration": quiz.time_duration,
    }


class QuizListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        quizzes = Quiz.objects.select_related('category', 'subcategory').all()
        data = [to_quiz_data(q) for q in quizzes]
        return Response({"quizzes": data})


class QuizDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id)
        questions = []
        answer_map = {"A": 0, "B": 1, "C": 2, "D": 3}
        for q in quiz.questions.all():
            correct_index = answer_map.get(q.correct_answer)
            questions.append({
                "id": q.id,
                "text": q.text,
                "options": [q.option_a, q.option_b, q.option_c, q.option_d],
                "correct": correct_index,
                "difficulty": q.difficulty,
            })
        return Response({"quiz": to_quiz_data(quiz), "questions": questions})


class CreateQuizView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        category = data.get('category')
        subcategory = data.get('subcategory')
        question_count = int(data.get('questionCount'))
        duration = data.get('duration')

        quiz_questions = generate_quiz(
            category=category, subcategory=subcategory, num_questions=question_count)

        quiz = save_quiz(category_name=category, category_description="API Created",
                         subcategory_name=subcategory, time_duration=duration, response_text=quiz_questions)

        return Response({"message": "Quiz created successfully", "quiz_id": quiz.id})

    def get(self, request):
        categories = Category.objects.all()
        category_list = [cat.name for cat in categories]
        subcategories = {}
        for cat in categories:
            subcat_qs = getattr(cat, 'subcategories', None)
            subcategories[cat.name.lower()] = [
                {'value': sub.name.lower(), 'text': sub.name}
                for sub in (subcat_qs.all() if subcat_qs else [])
            ]
        return Response({"categories": category_list, "subcategories": subcategories})


class QuizResultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, history_id):
        quiz_id = history_id
        quiz = get_object_or_404(Quiz, id=quiz_id)
        data = request.data
        completed_at = datetime.fromisoformat(
            data.get("completedAt", datetime.now().isoformat()))
        started_at = datetime.fromisoformat(
            data.get("startedAt", datetime.now().isoformat()))

        if is_naive(started_at):
            started_at = make_aware(started_at)
        if is_naive(completed_at):
            completed_at = make_aware(completed_at)

        history = QuizHistory.objects.create(
            user=request.user,
            quiz=quiz,
            score=data.get("score", 0),
            total_questions=data.get("totalQuestions", 0),
            correct_answers=data.get("correctAnswers", 0),
            completed_at=completed_at,
            started_at=started_at
        )

        user_answers = data.get("userAnswers", {})
        OPTIONS_MAP = {"0": "A", "1": "B", "2": "C", "3": "D"}

        for q_id, selected in user_answers.items():
            question = Question.objects.get(id=q_id)
            UserAnswer.objects.create(
                history=history,
                question=question,
                selected_option=OPTIONS_MAP.get(selected, ""),
                is_correct=(OPTIONS_MAP.get(selected, "")
                            == question.correct_answer)
            )

        return Response({"message": "Quiz submitted successfully", "result_id": history.id})

    def get(self, request, history_id):
        history = QuizHistory.objects.get(id=history_id)
        quiz = get_object_or_404(Quiz, id=history.quiz_id)
        if not history:
            return Response({"error": "No history"}, status=status.HTTP_404_NOT_FOUND)

        category_name = quiz.category.name if quiz.category else ''
        subcategory_name = quiz.subcategory.name if quiz.subcategory else ''

        answers = [
            {
                "question": ua.question.text,
                "selected_option": getattr(ua.question, f"option_{ua.selected_option.lower()}", ""),
                "correct_option": getattr(ua.question, f"option_{ua.question.correct_answer.lower()}", ""),
                "is_correct": ua.is_correct
            }
            for ua in UserAnswer.objects.filter(history=history)
        ]

        percentage = history.score
        passed = percentage >= 50

        time_taken = abs(history.completed_at - history.started_at).total_seconds(
        ) if history.completed_at and history.started_at else 0

        result = {
            "id": history.id,
            "quizId": quiz.id,
            "quiz_title": quiz.title,
            "category": category_name,
            "subcategory": subcategory_name,
            "correct_answers": history.correct_answers,
            "score": history.score,
            "total_questions": history.total_questions,
            "answers": answers,
            "completed_at": history.completed_at.isoformat(),
            "percentage": percentage,
            "passed": passed,
            "time_taken": time_taken
        }
        return Response({"result": result})


class HistoryListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        histories = QuizHistory.objects.filter(
            user=request.user).select_related('quiz')
        data = [
            {
                "id": h.id,
                "quiz_title": h.quiz.title,
                "percentage": h.score,
                "total_questions": h.total_questions,
                "correct_answers": h.correct_answers,
                "category": h.quiz.category.name,
                "subcategory": h.quiz.subcategory.name if getattr(h.quiz, "subcategory", None) else "",
                "time_taken": abs(h.completed_at - h.started_at).total_seconds() if h.completed_at and h.created_at else 0,
                "date_taken": h.completed_at.isoformat() if h.completed_at else "",
            } for h in histories
        ]
        return Response({"history": data})


class HistoryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, history_id):
        history = get_object_or_404(
            QuizHistory, id=history_id, user=request.user)
        user_answers = UserAnswer.objects.filter(
            history=history).select_related('question')

        answers = []
        for ua in user_answers:
            answers.append({
                "question": ua.question.text,
                "options": [ua.question.option_a, ua.question.option_b, ua.question.option_c, ua.question.option_d] if all(hasattr(ua.question, opt) for opt in ['option_a', 'option_b', 'option_c', 'option_d']) else [],
                "user_answer": [ua.selected_option, getattr(ua.question, f"option_{ua.selected_option.lower()}", "")] if ua.selected_option and hasattr(ua.question, f"option_{ua.selected_option.lower()}") else [ua.selected_option, ""],
                "correct_answer": [ua.question.correct_answer if hasattr(ua.question, 'correct_answer') else None, getattr(ua.question, f"option_{ua.question.correct_answer.lower()}", "") if hasattr(ua.question, f"option_{ua.question.correct_answer.lower()}") else ""] if hasattr(ua.question, 'correct_answer') else [None, ""],
                "is_correct": ua.is_correct,
            })

        result = {
            "id": history.id,
            "quiz_title": history.quiz.title,
            "category": history.quiz.category.name if history.quiz.category else "",
            "subcategory": history.quiz.subcategory.name if getattr(history.quiz, "subcategory", None) else "",
            "percentage": history.score,
            "correct_answers": history.correct_answers,
            "total_questions": history.total_questions,
            "time_taken": (history.completed_at - history.started_at).total_seconds() if history.completed_at and history.started_at else 0,
            "date_taken": history.completed_at.isoformat() if history.completed_at else "",

            "passed": history.score >= (0.5 * history.total_questions),
            "answers": answers,
        }

        return Response({"history": result})


class StatisticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        histories = (QuizHistory.objects
                     .filter(user=user, completed_at__isnull=False)

                     .select_related('quiz', 'quiz__category'))

        total_quizzes = histories.count()
        average_score = histories.aggregate(avg_score=Avg('score'))[
            'avg_score'] or 0

        total_seconds = 0
        for h in histories:
            if h.completed_at and h.started_at:
                diff = (h.completed_at - h.started_at).total_seconds()
                total_seconds += max(0, diff)

        category_counts = (histories
                           .values('quiz__category__name')
                           .annotate(attempts=Count('pk'))
                           .order_by('-attempts'))
        favorite_category = category_counts[0]['quiz__category__name'] if category_counts else ''

        date_limit = now() - timedelta(days=30)
        trend_data = (histories
                      .filter(completed_at__gte=date_limit)
                      .annotate(day=TruncDate('completed_at'))
                      .values('day')
                      .annotate(average_score=Avg('score'), quiz_count=Count('pk'))
                      .order_by('day'))

        performance_trends = [{
            'date': d['day'].isoformat() if d['day'] else '',
            'average_score': round(d['average_score'] or 0, 2),
            'quiz_count': d['quiz_count']
        } for d in trend_data]

        category_performance_data = []
        for c in category_counts:
            name = c['quiz__category__name']
            cat_histories = histories.filter(quiz__category__name=name)
            attempts = c['attempts']
            avg_score = cat_histories.aggregate(s=Avg('score'))['s'] or 0

            cat_total_seconds = 0
            for h in cat_histories:
                if h.completed_at and h.started_at:
                    cat_total_seconds += max(0, (h.completed_at -
                                             h.started_at).total_seconds())
            cat_total_minutes = int(cat_total_seconds // 60)
            category_performance_data.append({
                'category': name,
                'attempts': attempts,
                'average_score': round(avg_score, 2),
                'total_time': cat_total_minutes
            })

        score_buckets = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0,
        }
        for h in histories:
            score = h.score or 0
            if score <= 20:
                score_buckets['0-20'] += 1
            elif 21 <= score <= 40:
                score_buckets['21-40'] += 1
            elif 41 <= score <= 60:
                score_buckets['41-60'] += 1
            elif 61 <= score <= 80:
                score_buckets['61-80'] += 1
            elif 81 <= score <= 100:
                score_buckets['81-100'] += 1

        score_distribution = [{'range': k, 'count': v}
                              for k, v in score_buckets.items()]

        recent_activities = (histories
                             .order_by('-completed_at')[:5])

        recent_activity = [{
            'date': a.completed_at.isoformat() if a.completed_at else '',
            'quiz_title': a.quiz.title,
            'score': round(a.score or 0, 2),
            'category': a.quiz.category.name if hasattr(a.quiz, "category") and a.quiz.category else ''
        } for a in recent_activities]

        overview = {
            'total_quizzes': total_quizzes,
            'average_score': round(average_score, 2),
            'total_time': total_seconds,
            'favorite_category': favorite_category,
        }

        return Response({'statistics': {
            'overview': overview,
            'performance_trends': performance_trends,
            'category_performance': category_performance_data,
            'score_distribution': score_distribution,
            'recent_activity': recent_activity,
        }})


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({"user": {
            "username": user.username,
            "email": user.email,
            "avatar_url": user.avatar.url if hasattr(user, 'avatar') and user.avatar else "/avatars/default.svg"
        }})

    def put(self, request):
        user = request.user
        data = request.data
        user.username = data.get("username", user.username)
        user.email = data.get("email", user.email)
        password = data.get("password")
        if password:
            user.set_password(password)
        user.save()
        return Response({"message": "Profile updated successfully", "user": {
            "username": user.username, "email": user.email
        }})


class CategoryListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        subcategories = SubCategory.objects.all()

        category_dict = {cat.name: [] for cat in categories}
        for sub in subcategories:
            if sub.category.name in category_dict:
                category_dict[sub.category.name].append(sub.name)

        result = [{"name": key, "subcategories": value}
                  for key, value in category_dict.items()]
        return Response({"categories": result})


class ChatbotAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_message = request.data.get("message", "").strip()
        if not user_message:
            return Response({"error": "Message cannot be empty."}, status=400)
        return Response({"response": f"You said: {user_message}"})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    data = request.data
    email = data.get("email")
    password = data.get("password")
    user = authenticate(request, username=email, password=password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "user": {
                "username": user.username,
                "email": user.email,
            }
        })
    return Response({"error": "Invalid email or password."}, status=401)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def signup_view(request):
    data = request.data
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return Response({"error": "All fields required"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=400)

    user = User.objects.create_user(
        username=username, email=email, password=password)
    return Response({"message": "User created. Please log in."})


@api_view(['POST'])
def logout_view(request):
    django_logout(request)
    return Response({"message": "Logged out successfully."})


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_account_view(request):
    user = request.user
    user.delete()
    return Response({"message": "Account deleted successfully."})
