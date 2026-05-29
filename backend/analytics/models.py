from django.db import models


class Question(models.Model):
    TEXT = "text"
    NUMBER = "number"
    MULTIPLE_CHOICE = "multiple_choice"
    CHECKBOX = "checkbox"
    DROPDOWN = "dropdown"
    SLIDER = "slider"

    QUESTION_TYPES = [
        (TEXT, "Text"),
        (NUMBER, "Number"),
        (MULTIPLE_CHOICE, "Multiple choice"),
        (CHECKBOX, "Checkbox"),
        (DROPDOWN, "Dropdown"),
        (SLIDER, "Slider"),
    ]

    step = models.PositiveSmallIntegerField()
    section = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120, unique=True)
    prompt = models.CharField(max_length=255)
    help_text = models.TextField(blank=True)
    question_type = models.CharField(max_length=32, choices=QUESTION_TYPES)
    placeholder = models.CharField(max_length=160, blank=True)
    required = models.BooleanField(default=True)
    active = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)
    min_value = models.IntegerField(null=True, blank=True)
    max_value = models.IntegerField(null=True, blank=True)
    min_label = models.CharField(max_length=80, blank=True)
    max_label = models.CharField(max_length=80, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["step", "order", "id"]

    def __str__(self) -> str:
        return f"Step {self.step}: {self.prompt}"


class QuestionOption(models.Model):
    question = models.ForeignKey(
        Question, related_name="options", on_delete=models.CASCADE
    )
    label = models.CharField(max_length=160)
    value = models.CharField(max_length=120)
    score = models.FloatField(default=0)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.label


class Respondent(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=80, blank=True)
    occupation = models.CharField(max_length=120, blank=True)
    income_range = models.CharField(max_length=120, blank=True)
    education = models.CharField(max_length=120, blank=True)
    district = models.CharField(max_length=120, blank=True, db_index=True)
    taluka = models.CharField(max_length=120, blank=True, db_index=True)
    district_city = models.CharField(max_length=120, blank=True)

    def __str__(self) -> str:
        return f"Respondent {self.id}"


class Response(models.Model):
    respondent = models.ForeignKey(
        Respondent, related_name="responses", on_delete=models.CASCADE
    )
    question = models.ForeignKey(
        Question, related_name="responses", on_delete=models.SET_NULL, null=True
    )
    question_slug = models.CharField(max_length=120)
    question_prompt = models.CharField(max_length=255)
    answer_text = models.TextField(blank=True)
    answer_number = models.FloatField(null=True, blank=True)
    answer_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.question_slug}: {self.answer_text[:40]}"


class StockPreference(models.Model):
    respondent = models.ForeignKey(
        Respondent, related_name="stock_preferences", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=180)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["name"])]

    def __str__(self) -> str:
        return self.name


class BehaviourScore(models.Model):
    respondent = models.OneToOneField(
        Respondent, related_name="behaviour_score", on_delete=models.CASCADE
    )
    score = models.FloatField()
    risk_score = models.FloatField(default=0)
    investor_type = models.CharField(max_length=120)
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.investor_type} ({self.score:.0f})"
