from django.db import migrations


DISTRICTS = ["Kolhapur", "Sangli"]
TALUKAS_BY_DISTRICT = {
    "Kolhapur": [
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
    ],
    "Sangli": [
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
    ],
}


def _sync_options(question, options):
    question.options.all().delete()
    for index, value in enumerate(options):
        question.options.create(label=value, value=value, order=index, score=0)


def seed_geographic_questions(apps, schema_editor):
    Question = apps.get_model("analytics", "Question")

    legacy_district = Question.objects.filter(slug="district_city").first()
    if legacy_district and not Question.objects.filter(slug="district").exists():
        legacy_district.slug = "district"
        legacy_district.save(update_fields=["slug"])

    district_question, _ = Question.objects.update_or_create(
        slug="district",
        defaults={
            "step": 1,
            "section": "Demographic Information",
            "prompt": "District",
            "question_type": "dropdown",
            "placeholder": "",
            "required": True,
            "active": True,
            "order": 6,
            "metadata": {},
        },
    )
    _sync_options(district_question, DISTRICTS)

    talukas = [
        taluka
        for district in DISTRICTS
        for taluka in TALUKAS_BY_DISTRICT[district]
    ]
    taluka_question, _ = Question.objects.update_or_create(
        slug="taluka",
        defaults={
            "step": 1,
            "section": "Demographic Information",
            "prompt": "Taluka",
            "question_type": "dropdown",
            "placeholder": "Select district first",
            "required": True,
            "active": True,
            "order": 7,
            "metadata": {
                "dependsOn": "district",
                "dependentPlaceholder": "Select district first",
                "optionsByDistrict": TALUKAS_BY_DISTRICT,
            },
        },
    )
    _sync_options(taluka_question, talukas)

    Question.objects.filter(slug="district_city").update(active=False, required=False)


class Migration(migrations.Migration):
    dependencies = [
        ("analytics", "0002_geographic_fields"),
    ]

    operations = [
        migrations.RunPython(seed_geographic_questions, migrations.RunPython.noop),
    ]
