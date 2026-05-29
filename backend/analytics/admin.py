from django.contrib import admin

from .models import BehaviourScore, Question, QuestionOption, Respondent, Response, StockPreference


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 1


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("prompt", "step", "question_type", "active", "order")
    list_filter = ("step", "question_type", "active")
    search_fields = ("prompt", "slug")
    inlines = [QuestionOptionInline]


@admin.register(Respondent)
class RespondentAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "district", "taluka", "age", "gender")
    list_filter = ("district", "taluka", "gender")
    search_fields = ("district", "taluka", "occupation", "education")


admin.site.register(Response)
admin.site.register(StockPreference)
admin.site.register(BehaviourScore)
