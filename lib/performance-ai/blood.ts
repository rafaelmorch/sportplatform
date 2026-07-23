export interface BloodExtractedData {
  exam_date?: string | null;
  hemoglobin?: number | null;
  ferritin?: number | null;
  vitamin_d?: number | null;
  glucose?: number | null;
  total_cholesterol?: number | null;
  hdl?: number | null;
  ldl?: number | null;
  triglycerides?: number | null;
  tsh?: number | null;
  creatinine?: number | null;
}

export interface BloodAnalysis {
  summary?: string;
  documentType?: "blood_test";
  extractedData: BloodExtractedData;
  performanceInsights?: string[];
  nutritionInsights?: string[];
  attentionPoints?: string[];
  disclaimer?: string;
}