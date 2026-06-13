from django.db import migrations, models


def seed_village_question(apps, schema_editor):
    Question = apps.get_model("analytics", "Question")
    Question.objects.update_or_create(
        slug="village",
        defaults={
            "step": 1,
            "section": "Demographic Information",
            "prompt": "Village",
            "question_type": "text",
            "placeholder": "Search and select village",
            "required": True,
            "active": True,
            "order": 8,
            "metadata": {
                "dependsOn": "taluka",
                "dependsOnDistrict": "district",
                "autocomplete": True,
                "source": "geographic_locations",
                "dependentPlaceholder": "Select taluka first",
            },
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("analytics", "0003_geographic_questions"),
    ]

    operations = [
        migrations.AddField(
            model_name="respondent",
            name="village",
            field=models.CharField(blank=True, db_index=True, max_length=180),
        ),
        migrations.CreateModel(
            name="GeographicLocation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("district", models.CharField(db_index=True, max_length=120)),
                ("taluka", models.CharField(db_index=True, max_length=120)),
                ("village", models.CharField(db_index=True, max_length=180)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["district", "taluka", "village"],
            },
        ),
        migrations.AddIndex(
            model_name="geographiclocation",
            index=models.Index(
                fields=["district", "taluka"],
                name="analytics_g_distri_402988_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="geographiclocation",
            index=models.Index(
                fields=["district", "taluka", "village"],
                name="analytics_g_distri_74e97d_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="geographiclocation",
            constraint=models.UniqueConstraint(
                fields=("district", "taluka", "village"),
                name="unique_geographic_location",
            ),
        ),
        migrations.RunPython(seed_village_question, migrations.RunPython.noop),
    ]
