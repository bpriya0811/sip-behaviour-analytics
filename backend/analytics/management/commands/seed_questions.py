from django.core.management.base import BaseCommand

from analytics.geography import DISTRICTS, TALUKAS_BY_DISTRICT, taluka_options_metadata
from analytics.models import Question


QUESTIONS = [
    {
        "step": 1,
        "section": "Demographic Information",
        "slug": "age",
        "prompt": "Age",
        "question_type": "number",
        "placeholder": "Enter your age",
        "order": 1,
        "min_value": 18,
        "max_value": 80,
    },
    {
        "step": 1,
        "section": "Demographic Information",
        "slug": "gender",
        "prompt": "Gender",
        "question_type": "dropdown",
        "order": 2,
        "options": ["Female", "Male", "Non-binary", "Prefer not to say"],
    },
    {
        "step": 1,
        "section": "Demographic Information",
        "slug": "occupation",
        "prompt": "Occupation",
        "question_type": "text",
        "placeholder": "Student, salaried, business, professional...",
        "order": 3,
    },
    {
        "step": 1,
        "section": "Demographic Information",
        "slug": "income_range",
        "prompt": "Income Range",
        "question_type": "dropdown",
        "order": 4,
        "options": [
            "Below Rs. 3 lakh",
            "Rs. 3-6 lakh",
            "Rs. 6-10 lakh",
            "Rs. 10-20 lakh",
            "Above Rs. 20 lakh",
        ],
    },
    {
        "step": 1,
        "section": "Demographic Information",
        "slug": "education",
        "prompt": "Education",
        "question_type": "dropdown",
        "order": 5,
        "options": ["Undergraduate", "Graduate", "Postgraduate", "Doctorate", "Other"],
    },
    {
        "step": 1,
        "section": "Demographic Information",
        "slug": "district",
        "prompt": "District",
        "question_type": "dropdown",
        "order": 6,
        "options": [(district, district) for district in DISTRICTS],
    },
    {
        "step": 1,
        "section": "Demographic Information",
        "slug": "taluka",
        "prompt": "Taluka",
        "question_type": "dropdown",
        "placeholder": "Select district first",
        "order": 7,
        "metadata": {
            "dependsOn": "district",
            "dependentPlaceholder": "Select district first",
            "optionsByDistrict": taluka_options_metadata(),
        },
        "options": [
            (taluka, taluka)
            for district in DISTRICTS
            for taluka in TALUKAS_BY_DISTRICT[district]
        ],
    },
    {
        "step": 2,
        "section": "SIP Investment Behaviour",
        "slug": "monthly_sip_amount",
        "prompt": "Monthly SIP Amount",
        "question_type": "number",
        "placeholder": "Example: 5000",
        "order": 1,
        "min_value": 0,
    },
    {
        "step": 2,
        "section": "SIP Investment Behaviour",
        "slug": "sip_duration",
        "prompt": "SIP Duration",
        "question_type": "dropdown",
        "order": 2,
        "options": [
            ("Less than 1 year", "0-1"),
            ("1 to 3 years", "1-3"),
            ("3 to 5 years", "3-5"),
            ("More than 5 years", "5+"),
        ],
    },
    {
        "step": 2,
        "section": "SIP Investment Behaviour",
        "slug": "investment_goal",
        "prompt": "Investment Goal",
        "question_type": "dropdown",
        "order": 3,
        "options": [
            ("Wealth creation", "wealth_creation"),
            ("Retirement planning", "retirement"),
            ("Children education", "children_education"),
            ("Tax saving", "tax_saving"),
            ("Short-term goal", "short_term"),
        ],
    },
    {
        "step": 2,
        "section": "SIP Investment Behaviour",
        "slug": "investment_frequency",
        "prompt": "Investment Frequency",
        "question_type": "dropdown",
        "order": 4,
        "options": ["Monthly", "Quarterly", "Occasionally", "Lump sum plus SIP"],
    },
    {
        "step": 2,
        "section": "SIP Investment Behaviour",
        "slug": "investment_experience",
        "prompt": "Investment Experience",
        "question_type": "dropdown",
        "order": 5,
        "options": ["Beginner", "Intermediate", "Experienced", "Advanced"],
    },
    {
        "step": 3,
        "section": "Large-Cap Stock Preference",
        "slug": "stock_preferences",
        "prompt": "Preferred large-cap stocks, SIP mutual funds, or investments",
        "question_type": "text",
        "placeholder": "Type Reliance, HDFC, ICICI, Nifty 50...",
        "order": 1,
        "metadata": {"smartStockInput": True},
    },
    {
        "step": 4,
        "section": "Market Volatility Behaviour",
        "slug": "reaction_market_crash",
        "prompt": "Reaction during market crash",
        "question_type": "multiple_choice",
        "order": 1,
        "options": [
            ("Invest more", "invest_more"),
            ("Hold current SIPs", "hold"),
            ("Wait and observe", "wait"),
            ("Withdraw investments", "withdraw"),
        ],
    },
    {
        "step": 4,
        "section": "Market Volatility Behaviour",
        "slug": "continue_sip_volatility",
        "prompt": "Do you continue SIP during volatility?",
        "question_type": "multiple_choice",
        "order": 2,
        "options": [
            ("Increase SIP", "increase"),
            ("Continue unchanged", "continue"),
            ("Reduce SIP", "reduce"),
            ("Stop SIP", "stop"),
        ],
    },
    {
        "step": 4,
        "section": "Market Volatility Behaviour",
        "slug": "fear_during_losses",
        "prompt": "Fear during losses",
        "question_type": "slider",
        "order": 3,
        "min_value": 0,
        "max_value": 10,
        "min_label": "Calm",
        "max_label": "Very fearful",
    },
    {
        "step": 4,
        "section": "Market Volatility Behaviour",
        "slug": "bear_market_reaction",
        "prompt": "Bear market reaction",
        "question_type": "multiple_choice",
        "order": 4,
        "options": [
            ("Rebalance and continue", "rebalance"),
            ("Continue SIP patiently", "continue"),
            ("Pause new investments", "pause"),
            ("Exit equity exposure", "exit"),
        ],
    },
    {
        "step": 5,
        "section": "Investor Psychology",
        "slug": "portfolio_checking_frequency",
        "prompt": "Portfolio checking frequency",
        "question_type": "dropdown",
        "order": 1,
        "options": ["Daily", "Weekly", "Monthly", "Quarterly", "Rarely"],
    },
    {
        "step": 5,
        "section": "Investor Psychology",
        "slug": "emotional_losses",
        "prompt": "Emotional reaction to losses",
        "question_type": "multiple_choice",
        "order": 2,
        "options": [
            ("Calm and objective", "calm"),
            ("Concerned but steady", "concerned"),
            ("Anxious", "anxious"),
            ("Panic-driven", "panic"),
        ],
    },
    {
        "step": 5,
        "section": "Investor Psychology",
        "slug": "patience_level",
        "prompt": "Patience level",
        "question_type": "slider",
        "order": 3,
        "min_value": 0,
        "max_value": 10,
        "min_label": "Short-term",
        "max_label": "Long-term",
    },
    {
        "step": 5,
        "section": "Investor Psychology",
        "slug": "risk_appetite",
        "prompt": "Risk appetite",
        "question_type": "slider",
        "order": 4,
        "min_value": 0,
        "max_value": 10,
        "min_label": "Low",
        "max_label": "High",
    },
    {
        "step": 5,
        "section": "Investor Psychology",
        "slug": "panic_selling_tendency",
        "prompt": "Panic selling tendency",
        "question_type": "slider",
        "order": 5,
        "min_value": 0,
        "max_value": 10,
        "min_label": "Never",
        "max_label": "Very likely",
    },
]


class Command(BaseCommand):
    help = "Seed the default PhD research survey questions."

    def handle(self, *args, **options):
        created = 0
        updated = 0

        legacy_district = Question.objects.filter(slug="district_city").first()
        if legacy_district and not Question.objects.filter(slug="district").exists():
            legacy_district.slug = "district"
            legacy_district.save(update_fields=["slug"])

        for source in QUESTIONS:
            item = source.copy()
            option_payload = item.pop("options", [])
            question, was_created = Question.objects.update_or_create(
                slug=item["slug"],
                defaults=item,
            )
            question.options.all().delete()
            for index, option in enumerate(option_payload):
                if isinstance(option, tuple):
                    label, value = option
                else:
                    label, value = option, option.lower().replace(" ", "_")
                question.options.create(label=label, value=value, order=index)
            created += int(was_created)
            updated += int(not was_created)

        Question.objects.filter(slug="district_city").update(active=False, required=False)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded survey questions. Created: {created}, updated: {updated}."
            )
        )
