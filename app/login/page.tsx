"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import BottomNavbar from "@/components/BottomNavbar";

// ================= SUPABASE =================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ================= AUTH STATE =================
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/intro");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // ================= GOOGLE LOGIN =================
  async function handleGoogleLogin() {
    try {
      setErrorMsg(null);
      setLoading(true);

      const redirectTo =
        "https://www.sportsplatform.app/mobile/auth/callback";

      const { data, error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

      if (error) {
        throw error;
      }

      if (!data.url) {
        throw new Error(
          "O Google não retornou a página de login."
        );
      }

      const { Browser } =
        await import("@capacitor/browser");

      await Browser.open({
        url: data.url,
      });
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar com o Google."
      );
      setLoading(false);
    }
  }
  // ================= EMAIL LOGIN =================
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          height: 100%;
          overflow: hidden;
          background: #000;
        }
      `}</style>

      <main
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100dvh",
          overflowY: "auto",
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          paddingBottom: 96,
          color: "#e5e7eb",
          boxSizing: "border-box",
        }}
      >
        <img
          src="/logo-sports-platform.png"
          alt="Platform Sports"
          style={{ width: 520, maxWidth: "92vw", marginBottom: 24 }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 0,
            padding: 26,
            border: "none",
            outline: "none",
            background: "transparent",
            boxShadow: "none",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Sign in
          </h1>

          {errorMsg && (
            <div
              style={{
                background: "rgba(220,38,38,0.25)",
                padding: 10,
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                height: 44,
                borderRadius: 999,
                padding: "0 16px",
                border: "none",
                background: "#e5eefc",
                color: "#000",
                fontSize: 16,
              }}
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                height: 44,
                borderRadius: 999,
                padding: "0 16px",
                border: "none",
                background: "#e5eefc",
                color: "#000",
                fontSize: 16,
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                fontSize: 12,
                textAlign: "right",
                cursor: "pointer",
              }}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>

            <Link
              href="/forgot-password"
              style={{
                color: "#9ca3af",
                fontSize: 12,
                textAlign: "right",
                textDecoration: "underline",
              }}
            >
              Forgot password?
            </Link>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: 44,
                borderRadius: 999,
                border: "none",
                background: "#22c55e",
                color: "#fff",
                fontWeight: 700,
                marginTop: 6,
                cursor: "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleGoogleLogin()}
              style={{
                height: 44,
                borderRadius: 999,
                border: "4px solid #DC2626",
                background: "#111111",
                color: "#ffffff",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.54l3.35-2.62Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z"
                />
              </svg>
              Continue with Google
            </button>

            <div style={{ marginTop: 12, textAlign: "center", fontSize: 13 }}>
              <span style={{ color: "#9ca3af" }}>
                Don&apos;t have an account?{" "}
              </span>
              <Link href="/signup" style={{ color: "#fff", fontWeight: 700 }}>
                Create account
              </Link>
            </div>
          </form>
        </div>
      </main>

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0 }}>
        <div style={{ background: "#000" }}><BottomNavbar /></div>
      </div>
    </>
  );
}










