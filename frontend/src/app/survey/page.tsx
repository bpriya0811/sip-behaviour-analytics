"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Send, X } from "lucide-react";

import { fetchQuestions, submitSurvey } from "@/lib/api";
import { talukasForDistrict } from "@/lib/geography";
import type { BehaviourResult, Question, QuestionOption, SurveyAnswers } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const stockSuggestions = [
  "Reliance Industries",
  "HDFC Bank",
  "ICICI Bank",
  "Infosys",
  "Tata Consultancy Services",
  "Larsen & Toubro",
  "Bharti Airtel",
  "State Bank of India",
  "Kotak Mahindra Bank",
  "Axis Bank",
  "Hindustan Unilever",
  "ITC",
  "Nifty 50 Index Fund",
  "Sensex Index Fund",
  "SBI Bluechip Fund",
  "Mirae Asset Large Cap Fund",
  "ICICI Prudential Bluechip Fund",
  "HDFC Top 100 Fund"
];

function getDefaultAnswer(question: Question) {
  if (question.question_type === "slider") {
    const min = question.min_value ?? 0;
    const max = question.max_value ?? 10;
    return Math.round((min + max) / 2);
  }
  if (question.question_type === "checkbox" || question.metadata?.smartStockInput) {
    return [];
  }
  return "";
}

function dependencySlug(question: Question) {
  const configured = question.metadata?.dependsOn;
  if (typeof configured === "string") return configured;
  return question.slug === "taluka" ? "district" : "";
}

function optionFromLabel(label: string): QuestionOption {
  return { label, value: label };
}

function dependentOptions(question: Question, answers: SurveyAnswers) {
  const dependsOn = dependencySlug(question);
  if (!dependsOn) return question.options;

  const parentValue = answers[dependsOn];
  const parent = typeof parentValue === "string" ? parentValue : "";
  if (!parent) return [];

  const grouped = question.metadata?.optionsByDistrict;
  if (grouped && typeof grouped === "object" && !Array.isArray(grouped)) {
    const values = (grouped as Record<string, unknown>)[parent];
    if (Array.isArray(values)) {
      return values.map((item) => optionFromLabel(String(item)));
    }
  }

  if (question.slug === "taluka") {
    return talukasForDistrict(parent).map(optionFromLabel);
  }

  return question.options;
}

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-2.5 flex-1 rounded-full bg-[#dfe6ff] transition",
            index + 1 <= step && "bg-[#4058ff]"
          )}
        />
      ))}
    </div>
  );
}

