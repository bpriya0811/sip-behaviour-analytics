from __future__ import annotations

from rest_framework import serializers

from .models import BehaviourScore, Question, QuestionOption, Respondent


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ["id", "label", "value", "score", "order"]


class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            "id",
            "step",
            "section",
            "slug",
            "prompt",
            "help_text",
            "question_type",
            "placeholder",
            "required",
            "active",
            "order",
            "min_value",
            "max_value",
            "min_label",
            "max_label",
            "metadata",
            "options",
        ]

    def create(self, validated_data):
        options = validated_data.pop("options", [])
        question = Question.objects.create(**validated_data)
        self._sync_options(question, options)
        return question

    def update(self, instance, validated_data):
        options = validated_data.pop("options", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if options is not None:
            instance.options.all().delete()
            self._sync_options(instance, options)
        return instance

    @staticmethod
    def _sync_options(question, options):
        for index, option in enumerate(options):
            QuestionOption.objects.create(
                question=question,
                label=option.get("label", ""),
                value=option.get("value", option.get("label", "")),
                score=option.get("score", 0),
                order=option.get("order", index),
            )


class BehaviourScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = BehaviourScore
        fields = ["score", "risk_score", "investor_type", "summary", "created_at"]


class RespondentSerializer(serializers.ModelSerializer):
    behaviour_score = BehaviourScoreSerializer(read_only=True)
    stocks = serializers.SerializerMethodField()

    class Meta:
        model = Respondent
        fields = [
            "id",
            "created_at",
            "age",
            "gender",
            "occupation",
            "income_range",
            "education",
            "district",
            "taluka",
            "district_city",
            "behaviour_score",
            "stocks",
        ]

    def get_stocks(self, obj):
        return [stock.name for stock in obj.stock_preferences.all()]
