from __future__ import annotations

from collections.abc import Iterable
from typing import Any


def _number(value: Any, default: float = 0) -> float:
    try:
        if isinstance(value, list):
            value = value[0] if value else default
        if value in ("", None):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _text(value: Any) -> str:
    if isinstance(value, list):
        return ",".join(str(item) for item in value)
    if value is None:
        return ""
    return str(value)


def _dynamic_question_score(answers: dict[str, Any], questions: Iterable[Any] | None) -> float:
    if not questions:
        return 0

    score = 0.0
    for question in questions:
        value = answers.get(getattr(question, "slug", ""))
        if value in ("", None, []):
            continue

        options = getattr(question, "options", None)
        if options is not None:
            option_scores = {option.value: option.score for option in options.all()}
            if isinstance(value, list):
                score += sum(option_scores.get(str(item), 0) for item in value)
            else:
                score += option_scores.get(str(value), 0)

        metadata = getattr(question, "metadata", {}) or {}
        weight = _number(metadata.get("scoreWeight"), default=0)
        if weight and getattr(question, "question_type", "") in {"number", "slider"}:
            numeric = _number(value, default=0)
            minimum = getattr(question, "min_value", None)
            maximum = getattr(question, "max_value", None)
            minimum = 0 if minimum is None else minimum
            maximum = 10 if maximum is None else maximum
            span = max(1, maximum - minimum)
            normalized = max(0, min(1, (numeric - minimum) / span))
            if metadata.get("scoreDirection") == "negative":
                normalized = 1 - normalized
            score += normalized * weight

    return score


def calculate_behaviour(
    answers: dict[str, Any], questions: Iterable[Any] | None = None
) -> dict[str, Any]:
    score = 50.0

    score += {
        "invest_more": 15,
        "hold": 10,
        "wait": 2,
        "withdraw": -15,
    }.get(_text(answers.get("reaction_market_crash")), 0)

    score += {
        "increase": 15,
        "continue": 12,
        "reduce": -4,
        "stop": -15,
    }.get(_text(answers.get("continue_sip_volatility")), 0)

    score += {
        "rebalance": 8,
        "continue": 10,
        "pause": -6,
        "exit": -14,
    }.get(_text(answers.get("bear_market_reaction")), 0)

    score += {
        "calm": 10,
        "concerned": 2,
        "anxious": -8,
        "panic": -14,
    }.get(_text(answers.get("emotional_losses")), 0)

    score += {
        "0-1": 0,
        "1-3": 4,
        "3-5": 8,
        "5+": 12,
    }.get(_text(answers.get("sip_duration")), 0)

    score += {
        "wealth_creation": 8,
        "retirement": 10,
        "children_education": 7,
        "tax_saving": 3,
        "short_term": -3,
    }.get(_text(answers.get("investment_goal")), 0)

    fear = _number(answers.get("fear_during_losses"))
    patience = _number(answers.get("patience_level"))
    risk = _number(answers.get("risk_appetite"))
    panic_selling = _number(answers.get("panic_selling_tendency"))

    score -= fear * 1.2
    score += patience * 1.2
    score -= panic_selling * 1.5

    if 4 <= risk <= 7:
        score += 6
    elif risk > 7:
        score += 4
    elif risk <= 3:
        score -= 2

    score += _dynamic_question_score(answers, questions)

    score = max(0, min(100, round(score, 1)))

    duration = _text(answers.get("sip_duration"))
    continuation = _text(answers.get("continue_sip_volatility"))

    if (panic_selling >= 7 or fear >= 7) and score < 60:
        investor_type = "Emotional Investor"
        summary = (
            "Your responses suggest market declines may trigger strong emotional "
            "reactions. A rules-based SIP plan and review discipline may help "
            "reduce panic decisions during volatility."
        )
    elif score >= 78 and duration == "5+" and continuation in {"continue", "increase"}:
        investor_type = "Rational Long-Term Investor"
        summary = (
            "Your behaviour shows patience, SIP continuity, and a long-term bias. "
            "This profile is generally better positioned to benefit from volatility "
            "through disciplined rupee-cost averaging."
        )
    elif risk >= 8 and score >= 60:
        investor_type = "Aggressive Investor"
        summary = (
            "You appear comfortable with risk and may continue investing through "
            "large price swings. Periodic portfolio review can help keep ambition "
            "aligned with diversification."
        )
    elif risk <= 3:
        investor_type = "Conservative Investor"
        summary = (
            "Your answers show a preference for stability and controlled risk. SIPs "
            "with clear goals and low review anxiety may support steadier decisions."
        )
    elif score >= 50:
        investor_type = "Moderate Investor"
        summary = (
            "Your profile balances caution and opportunity. You may respond well to "
            "goal-based SIP planning, measured risk exposure, and regular reviews."
        )
    else:
        investor_type = "Emotional Investor"
        summary = (
            "Your responses indicate sensitivity to losses and volatility. Predefined "
            "decision rules can help separate market noise from long-term objectives."
        )

    return {
        "score": score,
        "risk_score": max(0, min(10, risk)),
        "investor_type": investor_type,
        "summary": summary,
    }
