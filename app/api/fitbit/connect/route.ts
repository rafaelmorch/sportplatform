import { NextRequest, NextResponse } from "next/server";

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_REDIRECT_URL = process.env.FITBIT_REDIRECT_URL!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") ?? "";

    const scope = [
      "activity",
      "heartrate",
      "location",
      "profile",
      "settings",
      "sleep",
      "social",
      "weight",
    ].join(" ");

    const authUrl = new URL("https://www.fitbit.com/oauth2/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", FITBIT_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", FITBIT_REDIRECT_URL);
    authUrl.searchParams.set("scope", scope);

    if (state) authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("Erro ao iniciar conexão com Fitbit:", err);
    return NextResponse.json(
      { message: "Erro ao iniciar conexão com Fitbit." },
      { status: 500 }
    );
  }
}
