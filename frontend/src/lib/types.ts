export type QuestionType =
  | "text"
  | "number"
  | "multiple_choice"
  | "checkbox"
  | "dropdown"
  | "slider";

export type QuestionOption = {
  id?: number;
  label: string;
  value: string;
  score?: number;
  order?: number;
};

export type Question = {
  id?: number;
  step: number;
  section: string;
  slug: string;
  prompt: string;
  help_text?: string;
  question_type: QuestionType;
  placeholder?: string;
  required: boolean;
  active: boolean;
  order: number;
  min_value?: number | null;
  max_value?: number | null;
  min_label?: string;
  max_label?: string;
  metadata?: Record<string, unknown>;
  options: QuestionOption[];
};

export type SurveyAnswers = Record<string, string | number | string[]>;

export type BehaviourResult = {
  score: number;
  risk_score: number;
  investor_type: string;
  summary: string;
};

export type GeographyOptions = {
  districts: string[];
  talukasByDistrict: Record<string, string[]>;
  villagesByDistrictTaluka: Record<string, Record<string, string[]>>;
};

export type GeographicDataPoint = {
  name: string;
  value: number;
  percentage: number;
  district?: string;
  rank?: number;
};

export type AnalyticsSummary = {
  overview: {
    totalRespondents: number;
    averageSipAmount: number;
    mostMentionedStock: string;
    averageRiskScore: number;
  };
  charts: {
    ageVsSip: { age: number; sip: number }[];
    riskDistribution: { name: string; value: number }[];
    mostMentionedStocks: { name: string; value: number }[];
    marketCrashReaction: { name: string; value: number }[];
    sipContinuation: { name: string; value: number }[];
    investmentGoals: { name: string; value: number }[];
    behaviourCategories: { name: string; value: number }[];
  };
  geography: {
    summary: {
      totalResponses: number;
      kolhapurResponses: number;
      sangliResponses: number;
      mostRepresentedTaluka: string;
      leastRepresentedTaluka: string;
      talukasCovered: number;
      talukasTotal: number;
    };
    districtDistribution: GeographicDataPoint[];
    talukaDistribution: GeographicDataPoint[];
    options: {
      districts: string[];
      talukasByDistrict: Record<string, string[]>;
    };
  };
  filters: {
    district: string;
    taluka: string;
  };
};
