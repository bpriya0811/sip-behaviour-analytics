from django.db import migrations, models


DISTRICTS = ["Kolhapur", "Sangli"]
TALUKAS = [
    "Karveer",
    "Panhala",
    "Hatkanangale",
    "Shirol",
    "Kagal",
    "Gadhinglaj",
    "Chandgad",
    "Ajara",
    "Bhudargad",
    "Radhanagari",
    "Gaganbawda",
    "Shahuwadi",
    "Miraj",
    "Walwa (Islampur)",
    "Tasgaon",
    "Khanapur-Vita",
    "Kavathe Mahankal",
    "Jat",
    "Shirala",
    "Palus",
    "Atpadi",
    "Kadegaon",
]


def _key(value):
    if value is None:
        return ""
    return "".join(char for char in str(value).strip().lower() if char.isalnum())


def _canonical(value, choices):
    source_key = _key(value)
    if not source_key:
        return ""
    for choice in choices:
        choice_key = _key(choice)
        if source_key == choice_key or choice_key in source_key:
            return choice
    return ""


def backfill_geography(apps, schema_editor):
    Respondent = apps.get_model("analytics", "Respondent")
    Response = apps.get_model("analytics", "Response")

    for respondent in Respondent.objects.all():
        district = _canonical(getattr(respondent, "district_city", ""), DISTRICTS)
        taluka = ""

        district_response = (
            Response.objects.filter(
                respondent_id=respondent.id,
                question_slug__in=["district", "district_city"],
            )
            .order_by("-id")
            .first()
        )
        if district_response:
            district = _canonical(district_response.answer_text, DISTRICTS) or district

        taluka_response = (
            Response.objects.filter(respondent_id=respondent.id, question_slug="taluka")
            .order_by("-id")
            .first()
        )
        if taluka_response:
            taluka = _canonical(taluka_response.answer_text, TALUKAS)

        respondent.district = district
        respondent.taluka = taluka
        respondent.save(update_fields=["district", "taluka"])


class Migration(migrations.Migration):
    dependencies = [
        ("analytics", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="respondent",
            name="district",
            field=models.CharField(blank=True, db_index=True, max_length=120),
        ),
        migrations.AddField(
            model_name="respondent",
            name="taluka",
            field=models.CharField(blank=True, db_index=True, max_length=120),
        ),
        migrations.RunPython(backfill_geography, migrations.RunPython.noop),
    ]
