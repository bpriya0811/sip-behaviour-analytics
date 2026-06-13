from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    QuestionViewSet,
    analytics_summary,
    export_csv,
    export_excel,
    export_pdf,
    geography_options,
    public_questions,
    submit_survey,
)

router = DefaultRouter()
router.register("admin/questions", QuestionViewSet, basename="admin-questions")

urlpatterns = [
    path("", include(router.urls)),
    path("questions/", public_questions, name="public-questions"),
    path("geography/options/", geography_options, name="geography-options"),
    path("responses/", submit_survey, name="submit-survey"),
    path("analytics/summary/", analytics_summary, name="analytics-summary"),
    path("exports/csv/", export_csv, name="export-csv"),
    path("exports/excel/", export_excel, name="export-excel"),
    path("exports/pdf/", export_pdf, name="export-pdf"),
]
