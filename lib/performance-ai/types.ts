export interface AnalyzeDocumentResult {
  success: boolean;
  error?: string;

  extractedData?: Record<
    string,
    unknown
  >;

  performanceInsights?: unknown;
  nutritionInsights?: unknown;
  attentionPoints?: unknown;
  healthInsights?: unknown;
  trainingInsights?: unknown;
  insights?: unknown;

  summary?: string;

  [key: string]: unknown;
}
