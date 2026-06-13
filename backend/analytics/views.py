from __future__ import annotations

import csv
import logging
from collections import Counter, defaultdict
from io import BytesIO, StringIO
from typing import Any

from django.db import transaction
from django.db.models import Avg, Count
from django.http import FileResponse, HttpResponse
from django.views.decorators.cache import cache_page
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response as ApiResponse

from .geography import (
    ALL_TALUKAS,
    DISTRICTS,
    TALUKA_DISTRICT,
    TALUKAS_BY_DISTRICT,
    canonical_district,
    canonical_taluka,
    taluka_options_metadata,
)
from .models import (
    BehaviourScore,
    GeographicLocation,
    Question,
    Respondent,
    Response,
    StockPreference,
)
from .scoring import calculate_behaviour
from .serializers import QuestionSerializer, RespondentSerializer

logger = logging.getLogger(__name__)


def _coerce_number(value: Any):
    try:
        if isinstance(value, list):
            value = value[0] if value else None
        if value in ("", None):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _answer_text(value: Any) -> str:
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    if value is None:
        return ""
    return str(value)


def _extract_profile(answers: dict[str, Any]) -> dict[str, Any]:
    age = _coerce_number(answers.get("age"))
    district = canonical_district(answers.get("district") or answers.get("district_city"))
    taluka = canonical_taluka(answers.get("taluka"), district)
    village = _answer_text(answers.get("village")).strip()
    return {
        "age": int(age) if age is not None else None,
        "gender": _answer_text(answers.get("gender")),
        "occupation": _answer_text(answers.get("occupation")),
        "income_range": _answer_text(answers.get("income_range")),
        "education": _answer_text(answers.get("education")),
        "district": district,
        "taluka": taluka,
        "village": village,
        "district_city": district or _answer_text(answers.get("district_city")),
    }


def _canonical_village(value: Any, district: str, taluka: str) -> str:
    village = _answer_text(value).strip()
    if not village:
        return ""

    locations = GeographicLocation.objects.filter(district=district, taluka=taluka)
    if not locations.exists():
        return village

    normalized = "".join(char for char in village.lower() if char.isalnum())
    for location in locations.only("village"):
        location_key = "".join(char for char in location.village.lower() if char.isalnum())
        if normalized == location_key:
            return location.village
    return ""


def _validate_geography(answers: dict[str, Any]) -> tuple[str, str, str, dict[str, str]]:
    district = canonical_district(answers.get("district") or answers.get("district_city"))
    taluka = canonical_taluka(answers.get("taluka"), district)
    village = _canonical_village(answers.get("village"), district, taluka)
    errors: dict[str, str] = {}

    if not district:
        errors["district"] = "Select Kolhapur or Sangli district."
    if district and not taluka:
        errors["taluka"] = f"Select a valid taluka for {district} district."
    if district and taluka and not village:
        errors["village"] = f"Select a valid village for {taluka} taluka."

    return district, taluka, village, errors


def _requested_filters(request) -> tuple[str, str, dict[str, str]]:
    district_param = request.query_params.get("district", "")
    taluka_param = request.query_params.get("taluka", "")
    district = canonical_district(district_param)
    taluka = canonical_taluka(taluka_param, district)
    errors: dict[str, str] = {}

    if district_param and not district:
        errors["district"] = "Unknown district filter."
    if taluka_param and not taluka:
        errors["taluka"] = "Unknown taluka filter."

    return district, taluka, errors


def _stock_names(payload: Any) -> list[str]:
    if not isinstance(payload, list):
        return []
    names = []
    for item in payload:
        name = str(item).strip()
        if name and name.lower() not in [existing.lower() for existing in names]:
            names.append(name[:180])
    return names


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related("options").all()
    serializer_class = QuestionSerializer


@cache_page(60 * 5)  # Cache for 5 minutes
@api_view(["GET"])
def public_questions(request):
    questions = Question.objects.prefetch_related("options").filter(active=True)
    return ApiResponse(QuestionSerializer(questions, many=True).data)


@cache_page(60 * 5)  # Cache for 5 minutes
@api_view(["GET"])
def geography_options(request):
    locations = list(
        GeographicLocation.objects.order_by("district", "taluka", "village").values(
            "district", "taluka", "village"
        )
    )
    districts: list[str] = []
    talukas_by_district: dict[str, list[str]] = {}
    villages_by_district_taluka: dict[str, dict[str, list[str]]] = {}

    if locations:
        for item in locations:
            district = item["district"]
            taluka = item["taluka"]
            village = item["village"]
            if district not in districts:
                districts.append(district)
            talukas_by_district.setdefault(district, [])
            if taluka not in talukas_by_district[district]:
                talukas_by_district[district].append(taluka)
            villages_by_district_taluka.setdefault(district, {}).setdefault(taluka, [])
            villages_by_district_taluka[district][taluka].append(village)
    else:
        districts = list(DISTRICTS)
        talukas_by_district = taluka_options_metadata()
        villages_by_district_taluka = {
            district: {taluka: [] for taluka in talukas}
            for district, talukas in talukas_by_district.items()
        }

    return ApiResponse(
        {
            "districts": districts,
            "talukasByDistrict": talukas_by_district,
            "villagesByDistrictTaluka": villages_by_district_taluka,
        }
    )


