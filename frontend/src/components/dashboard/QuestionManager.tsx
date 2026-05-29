"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Settings2,
  Trash2,
  X
} from "lucide-react";

import {
  createQuestion,
  deleteQuestion,
  fetchAdminQuestions,
  updateQuestion
} from "@/lib/api";
import type { Question, QuestionOption, QuestionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const questionTypes: QuestionType[] = [
  "text",
  "number",
  "multiple_choice",
  "checkbox",
  "dropdown",
  "slider"
];

const optionQuestionTypes: QuestionType[] = ["multiple_choice", "checkbox", "dropdown"];

function makeBlankQuestion(order = 1): Question {
  return {
    step: 1,
    section: "Demographic Information",
    slug: "",
    prompt: "",
    help_text: "",
    question_type: "text",
    placeholder: "",
    required: true,
    active: true,
    order,
    min_value: null,
    max_value: null,
    min_label: "",
    max_label: "",
    metadata: {},
    options: []
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function emptyOption(index: number): QuestionOption {
  return {
    label: "",
    value: "",
    score: 0,
    order: index
  };
}

function needsOptions(type: QuestionType) {
  return optionQuestionTypes.includes(type);
}

function metadataString(question: Question, key: string, fallback = "") {
  const value = question.metadata?.[key];
  return typeof value === "string" ? value : fallback;
}

function metadataNumber(question: Question, key: string, fallback = 0) {
  const value = question.metadata?.[key];
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return fallback;
}

function PreviewQuestion({ question }: { question: Question }) {
  const min = question.min_value ?? 0;
  const max = question.max_value ?? 10;

  if (question.metadata?.smartStockInput) {
    return (
      <div className="rounded-md border border-[#dfe6ff] bg-white px-3 py-3 text-sm font-semibold text-[#8993b5]">
        {question.placeholder || "Search and add investment preferences"}
      </div>
    );
  }

  if (question.question_type === "text" || question.question_type === "number") {
    return (
      <Input
        disabled
        type={question.question_type === "number" ? "number" : "text"}
        placeholder={question.placeholder || "Respondent answer"}
      />
    );
  }

  if (question.question_type === "dropdown") {
    return (
      <select
        disabled
        className="h-11 w-full rounded-md border border-[#d8defe] bg-white/90 px-3 text-sm text-[#17215a] outline-none"
      >
        <option>{question.placeholder || "Select an option"}</option>
        {question.options.map((option) => (
          <option key={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  if (question.question_type === "multiple_choice" || question.question_type === "checkbox") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled
            className="rounded-md border border-[#dfe6ff] bg-white px-4 py-3 text-left text-sm font-semibold text-[#53618f]"
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#dfe6ff] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#5f6b96]">{question.min_label || min}</span>
        <span className="rounded-full bg-[#eef3ff] px-4 py-1.5 text-sm font-black text-[#4058ff]">
          {Math.round((min + max) / 2)}
        </span>
        <span className="text-sm font-semibold text-[#5f6b96]">{question.max_label || max}</span>
      </div>
      <input
        disabled
        type="range"
        min={min}
        max={max}
        value={Math.round((min + max) / 2)}
        className="h-2 w-full accent-[#4058ff]"
        readOnly
      />
    </div>
  );
}

function SurveyPreview({ questions }: { questions: Question[] }) {
  const activeQuestions = questions
    .filter((question) => question.active)
    .sort((a, b) => a.step - b.step || a.order - b.order || (a.id ?? 0) - (b.id ?? 0));

  const steps = Array.from(new Set(activeQuestions.map((question) => question.step))).sort(
    (a, b) => a - b
  );

  if (!activeQuestions.length) {
    return (
      <div className="rounded-lg border border-[#dfe6ff] bg-[#fbfdff] p-5 text-sm font-semibold text-[#53618f]">
        No active questions are currently available for public survey preview.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {steps.map((step) => {
        const stepQuestions = activeQuestions.filter((question) => question.step === step);
        const section = stepQuestions[0]?.section ?? `Step ${step}`;

        return (
          <div key={step} className="rounded-lg border border-[#dfe6ff] bg-[#fbfdff] p-5">
            <div className="mb-5">
              <p className="text-sm font-bold uppercase text-[#4058ff]">Step {step}</p>
              <h3 className="mt-1 text-xl font-black text-[#17215a]">{section}</h3>
            </div>
            <div className="space-y-4">
              {stepQuestions.map((question) => (
                <div key={question.id ?? question.slug} className="rounded-lg bg-white/76 p-4">
                  <div className="mb-3">
                    <p className="font-bold text-[#17215a]">
                      {question.prompt}
                      {question.required && <span className="text-[#4058ff]"> *</span>}
                    </p>
                    {question.help_text && (
                      <p className="mt-1 text-sm text-[#5f6b96]">{question.help_text}</p>
                    )}
                  </div>
                  <PreviewQuestion question={question} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draft, setDraft] = useState<Question>(() => makeBlankQuestion());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const items = await fetchAdminQuestions();
      setQuestions(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return questions.filter(
      (question) =>
        question.prompt.toLowerCase().includes(q) ||
        question.slug.toLowerCase().includes(q) ||
        question.section.toLowerCase().includes(q)
    );
  }, [questions, search]);

  const resetDraft = () => {
    setEditingId(null);
    setDraft(makeBlankQuestion(questions.length + 1));
  };

  const setDraftType = (questionType: QuestionType) => {
    setDraft((current) => ({
      ...current,
      question_type: questionType,
      options:
        needsOptions(questionType)
          ? current.options.length === 0
            ? [emptyOption(0), emptyOption(1)]
            : current.options
          : []
    }));
  };

  const setMetadata = (patch: Record<string, unknown>) => {
    setDraft((current) => ({
      ...current,
      metadata: { ...(current.metadata ?? {}), ...patch }
    }));
  };

  const setOption = (index: number, patch: Partial<QuestionOption>) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              ...patch,
              value:
                patch.label !== undefined && !option.value
                  ? slugify(patch.label)
                  : patch.value ?? option.value
            }
          : option
      )
    }));
  };

  const moveOption = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.options.length) return current;

      const next = [...current.options];
      [next[index], next[target]] = [next[target], next[index]];

      return {
        ...current,
        options: next.map((option, optionIndex) => ({ ...option, order: optionIndex }))
      };
    });
  };

  const save = async () => {
    if (!draft.prompt.trim() || !draft.slug.trim()) {
      setMessage("Question prompt and slug are required.");
      return;
    }

    if (needsOptions(draft.question_type) && draft.options.filter((option) => option.label.trim()).length === 0) {
      setMessage("This question type needs at least one option.");
      return;
    }

    setSaving(true);
    setMessage("");
    const payload = {
      ...draft,
      slug: slugify(draft.slug),
      options: draft.options
        .filter((option) => option.label.trim())
        .map((option, index) => ({
          ...option,
          value: option.value || slugify(option.label),
          score: Number(option.score ?? 0),
          order: index
        }))
    };

    try {
      if (editingId) {
        await updateQuestion({ ...payload, id: editingId });
        setMessage("Question updated and synced to the survey.");
      } else {
        await createQuestion(payload);
        setMessage("Question added and synced to the survey.");
      }
      resetDraft();
      await load();
    } catch {
      setMessage("Question could not be saved. Check for duplicate slugs or invalid values.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (question: Question) => {
    setEditingId(question.id ?? null);
    setDraft({
      ...question,
      metadata: question.metadata ?? {},
      options: question.options.length ? question.options : []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicate = async (question: Question) => {
    const baseSlug = `${question.slug}_copy`;
    let nextSlug = baseSlug;
    let index = 2;

    while (questions.some((item) => item.slug === nextSlug)) {
      nextSlug = `${baseSlug}_${index}`;
      index += 1;
    }

    setSaving(true);
    setMessage("");
    try {
      await createQuestion({
        ...question,
        id: undefined,
        slug: nextSlug,
        prompt: `${question.prompt} (copy)`,
        order: question.order + 1,
        active: false,
        metadata: question.metadata ?? {},
        options: question.options.map((option, optionIndex) => ({
          label: option.label,
          value: option.value,
          score: Number(option.score ?? 0),
          order: optionIndex
        }))
      });
      setMessage("Question duplicated as an inactive draft.");
      await load();
    } catch {
      setMessage("Question could not be duplicated.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (question: Question) => {
    if (!question.id) return;
    await deleteQuestion(question.id);
    if (editingId === question.id) resetDraft();
    await load();
  };

  const move = async (question: Question, direction: -1 | 1) => {
    const sameStep = questions
      .filter((item) => item.step === question.step)
      .sort((a, b) => a.order - b.order);
    const index = sameStep.findIndex((item) => item.id === question.id);
    const swap = sameStep[index + direction];
    if (!swap) return;
    await updateQuestion({ ...question, order: swap.order });
    await updateQuestion({ ...swap, order: question.order });
    await load();
  };

  const scoreDirection = metadataString(draft, "scoreDirection", "positive");
  const scoreWeight = metadataNumber(draft, "scoreWeight", 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-[#4058ff]">
                Dynamic Questionnaire Builder
              </p>
              <CardTitle className="mt-2">{editingId ? "Edit Question" : "Add Question"}</CardTitle>
            </div>
            {editingId && (
              <Button type="button" variant="secondary" size="sm" onClick={resetDraft}>
                <X size={16} /> Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 size={17} className="text-[#4058ff]" />
              <p className="text-sm font-bold uppercase text-[#53618f]">Question settings</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-[#53618f]">Step Assignment</span>
                <Input
                  type="number"
                  min={1}
                  value={draft.step}
                  onChange={(event) => setDraft({ ...draft, step: Number(event.target.value) })}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-[#53618f]">Question Order</span>
                <Input
                  type="number"
                  min={0}
                  value={draft.order}
                  onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })}
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-bold text-[#53618f]">Section Assignment</span>
                <Input
                  value={draft.section}
                  onChange={(event) => setDraft({ ...draft, section: event.target.value })}
                />
              </label>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#53618f]">Question</span>
            <Input
              value={draft.prompt}
              onChange={(event) => {
                const prompt = event.target.value;
                setDraft((current) => ({
                  ...current,
                  prompt,
                  slug: current.slug && editingId ? current.slug : slugify(prompt)
                }));
              }}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-[#53618f]">Slug</span>
              <Input
                value={draft.slug}
                onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-[#53618f]">Question Type</span>
              <select
                value={draft.question_type}
                onChange={(event) => setDraftType(event.target.value as QuestionType)}
                className="h-11 w-full rounded-md border border-[#d8defe] bg-white/90 px-3 text-sm text-[#17215a] outline-none"
              >
                {questionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#53618f]">Placeholder</span>
            <Input
              value={draft.placeholder ?? ""}
              onChange={(event) => setDraft({ ...draft, placeholder: event.target.value })}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#53618f]">Help Text</span>
            <textarea
              value={draft.help_text ?? ""}
              onChange={(event) => setDraft({ ...draft, help_text: event.target.value })}
              className="min-h-24 w-full rounded-md border border-[#d8defe] bg-white/90 px-3 py-3 text-sm text-[#17215a] outline-none transition focus:border-[#7d8dff] focus:ring-4 focus:ring-[#dfe5ff]"
              placeholder="Optional guidance shown below the question"
            />
          </label>

          {(draft.question_type === "slider" || draft.question_type === "number") && (
            <div className="grid gap-4 rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-4 sm:grid-cols-2">
              <Input
                type="number"
                placeholder="Minimum value"
                value={draft.min_value ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    min_value: event.target.value === "" ? null : Number(event.target.value)
                  })
                }
              />
              <Input
                type="number"
                placeholder="Maximum value"
                value={draft.max_value ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    max_value: event.target.value === "" ? null : Number(event.target.value)
                  })
                }
              />
              {draft.question_type === "slider" && (
                <>
                  <Input
                    placeholder="Minimum label"
                    value={draft.min_label ?? ""}
                    onChange={(event) => setDraft({ ...draft, min_label: event.target.value })}
                  />
                  <Input
                    placeholder="Maximum label"
                    value={draft.max_label ?? ""}
                    onChange={(event) => setDraft({ ...draft, max_label: event.target.value })}
                  />
                </>
              )}
            </div>
          )}

          <div className="grid gap-4 rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-[#53618f]">Numeric Score Weight</span>
              <Input
                type="number"
                value={scoreWeight}
                onChange={(event) => setMetadata({ scoreWeight: Number(event.target.value) })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-[#53618f]">Score Direction</span>
              <select
                value={scoreDirection}
                onChange={(event) => setMetadata({ scoreDirection: event.target.value })}
                className="h-11 w-full rounded-md border border-[#d8defe] bg-white/90 px-3 text-sm text-[#17215a] outline-none"
              >
                <option value="positive">Higher answer increases score</option>
                <option value="negative">Higher answer decreases score</option>
              </select>
            </label>
          </div>

          {needsOptions(draft.question_type) && (
            <div className="space-y-3 rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[#53618f]">Dynamic Options and Scores</p>
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      options: [...current.options, emptyOption(current.options.length)]
                    }))
                  }
                >
                  <Plus size={15} /> Add Option
                </Button>
              </div>
              {draft.options.map((option, index) => (
                <div key={option.id ?? `${option.value}-${index}`} className="grid gap-2 lg:grid-cols-[1.1fr_1fr_0.7fr_auto]">
                  <Input
                    placeholder="Label"
                    value={option.label}
                    onChange={(event) => setOption(index, { label: event.target.value })}
                  />
                  <Input
                    placeholder="Value"
                    value={option.value}
                    onChange={(event) => setOption(index, { value: slugify(event.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder="Score"
                    value={option.score ?? 0}
                    onChange={(event) => setOption(index, { score: Number(event.target.value) })}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label="Move option up"
                      disabled={index === 0}
                      onClick={() => moveOption(index, -1)}
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label="Move option down"
                      disabled={index === draft.options.length - 1}
                      onClick={() => moveOption(index, 1)}
                    >
                      <ArrowDown size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="icon"
                      aria-label="Remove option"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          options: current.options
                            .filter((_, optionIndex) => optionIndex !== index)
                            .map((item, optionIndex) => ({ ...item, order: optionIndex }))
                        }))
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm font-bold text-[#53618f]">
              <input
                type="checkbox"
                checked={draft.required}
                onChange={(event) => setDraft({ ...draft, required: event.target.checked })}
              />
              Required
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-[#53618f]">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Active in public survey
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-[#53618f]">
              <input
                type="checkbox"
                checked={Boolean(draft.metadata?.smartStockInput)}
                onChange={(event) => setMetadata({ smartStockInput: event.target.checked })}
              />
              Smart stock input
            </label>
          </div>

          {message && (
            <div
              className={cn(
                "rounded-md px-4 py-3 text-sm font-semibold",
                message.includes("could not") || message.includes("required") || message.includes("needs")
                  ? "border border-[#ffd6e2] bg-[#fff3f7] text-[#b32255]"
                  : "border border-[#c8f4e2] bg-[#effcf7] text-[#11835b]"
              )}
            >
              {message}
            </div>
          )}

          <Button type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            {editingId ? "Update Question" : "Add Question"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-[#4058ff]">Question Bank</p>
              <CardTitle className="mt-2">Active and Draft Survey Questions</CardTitle>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => setPreviewOpen((value) => !value)}>
                {previewOpen ? <EyeOff size={16} /> : <Eye size={16} />}
                {previewOpen ? "Hide Preview" : "Preview Survey"}
              </Button>
              <Input
                className="sm:max-w-xs"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions..."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid h-64 place-items-center text-[#53618f]">
              <Loader2 className="mb-3 animate-spin" />
              Loading questions...
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((question) => (
                <div
                  key={question.id}
                  className="rounded-lg border border-[#dfe6ff] bg-[#fbfdff] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-bold text-[#4058ff]">
                          Step {question.step}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#69749e]">
                          Order {question.order}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold",
                            question.active
                              ? "bg-[#effcf7] text-[#11835b]"
                              : "bg-[#f0f2f8] text-[#69749e]"
                          )}
                        >
                          {question.active ? "Active" : "Inactive"}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#69749e]">
                          {question.question_type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="font-bold text-[#17215a]">{question.prompt}</p>
                      <p className="mt-1 text-sm text-[#69749e]">{question.section} | {question.slug}</p>
                      {question.options.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {question.options.map((option) => (
                            <span
                              key={option.value}
                              className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#53618f]"
                            >
                              {option.label}: {option.score ?? 0}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="icon" aria-label="Move up" onClick={() => move(question, -1)}>
                        <ArrowUp size={16} />
                      </Button>
                      <Button type="button" variant="secondary" size="icon" aria-label="Move down" onClick={() => move(question, 1)}>
                        <ArrowDown size={16} />
                      </Button>
                      <Button type="button" variant="soft" size="sm" onClick={() => edit(question)}>
                        <Edit3 size={16} /> Edit
                      </Button>
                      <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => duplicate(question)}>
                        <Copy size={16} /> Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant={question.active ? "secondary" : "default"}
                        size="sm"
                        onClick={() => updateQuestion({ ...question, active: !question.active }).then(load)}
                      >
                        {question.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button type="button" variant="danger" size="icon" aria-label="Delete question" onClick={() => remove(question)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {previewOpen && (
        <Card className="xl:col-span-2">
          <CardHeader>
            <p className="text-sm font-bold uppercase text-[#4058ff]">Survey Preview Mode</p>
            <CardTitle className="mt-2">Active public questionnaire preview</CardTitle>
            <p className="text-sm leading-6 text-[#5f6b96]">
              This preview reflects questions currently marked active. Deactivated duplicate
              drafts stay in the bank until the researcher publishes them by activating.
            </p>
          </CardHeader>
          <CardContent>
            <SurveyPreview questions={questions} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
