import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rotas que podem ser acessadas sem login
const PUBLIC_PATHS = [
  "/login",
  "/about",
  "/terms",
  "/privacy",
  "/garmin-privacy",

  // rotas técnicas comuns de auth (se você usar)
  "/auth/callback",
  "/auth/confirm",
];

function isPublicPath(pathname: string) {
  // exatas
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // Next estáticos e imagens
  if (pathname.startsWith("/_next")) return true;

  // arquivos públicos comuns
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml")
    return true;

  // libera assets por extensão
  if (pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$/)) return true;

  // ⚠️ opcional: deixar APIs livres (recomendado pra integrações como Fitbit/Garmin)
  if (pathname.startsWith("/api")) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // se for rota pública, deixa passar
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // response mutável (supabase precisa setar cookies)
  let res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();

  // sem login -> redirect pro /login e guarda pra onde queria ir
  if (!data?.user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname + (search ? search : ""));
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
