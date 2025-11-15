// app/api/strava/auth/route.ts
export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URL; // ex: http://localhost:3000/api/strava/callback
  const scope = "read,activity:read_all";

  if (!clientId || !redirectUri) {
    return new Response(
      "STRAVA_CLIENT_ID ou STRAVA_REDIRECT_URL não configurados.",
      { status: 500 }
    );
  }

  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", scope);

  return Response.redirect(url.toString(), 302);
}

