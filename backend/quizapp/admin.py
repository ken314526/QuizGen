from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    User,
    Category,
    QuizHistory,
    SubCategory,
    Quiz,
    Question,
    UserAnswer,
)
from .forms import UserCreationForm, UserChangeForm


class UserAdmin(BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    list_display = ["email", "username", "is_admin", "is_active"]
    list_filter = ["is_admin", "is_active"]
    fieldsets = [
        (None, {"fields": ["email", "password", "username", "avatar"]}),
        ("Permissions", {"fields": ["is_admin", "is_active", "is_superuser"]}),
    ]
    add_fieldsets = [
        (
            None,
            {
                "classes": ["wide"],
                "fields": ["email", "username", "password1", "password2"],
            },
        ),
    ]
    search_fields = ["email", "username"]
    ordering = ["email"]
    filter_horizontal = []


class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "description"]
    search_fields = ["name"]


class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "category"]
    search_fields = ["name"]
    list_filter = ["category"]


class QuizAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "subcategory", "created_at"]
    search_fields = ["title", "description"]
    list_filter = ["category", "subcategory"]


class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text", "quiz", "correct_answer"]
    search_fields = ["text"]
    list_filter = ["quiz"]


class QuizHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "quiz",
        "score",
        "total_questions",
        "correct_answers",
        "started_at",
        "completed_at",
    ]
    list_filter = ["quiz", "user"]


class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ["history", "question", "selected_option", "is_correct"]
    list_filter = ["is_correct", "history"]


admin.site.register(User, UserAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(SubCategory, SubCategoryAdmin)
admin.site.register(Quiz, QuizAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(QuizHistory, QuizHistoryAdmin)
admin.site.register(UserAnswer, UserAnswerAdmin)

admin.site.unregister(Group)

