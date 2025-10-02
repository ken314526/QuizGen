from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin

from .manager import MyUserManager


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class MyUser(AbstractBaseUser, BaseModel, PermissionsMixin):
    username = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(verbose_name="email address", max_length=255, unique=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.svg')
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = MyUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return str(self.email)

    @property
    def is_staff(self):
        return self.is_admin


class Category(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return str(self.name)


class SubCategory(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="subcategories")

    def __str__(self):
        return str(self.name)


class Quiz(BaseModel):
    title = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="quizzes")
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="quizzes")
    created_by = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name="quizzes")

    def __str__(self):
        return str(self.title)


class Question(BaseModel):
    QUESTION_TYPES = (
        ('MCQ', 'Multiple Choice'),
        ('TF', 'True/False'),
        ('SA', 'Short Answer'),
    )

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES)
    difficulty_level = models.IntegerField(default=1)  # 1=Easy, 2=Medium, 3=Hard

    def __str__(self):
        return f"{str(self.text)[:50]}..."


class Answer(BaseModel):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    option_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.option_text} ({'Correct' if self.is_correct else 'Wrong'})"


class Result(BaseModel):
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name="results")
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="results")
    score = models.IntegerField()
    time_taken = models.DurationField()

    def __str__(self):
        user_email = getattr(self.user, 'email', 'Unknown User')
        quiz_title = getattr(self.quiz, 'title', 'Unknown Quiz')
        return f"{user_email} - {quiz_title} ({self.score})"


class UserHistory(BaseModel):
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name="history")
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="history")
    total_attempts = models.IntegerField(default=0)
    status = models.CharField(max_length=50, choices=(('Passed', 'Passed'), ('Failed', 'Failed')))

    def __str__(self):
        user_email = getattr(self.user, 'email', 'Unknown User')
        quiz_title = getattr(self.quiz, 'title', 'Unknown Quiz')
        return f"{user_email} - {quiz_title} ({self.status})"