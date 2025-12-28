"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import BottomNavbar from "@/components/BottomNavbar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = {
  full_name: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Erro ao carregar user:", error);
          setErrorMsg("Erro ao carregar usuário.");
          setLoadingProfile(false);
          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setEmail(user.email ?? null);

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileErr) {
          console.error("Erro ao carregar profile:", profileErr);
        }

        setName(profile?.full_name ?? null);
      } catch (err) {
        console.error("Erro inesperado:", err);
        setErrorMsg("Erro inesperado ao carregar perfil.");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Erro ao sair:", err);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        paddingBottom: 80,
      }}
    >
      <section
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "24px 20px",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Perfil
        </h1>

        {loadingProfile && (
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            Carregando perfil...
          </p>
        )}

        {errorMsg && (
          <p style={{ fontSize: 14, color: "#fca5a5" }}>{errorMsg}</p>
        )}

        {!loadingProfile && !errorMsg && (
          <>
            <div
              style={{
                borderRadius: 16,
                padding: "16px 14px",
                border: "1px solid rgba(148,163,184,0.35)",
                background:
                  "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
                marginBottom: 20,
              }}
            >
              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
                Nome
              </p>
              <p style={{ fontSize: 15, fontWeight: 600 }}>
                {name ?? "—"}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginBottom: 4,
                  marginTop: 12,
                }}
              >
                Email
              </p>
              <p style={{ fontSize: 14 }}>{email ?? "—"}</p>
            </div>

            {/* 👉 ÚNICO acesso às integrações */}
            <Link
              href="/integrations"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px 0",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.35)",
                color: "#e5e7eb",
                textDecoration: "none",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              Gerenciar integrações
            </Link>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 999,
                background: "transparent",
                border: "1px solid rgba(239,68,68,0.6)",
                color: "#fca5a5",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {signingOut ? "Saindo..." : "Sair"}
            </button>
          </>
        )}
      </section>

      <BottomNavbar />
    </main>
  );
}
