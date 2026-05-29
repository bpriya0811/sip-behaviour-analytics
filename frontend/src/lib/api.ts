import type { AnalyticsSummary, BehaviourResult, Question, SurveyAnswers } from "@/lib/types";

function resolveApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
  const trimmed = configured.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export const API_BASE = resolveApiBase();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchQuestions() {
  return request<Question[]>("/questions/");
}

export function fetchAdminQuestions() {
  return request<Question[]>("/admin/questions/");
}

export function createQuestion(question: Question) {
  return request<Question>("/admin/questions/", {
    method: "POST",
    body: JSON.stringify(question)
  });
}

export function updateQuestion(question: Question) {
  return request<Question>(`/admin/questions/${question.id}/`, {
    method: "PUT",
    body: JSON.stringify(question)
  });
}

export function deleteQuestion(id: number) {
  return fetch(`${API_BASE}/admin/questions/${id}/`, { method: "DELETE" });
}

export function submitSurvey(answers: SurveyAnswers) {
  return request<{ result: BehaviourResult }>("/responses/", {
    method: "POST",
    body: JSON.stringify({ answers })
  });
}

export function fetchAnalytics(filters?: { district?: string; taluka?: string }) {
  const params = new URLSearchParams();
  if (filters?.district) params.set("district", filters.district);
  if (filters?.taluka) params.set("taluka", filters.taluka);
  const query = params.toString();
  return request<AnalyticsSummary>(`/analytics/summary/${query ? `?${query}` : ""}`);
}

export function exportUrl(
  kind: "csv" | "excel" | "pdf",
  filters?: { district?: string; taluka?: string }
) {
  const params = new URLSearchParams();
  if (filters?.district) params.set("district", filters.district);
  if (filters?.taluka) params.set("taluka", filters.taluka);
  const query = params.toString();
  return `${API_BASE}/exports/${kind}/${query ? `?${query}` : ""}`;
}
