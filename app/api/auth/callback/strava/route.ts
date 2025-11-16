import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  console.log("Strava callback =>", { code, error });

  return new NextResponse(
    `Strava callback recebido.
code: ${code ?? "nenhum"}
error: ${error ?? "nenhum"}`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
}
