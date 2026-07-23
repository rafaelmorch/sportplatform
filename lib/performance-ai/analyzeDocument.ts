import readFileAsDataUrl from "./readFileAsDataUrl";
import type { AnalyzeDocumentResult } from "./types";

type AnalyzeDocumentParams = {
  type: string;
  file: File;
  notes?: string;
};

export default async function analyzeDocument({
  type,
  file,
  notes,
}: AnalyzeDocumentParams): Promise<AnalyzeDocumentResult> {
  const fileData =
    await readFileAsDataUrl(file);

  const response = await fetch(
    "/api/performance-ai/analyze-document",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        fileData,
        fileName: file.name,
        mimeType: file.type,
        notes,
      }),
    }
  );

  const result =
    await response.json();

  return result;
}
