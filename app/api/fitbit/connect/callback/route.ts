import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ garante Buffer disponível (Node runtime)
export const runtime = "nodejs";

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID!;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET!;
const FITBIT_REDIRECT_URL = process.env.FITBIT_REDIRECT_URL!;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

type FitbitTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // segundos
  token_type: string;
  user_id: string; // id do usuário na Fitbit
  scope?: string;
};

function isUuid(v: string) {
  return /^[0-9a-fA-F-]{36}$/.test(v);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") ?? null; // UUID (site) ou token (app)
    const error = searchParams.get("error");

    if (error) {
      console.error("Erro retornado pelo Fitbit:", error);
      return NextResponse.json(
        { message: "Erro retornado pelo Fitbit.", error },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { message: "Code não recebido do Fitbit." },
        { status: 400 }
      );
    }

    // 1) Trocar code por tokens na Fitbit
    const basicAuth = Buffer.from(
      `${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: FITBIT_REDIRECT_URL,
      }),
    });

    const tokenJson = (await tokenRes.json()) as FitbitTokenResponse & {
      [key: string]: any;
    };

    if (!tokenRes.ok) {
      console.error("Erro Fitbit /oauth2/token:", tokenJson);
      return NextResponse.json(
        {
          message: "Erro ao trocar o code pelo token no Fitbit.",
          fitbit_error: tokenJson,
        },
        { status: 400 }
      );
    }

    const {
      access_token,
      refresh_token,
      expires_in,
      token_type,
      user_id: fitbitUserId,
      scope,
    } = tokenJson;

    if (!fitbitUserId) {
      return NextResponse.json(
        { message: "Resposta do Fitbit sem user_id." },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expires_in * 1000);

    // 2) Resolver user_id do Supabase:
    //    - se state for UUID: comportamento do site (mantido)
    //    - se state for token: buscar em oauth_states (modo app)
    let userId: string | null = null;

    if (state) {
      if (isUuid(state)) {
        userId = state; // ✅ site antigo
      } else {
        // ✅ modo app: state é token curto, resolve em oauth_states
        const { data: row, error: stateErr } = await supabaseAdmin
          .from("oauth_states")
          .select("user_id, expires_at")
          .eq("provider", "fitbit")
          .eq("state", state)
          .maybeSingle();

        if (stateErr) {
          console.error("Erro ao buscar oauth_states (fitbit):", stateErr);
        } else if (row) {
          const exp = new Date(row.expires_at).getTime();
          if (exp > Date.now()) {
            userId = row.user_id;

            // one-time-use
            await supabaseAdmin
              .from("oauth_states")
              .delete()
              .eq("provider", "fitbit")
              .eq("state", state);
          } else {
            console.warn("oauth_state expirado (fitbit):", state);
          }
        } else {
          console.warn("oauth_state não encontrado (fitbit):", state);
        }
      }
    }

    // 3) Salvar tokens no Supabase
    const { error: dbError } = await supabaseAdmin
      .from("fitbit_tokens")
      .upsert(
        {
          fitbit_user_id: fitbitUserId,
          user_id: userId,
          access_token,
          refresh_token,
          token_type: token_type ?? "Bearer",
          scope,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "fitbit_user_id" }
      );

    if (dbError) {
      console.error("Erro ao salvar tokens Fitbit no Supabase:", dbError);
      return NextResponse.json(
        {
          message:
            "Conexão com Fitbit feita, mas houve erro ao salvar os tokens.",
          dbError,
        },
        { status: 500 }
      );
    }

    // 4) Redirect final
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

    const redirectUrl = new URL("/integrations", baseUrl);
    redirectUrl.searchParams.set("provider", "fitbit");
    redirectUrl.searchParams.set("status", "success");
    redirectUrl.searchParams.set("fitbit_user_id", fitbitUserId);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Erro inesperado no callback do Fitbit:", err);
    return NextResponse.json(
      { message: "Erro inesperado no callback do Fitbit." },
      { status: 500 }
    );
  }
}