@api_view(["POST"])
def submit_survey(request):
    answers = request.data.get("answers", {})
    if not isinstance(answers, dict):
        return ApiResponse(
            {"detail": "answers must be an object."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    answers = dict(answers)
    district, taluka, village, geography_errors = _validate_geography(answers)
    if geography_errors:
        return ApiResponse(
            {
                "detail": "District, taluka, and village are required.",
                "errors": geography_errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    answers["district"] = district
    answers["taluka"] = taluka
    answers["village"] = village

    try:
        with transaction.atomic():
            profile = _extract_profile(answers)
            respondent = Respondent.objects.create(**profile)
            questions = {
                question.slug: question
                for question in Question.objects.prefetch_related("options").all()
            }

            response_rows = []
            for slug, value in answers.items():
                question = questions.get(slug)
                if not question:
                    continue
                response_rows.append(
                    Response(
                        respondent=respondent,
                        question=question,
                        question_slug=slug,
                        question_prompt=question.prompt,
                        answer_text=_answer_text(value),
                        answer_number=_coerce_number(value),
                        answer_json=value if isinstance(value, (dict, list)) else None,
                    )
                )
            Response.objects.bulk_create(response_rows)

            StockPreference.objects.bulk_create(
                [
                    StockPreference(respondent=respondent, name=name)
                    for name in _stock_names(answers.get("stock_preferences"))
                ]
            )

            score = calculate_behaviour(answers, questions.values())
            BehaviourScore.objects.create(respondent=respondent, **score)

        respondent = (
            Respondent.objects.prefetch_related("stock_preferences")
            .select_related("behaviour_score")
            .get(id=respondent.id)
        )
    except Exception:
        logger.exception(
            "Survey submission failed while writing respondent response.",
            extra={"answer_slugs": sorted(answers.keys())},
        )
        return ApiResponse(
            {"detail": "Submission failed before the response could be saved."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return ApiResponse(
        {
            "respondent": RespondentSerializer(respondent).data,
            "result": score,
        },
        status=status.HTTP_201_CREATED,
    )


def _filtered_respondents(district: str = "", taluka: str = ""):
    respondents = Respondent.objects.select_related("behaviour_score").prefetch_related(
        "stock_preferences"
    )
    if district:
        respondents = respondents.filter(district=district)
    if taluka:
        respondents = respondents.filter(taluka=taluka)
    return respondents


def _responses_by_slug(slug: str, respondent_ids: list[int] | None = None):
    responses = Response.objects.filter(question_slug=slug).select_related("respondent")
    if respondent_ids is not None:
        responses = responses.filter(respondent_id__in=respondent_ids)
    return responses


def _count_answers(slug: str, respondent_ids: list[int] | None = None):
    counts = Counter(
        response.answer_text for response in _responses_by_slug(slug, respondent_ids)
    )
    return [{"name": key or "Not specified", "value": value} for key, value in counts.items()]


def _location_reference():
    rows = list(
        GeographicLocation.objects.order_by("district", "taluka")
        .values_list("district", "taluka")
        .distinct()
    )
    if not rows:
        return list(DISTRICTS), taluka_options_metadata(), dict(TALUKA_DISTRICT)

    districts: list[str] = []
    talukas_by_district: dict[str, list[str]] = {}
    taluka_district: dict[str, str] = {}
    for district, taluka in rows:
        if district not in districts:
            districts.append(district)
        talukas_by_district.setdefault(district, [])
        if taluka not in talukas_by_district[district]:
            talukas_by_district[district].append(taluka)
        taluka_district[taluka] = district
    return districts, talukas_by_district, taluka_district


def _geographic_payload(respondents, total: int, district_filter: str = ""):
    districts, talukas_by_district, taluka_district = _location_reference()
    district_counts = []
    for district in districts:
        value = respondents.filter(district=district).count()
        district_counts.append(
            {
                "name": district,
                "value": value,
                "percentage": round((value / total) * 100, 1) if total else 0,
            }
        )

    possible_talukas = (
        talukas_by_district[district_filter]
        if district_filter
        else [taluka for talukas in talukas_by_district.values() for taluka in talukas]
    )
    taluka_counts = Counter(
        respondent.taluka
        for respondent in respondents
        if respondent.taluka in possible_talukas
    )
    taluka_distribution = [
        {
            "name": taluka,
            "district": taluka_district[taluka],
            "value": taluka_counts.get(taluka, 0),
            "percentage": (
                round((taluka_counts.get(taluka, 0) / total) * 100, 1)
                if total
                else 0
            ),
        }
        for taluka in possible_talukas
        if taluka_counts.get(taluka, 0) > 0
    ]
    taluka_distribution.sort(key=lambda item: (-item["value"], item["name"]))
    for index, item in enumerate(taluka_distribution, start=1):
        item["rank"] = index

    least_taluka = (
        min(taluka_distribution, key=lambda item: (item["value"], item["name"]))
        if taluka_distribution
        else None
    )

    return {
        "summary": {
            "totalResponses": total,
            "kolhapurResponses": next(
                (item["value"] for item in district_counts if item["name"] == "Kolhapur"),
                0,
            ),
            "sangliResponses": next(
                (item["value"] for item in district_counts if item["name"] == "Sangli"),
                0,
            ),
            "mostRepresentedTaluka": (
                taluka_distribution[0]["name"] if taluka_distribution else "No data yet"
            ),
            "leastRepresentedTaluka": (
                least_taluka["name"] if least_taluka else "No data yet"
            ),
            "talukasCovered": len(taluka_distribution),
            "talukasTotal": len(possible_talukas),
        },
        "districtDistribution": district_counts,
        "talukaDistribution": taluka_distribution,
        "options": {
            "districts": districts,
            "talukasByDistrict": talukas_by_district,
        },
    }


@api_view(["GET"])
def analytics_summary(request):
    district, taluka, errors = _requested_filters(request)
    if errors:
        return ApiResponse({"detail": "Invalid geographic filter.", "errors": errors}, status=400)
    return ApiResponse(_analytics_payload(district=district, taluka=taluka))


def _analytics_payload(district: str = "", taluka: str = ""):
    respondents = _filtered_respondents(district, taluka)
    respondent_ids = list(respondents.values_list("id", flat=True))
    total = len(respondent_ids)
    sip_amounts = [
        response.answer_number
        for response in _responses_by_slug("monthly_sip_amount", respondent_ids)
        if response.answer_number is not None
    ]
    avg_sip = round(sum(sip_amounts) / len(sip_amounts), 2) if sip_amounts else 0
    avg_risk = (
        BehaviourScore.objects.filter(respondent_id__in=respondent_ids)
        .aggregate(value=Avg("risk_score"))
        .get("value")
        or 0
    )
    stock_counter = Counter(
        stock.name.strip()
        for stock in StockPreference.objects.filter(respondent_id__in=respondent_ids)
        if stock.name.strip()
    )
    most_stock = stock_counter.most_common(1)[0][0] if stock_counter else "No data yet"

    age_sips: dict[int, list[float]] = defaultdict(list)
    for response in _responses_by_slug("monthly_sip_amount", respondent_ids):
        if response.respondent.age and response.answer_number is not None:
            age_sips[int(response.respondent.age)].append(response.answer_number)

    age_vs_sip = [
        {"age": age, "sip": round(sum(values) / len(values), 2)}
        for age, values in sorted(age_sips.items())
    ]

    risk_buckets = {"Low": 0, "Balanced": 0, "High": 0}
    for score in BehaviourScore.objects.filter(respondent_id__in=respondent_ids):
        if score.risk_score <= 3:
            risk_buckets["Low"] += 1
        elif score.risk_score <= 6:
            risk_buckets["Balanced"] += 1
        else:
            risk_buckets["High"] += 1

    behaviour_categories = [
        {"name": item["investor_type"], "value": item["count"]}
        for item in BehaviourScore.objects.filter(respondent_id__in=respondent_ids)
        .values("investor_type")
        .annotate(count=Count("id"))
        .order_by("-count")
    ]

    return {
        "overview": {
            "totalRespondents": total,
            "averageSipAmount": avg_sip,
            "mostMentionedStock": most_stock,
            "averageRiskScore": round(avg_risk, 2),
        },
        "charts": {
            "ageVsSip": age_vs_sip,
            "riskDistribution": [
                {"name": key, "value": value} for key, value in risk_buckets.items()
            ],
            "mostMentionedStocks": [
                {"name": name, "value": value}
                for name, value in stock_counter.most_common(10)
            ],
            "marketCrashReaction": _count_answers("reaction_market_crash", respondent_ids),
            "sipContinuation": _count_answers("continue_sip_volatility", respondent_ids),
            "investmentGoals": _count_answers("investment_goal", respondent_ids),
            "behaviourCategories": behaviour_categories,
        },
        "geography": _geographic_payload(respondents, total, district),
        "filters": {"district": district, "taluka": taluka},
    }


def _export_rows(district: str = "", taluka: str = ""):
    questions = list(Question.objects.order_by("step", "order"))
    respondents = _filtered_respondents(district, taluka).prefetch_related(
        "responses", "stock_preferences"
    )
    headers = [
        "Respondent ID",
        "Submitted At",
        "Age",
        "Gender",
        "Occupation",
        "Income Range",
        "Education",
        "District",
        "Taluka",
        "Village",
        "District/City (Legacy)",
        "Stock Preferences",
        "Behaviour Score",
        "Risk Score",
        "Investor Type",
    ] + [question.slug for question in questions]

    rows = []
    for respondent in respondents:
        answers = {response.question_slug: response.answer_text for response in respondent.responses.all()}
        score = getattr(respondent, "behaviour_score", None)
        rows.append(
            [
                respondent.id,
                respondent.created_at.isoformat(),
                respondent.age or "",
                respondent.gender,
                respondent.occupation,
                respondent.income_range,
                respondent.education,
                respondent.district,
                respondent.taluka,
                respondent.village,
                respondent.district_city,
                ", ".join(stock.name for stock in respondent.stock_preferences.all()),
                getattr(score, "score", ""),
                getattr(score, "risk_score", ""),
                getattr(score, "investor_type", ""),
            ]
            + [answers.get(question.slug, "") for question in questions]
        )
    return headers, rows


@api_view(["GET"])
def export_csv(request):
    district, taluka, errors = _requested_filters(request)
    if errors:
        return ApiResponse({"detail": "Invalid geographic filter.", "errors": errors}, status=400)
    headers, rows = _export_rows(district, taluka)
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(rows)
    response = HttpResponse(buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="sip_behaviour_responses.csv"'
    return response


@api_view(["GET"])
def export_excel(request):
    district, taluka, errors = _requested_filters(request)
    if errors:
        return ApiResponse({"detail": "Invalid geographic filter.", "errors": errors}, status=400)
    headers, rows = _export_rows(district, taluka)
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "SIP Behaviour Responses"
    sheet.append(headers)
    for row in rows:
        sheet.append(row)
    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    response = HttpResponse(
        buffer.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="sip_behaviour_responses.xlsx"'
    return response


@api_view(["GET"])
def export_pdf(request):
    district, taluka, errors = _requested_filters(request)
    if errors:
        return ApiResponse({"detail": "Invalid geographic filter.", "errors": errors}, status=400)
    summary = _analytics_payload(district=district, taluka=taluka)
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title="SIP Behaviour Analytics Summary")
    styles = getSampleStyleSheet()
    story = [
        Paragraph("SIP Behaviour Analytics Summary", styles["Title"]),
        Spacer(1, 16),
        Paragraph(
            "Predictive Analysis of SIP Investment Towards Market Volatility and Investor Behaviour",
            styles["BodyText"],
        ),
        Spacer(1, 20),
    ]
    overview = summary["overview"]
    geography = summary["geography"]
    table = Table(
        [
            ["Metric", "Value"],
            ["Total Respondents", overview["totalRespondents"]],
            ["Average SIP Amount", overview["averageSipAmount"]],
            ["Most Mentioned Stock", overview["mostMentionedStock"]],
            ["Average Risk Score", overview["averageRiskScore"]],
            ["District Filter", district or "All"],
            ["Taluka Filter", taluka or "All"],
        ]
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9EDFF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#24306E")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CFD8FF")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 18))

    district_table = Table(
        [["District", "Responses", "Percentage"]]
        + [
            [item["name"], item["value"], f'{item["percentage"]}%']
            for item in geography["districtDistribution"]
        ]
    )
    district_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9EDFF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#24306E")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CFD8FF")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(Paragraph("Geographic Distribution", styles["Heading2"]))
    story.append(district_table)
    story.append(Spacer(1, 14))

    taluka_rows = geography["talukaDistribution"] or [
        {"rank": "-", "name": "No data yet", "district": "-", "value": 0}
    ]
    taluka_table = Table(
        [["Rank", "Taluka", "District", "Responses"]]
        + [
            [item["rank"], item["name"], item["district"], item["value"]]
            for item in taluka_rows
        ]
    )
    taluka_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9EDFF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#24306E")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CFD8FF")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(Paragraph("Taluka Response Rankings", styles["Heading2"]))
    story.append(taluka_table)
    doc.build(story)
    buffer.seek(0)
    return FileResponse(
        buffer,
        as_attachment=True,
        filename="sip_behaviour_analytics_summary.pdf",
        content_type="application/pdf",
    )