function StockTagInput({
  value,
  onChange,
  placeholder
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = stockSuggestions
    .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => !value.some((selected) => selected.toLowerCase() === item.toLowerCase()))
    .slice(0, 6);

  const add = (item: string) => {
    const clean = item.trim();
    if (!clean) return;
    if (!value.some((selected) => selected.toLowerCase() === clean.toLowerCase())) {
      onChange([...value, clean]);
    }
    setQuery("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          placeholder={placeholder}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(query);
            }
          }}
        />
        <Button type="button" variant="soft" size="icon" onClick={() => add(query)} aria-label="Add">
          <Plus size={18} />
        </Button>
      </div>
      {query && filtered.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => add(suggestion)}
              className="rounded-md border border-[#dfe6ff] bg-white px-3 py-2 text-left text-sm font-medium text-[#4058ff] transition hover:bg-[#eef3ff]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-1.5 text-sm font-semibold text-[#4058ff]"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              aria-label={`Remove ${tag}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  answers
}: {
  question: Question;
  value: string | number | string[];
  onChange: (value: string | number | string[]) => void;
  answers: SurveyAnswers;
}) {
  if (question.metadata?.smartStockInput) {
    return (
      <StockTagInput
        value={Array.isArray(value) ? value : []}
        placeholder={question.placeholder}
        onChange={onChange}
      />
    );
  }

  if (question.question_type === "text" || question.question_type === "number") {
    return (
      <Input
        type={question.question_type === "number" ? "number" : "text"}
        min={question.min_value ?? undefined}
        max={question.max_value ?? undefined}
        value={typeof value === "string" || typeof value === "number" ? value : ""}
        placeholder={question.placeholder}
        onChange={(event) =>
          onChange(
            question.question_type === "number" ? Number(event.target.value) : event.target.value
          )
        }
      />
    );
  }

  if (question.question_type === "dropdown") {
    const dependsOn = dependencySlug(question);
    const parentValue = dependsOn ? answers[dependsOn] : "";
    const options = dependentOptions(question, answers);
    const disabled = Boolean(dependsOn && !parentValue);

    return (
      <select
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 w-full rounded-md border border-[#d8defe] bg-white/90 px-3 text-sm text-[#17215a] outline-none transition focus:border-[#7d8dff] focus:ring-4 focus:ring-[#dfe5ff]",
          disabled && "cursor-not-allowed bg-[#f3f6ff] text-[#8993b5]"
        )}
      >
        <option value="">
          {disabled
            ? String(question.metadata?.dependentPlaceholder ?? "Select district first")
            : "Select an option"}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (question.question_type === "multiple_choice") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-h-14 items-center justify-between rounded-md border bg-white px-4 py-3 text-left text-sm font-semibold transition",
                selected
                  ? "border-[#4058ff] bg-[#eef3ff] text-[#4058ff]"
                  : "border-[#dfe6ff] text-[#26336e] hover:border-[#9aa7ff]"
              )}
            >
              {option.label}
              {selected && <Check size={17} />}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.question_type === "checkbox") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(
                  active
                    ? selected.filter((item) => item !== option.value)
                    : [...selected, option.value]
                )
              }
              className={cn(
                "rounded-md border px-4 py-3 text-left text-sm font-semibold transition",
                active
                  ? "border-[#4058ff] bg-[#eef3ff] text-[#4058ff]"
                  : "border-[#dfe6ff] bg-white text-[#26336e] hover:border-[#9aa7ff]"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  const min = question.min_value ?? 0;
  const max = question.max_value ?? 10;
  const numberValue = Number(value ?? Math.round((min + max) / 2));

  return (
    <div className="rounded-lg border border-[#dfe6ff] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#5f6b96]">{question.min_label || min}</span>
        <span className="rounded-full bg-[#eef3ff] px-4 py-1.5 text-sm font-black text-[#4058ff]">
          {numberValue}
        </span>
        <span className="text-sm font-semibold text-[#5f6b96]">{question.max_label || max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={numberValue}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[#4058ff]"
      />
    </div>
  );
}

function ResultView({ result }: { result: BehaviourResult }) {
  return (
    <main className="min-h-screen bg-mesh-light px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4058ff]">
          <ArrowLeft size={16} /> Home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-lg border border-white/80 bg-white/82 p-7 text-center shadow-fintech backdrop-blur-xl"
        >
          <p className="text-sm font-bold uppercase text-[#4058ff]">Thank you</p>
          <h1 className="mt-3 text-3xl font-black text-[#17215a] sm:text-3xl">
            Your response has been successfully recorded.
          </h1>
          <div className="mx-auto mt-8 max-w-2xl">
            <p className="text-2xl font-semibold leading-10 text-[#53618f]">
              {result.summary}
            </p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
            <Button
                variant="secondary"
                onClick={() => {
                  window.location.href = "/survey";
                }}
              >
                Start New Survey
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function SurveyPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BehaviourResult | null>(null);

  useEffect(() => {
    fetchQuestions()
      .then((items) => {
        setQuestions(items);
        setAnswers((current) => {
          const next = { ...current };
          items.forEach((question) => {
            if (next[question.slug] === undefined) {
              next[question.slug] = getDefaultAnswer(question);
            }
          });
          return next;
        });
      })
      .catch(() => setError("The survey could not load. Please make sure the backend is running."))
      .finally(() => setLoading(false));
  }, []);

  const steps = useMemo(
    () => Array.from(new Set(questions.map((question) => question.step))).sort((a, b) => a - b),
    [questions]
  );
  const totalSteps = steps.length || 5;
  const stepQuestions = questions.filter((question) => question.step === step);
  const section = stepQuestions[0]?.section ?? "Research Survey";

  const isStepComplete = stepQuestions.every((question) => {
    if (!question.required) return true;
    const value = answers[question.slug];
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value !== undefined && value !== null;
  });

  const handleAnswerChange = (question: Question, value: string | number | string[]) => {
    setAnswers((current) => {
      const next = { ...current, [question.slug]: value };
      questions.forEach((candidate) => {
        if (dependencySlug(candidate) === question.slug) {
          next[candidate.slug] = getDefaultAnswer(candidate);
        }
      });
      return next;
    });
  };

  const goNext = () => {
    if (!isStepComplete) {
      setError("Please complete the required fields in this step.");
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, totalSteps));
  };

  const handleSubmit = async () => {
    if (!isStepComplete) {
      setError("Please complete the required fields before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await submitSurvey(answers);
      setResult(response.result);
    } catch {
      setError("Submission failed. Please check that the backend is running and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) return <ResultView result={result} />;

  return (
    <main className="min-h-screen bg-mesh-light px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4058ff]">
            <ArrowLeft size={16} /> Home
          </Link>
          <span className="rounded-full bg-white/75 px-4 py-2 text-sm font-bold text-[#53618f] shadow-sm">
            Step {step} of {totalSteps}
          </span>
        </div>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#4058ff] via-[#a6a5ff] to-[#76e5ff]" />
          <CardHeader className="pb-4">
            <ProgressDots step={step} total={totalSteps} />
            <div className="pt-5">
              <p className="text-sm font-bold uppercase text-[#4058ff]">Investor Data Collection</p>
              <CardTitle className="mt-2 text-3xl font-black">{section}</CardTitle>
              <p className="mt-2 text-[#5f6b96]">
                Your responses are used only for research analysis. No login is required.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid min-h-64 place-items-center text-[#53618f]">
                <Loader2 className="mb-3 animate-spin" />
                Loading research survey...
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {stepQuestions.map((question) => (
                    <div key={question.slug} className="rounded-lg border border-[#e0e7ff] bg-[#fbfdff] p-5">
                      <div className="mb-3">
                        <label className="text-base font-bold text-[#17215a]">
                          {question.prompt}
                        </label>
                        {question.help_text && (
                          <p className="mt-1 text-sm text-[#5f6b96]">{question.help_text}</p>
                        )}
                      </div>
                      <QuestionField
                        question={question}
                        value={answers[question.slug] ?? getDefaultAnswer(question)}
                        answers={answers}
                        onChange={(value) => handleAnswerChange(question, value)}
                      />
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {error && (
              <div className="mt-5 rounded-md border border-[#ffd6e2] bg-[#fff3f7] px-4 py-3 text-sm font-semibold text-[#b32255]">
                {error}
              </div>
            )}

            <div className="mt-7 flex flex-col justify-between gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                disabled={step === 1 || loading}
                onClick={() => {
                  setError("");
                  setStep((current) => Math.max(1, current - 1));
                }}
              >
                <ArrowLeft size={17} /> Previous
              </Button>
              {step < totalSteps ? (
                <Button type="button" disabled={loading} onClick={goNext}>
                  Next <ArrowRight size={17} />
                </Button>
              ) : (
                <Button type="button" disabled={loading || submitting} onClick={handleSubmit}>
                  {submitting ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                  Submit Research Response
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
