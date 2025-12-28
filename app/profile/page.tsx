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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Erro ao carregar user:", error);
          setErrorMsg("Erro ao carregar usuário. Faça login novamente.");
          setLoading(false);
          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setEmail(user.email ?? null);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Erro ao carregar profile:", profileError);
        }

        setName(profile?.full_name ?? null);
      } catch (err) {
        console.error("Erro inesperado no profile:", err);
        setErrorMsg("Erro inesperado ao carregar perfil.");
      } finally {
        setLoading(false);
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
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Meu Perfil
        </h1>

        {loading && (
          <p style={{ fontSize: 14, color: "#9ca3af" }}>Carregando perfil…</p>
        )}

        {errorMsg && (
          <p style={{ fontSize: 14, color: "#fca5a5" }}>{errorMsg}</p>
        )}

        {!loading && !errorMsg && (
          <>
            <div
              style={{
                marginBottom: 20,
                padding: "16px 14px",
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.35)",
                background:
                  "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
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
                  marginTop: 10,
                }}
              >
                Email
              </p>
              <p style={{ fontSize: 14 }}>{email ?? "—"}</p>
            </div>

            {/* 👉 Integrações (único ponto de acesso) */}
            <Link
              href="/integrations"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 46,
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #15803d 100%)",
                color: "#022c22",
                fontWeight: 700,
                textDecoration: "none",
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
                height: 42,
                borderRadius: 999,
                background: "transparent",
                border: "1px solid rgba(239,68,68,0.6)",
                color: "#fca5a5",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {signingOut ? "Saindo…" : "Sair da conta"}
            </button>
          </>
        )}
      </section>

      <BottomNavbar />
    </main>
  );
}
