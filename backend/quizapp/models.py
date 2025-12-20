from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin

from .manager import UserManager


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class User(AbstractBaseUser, BaseModel, PermissionsMixin):
    username = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(verbose_name="email address", max_length=255, unique=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.svg')
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return str(self.email)

    @property
    def is_staff(self):
        return self.is_admin

class Category(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return str(self.name)


class SubCategory(BaseModel):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, related_name='subcategories', on_delete=models.CASCADE)

    def __str__(self):
        return str(self.name)


class Quiz(BaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, related_name='quizzes', on_delete=models.CASCADE)
    subcategory = models.ForeignKey(SubCategory, related_name='quizzes', on_delete=models.CASCADE, null=True, blank=True)
    time_duration = models.PositiveIntegerField(help_text="Duration in minutes", default=5)

    def __str__(self):
        return str(self.title)


class Question(BaseModel):
    ANSWER_CHOICES = [
        ("A", "option_a"),
        ("B", "option_b"),
        ("C", "option_c"),
        ("D", "option_d"),
    ]

    quiz = models.ForeignKey(Quiz, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()

    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)

    correct_answer = models.CharField(choices=ANSWER_CHOICES, max_length=1)
    difficulty = models.CharField(max_length=20, choices=[("Easy", "Easy"), ("Medium", "Medium"), ("Hard", "Hard")], default="Easy")

    def __str__(self):
        return str(self.text)


class QuizHistory(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE,related_name='quiz_histories')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE,related_name='quiz_histories')
    score = models.FloatField(default=0)
    total_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)


class UserAnswer(BaseModel):
    ANSWER_CHOICES = [
        ("A", "option_a"),
        ("B", "option_b"),
        ("C", "option_c"),
        ("D", "option_d"),
    ]

    history = models.ForeignKey(QuizHistory, related_name='user_answers', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.CharField(choices=ANSWER_CHOICES, max_length=1)
    is_correct = models.BooleanField(default=False)
    
    
