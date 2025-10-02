from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    MyUser,
    Category,
    SubCategory,
    Quiz,
    Question,
    Answer,
    Result,
    UserHistory,
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
    list_display = ("name", "description", "created_at")
    search_fields = ("name",)


class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "created_at")
    list_filter = ("category",)
    search_fields = ("name",)


class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "subcategory", "created_by", "created_at")
    list_filter = ("category", "subcategory", "created_by")
    search_fields = ("title",)


class QuestionAdmin(admin.ModelAdmin):
    list_display = ("text", "quiz", "question_type", "difficulty_level", "created_at")
    list_filter = ("quiz", "question_type", "difficulty_level")
    search_fields = ("text",)


class AnswerAdmin(admin.ModelAdmin):
    list_display = ("option_text", "question", "is_correct", "created_at")
    list_filter = ("is_correct", "question")
    search_fields = ("option_text",)


class ResultAdmin(admin.ModelAdmin):
    list_display = ("user", "quiz", "score", "time_taken", "created_at")
    list_filter = ("quiz", "user")
    search_fields = ("user__email", "quiz__title")


class UserHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "quiz", "total_attempts", "status", "created_at")
    list_filter = ("quiz", "status")
    search_fields = ("user__email", "quiz__title")


admin.site.register(MyUser, UserAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(SubCategory, SubCategoryAdmin)
admin.site.register(Quiz, QuizAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Answer, AnswerAdmin)
admin.site.register(Result, ResultAdmin)
admin.site.register(UserHistory, UserHistoryAdmin)

admin.site.unregister(Group)
