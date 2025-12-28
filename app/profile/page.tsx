"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import BottomNavbar from "@/components/BottomNavbar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ProfileRow = {
  full_name: string | null;
};

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Erro ao carregar user:", error);
n
          setErrorMsg("Erro ao carregar usuário. Faça login novamente.");
          setLoading(false);
          return;
        }

        const user = data.user;
        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);
        setEmail(user.email ?? null);

        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (profErr) {
          console.error("Erro ao carregar profiles:", profErr);
          // não trava a página
        }

        setName(profile?.full_name ?? "");
        setLoading(false);
      } catch (e) {
        console.error("Erro inesperado no profile:", e);
        setErrorMsg("Erro inesperado ao carregar seu perfil.");
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const onSave = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const { data, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.error("Erro ao checar user:", userErr);
        setErrorMsg("Erro ao validar usuário. Faça login novamente.");
        setSaving(false);
        return;
      }

      const user = data.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { error: upErr } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: name.trim() ? name.trim() : null,
        updated_at: new Date().toISOString(),
      });

      if (upErr) {
        console.error("Erro ao salvar profile:", upErr);
        setErrorMsg("Não foi possível salvar. Tente novamente.");
        setSaving(false);
        return;
      }

      setSuccessMsg("Salvo com sucesso.");
      setSaving(false);
    } catch (e) {
      console.error("Erro inesperado ao salvar:", e);
      setErrorMsg("Erro inesperado ao salvar.");
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    try {
      setSigningOut(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro ao sair:", error);
        setErrorMsg("Erro ao sair. Tente novamente.");
        setSigningOut(false);
        return;
      }

      router.push("/login");
    } catch (e) {
      console.error("Erro inesperado ao sair:", e);
      setErrorMsg("Erro inesperado ao sair.");
      setSigningOut(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        padding: "22px 14px 92px",
        color: "#e5e7eb",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
          borderRadius: 24,
          padding: "22px 18px",
          border: "1px solid rgba(148,163,184,0.35)",
          background:
            "radial-gradient(circle at top, #020617, #020617 50%, #000000 100%)",
          boxShadow:
            "0 18px 45px rgba(15, 23, 42, 0.8), 0 0 0 1px rgba(15, 23, 42, 0.9)",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 20% 20%, #22c55e, #16a34a 40%, #0f172a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#0b1120",
            }}
          >
            SP
          </div>

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Perfil
            </p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              Minha conta
            </h1>
          </div>
        </div>

        {loading ? (
          <p style={{ marginTop: 14, color: "#9ca3af", fontSize: 13 }}>
            Carregando...
          </p>
        ) : (
          <>
            {errorMsg && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(248,113,113,0.45)",
                  background: "rgba(248,113,113,0.10)",
                  color: "#fecaca",
                  fontSize: 13,
                }}
              >
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(34,197,94,0.35)",
                  background: "rgba(34,197,94,0.10)",
                  color: "#bbf7d0",
                  fontSize: 13,
                }}
              >
                {successMsg}
              </div>
            )}

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              <div
                style={{
                  borderRadius: 18,
                  padding: "12px 12px",
                  border: "1px solid rgba(148,163,184,0.22)",
                  background:
                    "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.88))",
                }}
              >
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Email</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {email ?? "-"}
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                  User ID:{" "}
                  <span style={{ color: "#9ca3af" }}>{userId ?? "-"}</span>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 18,
                  padding: "12px 12px",
                  border: "1px solid rgba(148,163,184,0.22)",
                  background:
                    "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.88))",
                }}
              >
                <label style={{ display: "block" }}>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Nome (exibido no app)
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    style={{
                      width: "100%",
                      marginTop: 8,
                      height: 42,
                      borderRadius: 12,
                      border: "1px solid rgba(55,65,81,0.9)",
                      background: "#020617",
                      color: "#e5e7eb",
                      padding: "0 12px",
                      outline: "none",
                      fontSize: 14,
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    height: 44,
                    borderRadius: 999,
                    border: "1px solid rgba(248,250,252,0.08)",
                    background: saving
                      ? "linear-gradient(135deg, #4b5563 0%, #374151 40%, #111827 100%)"
                      : "linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #0f172a 100%)",
                    color: saving ? "#9ca3af" : "#0b1120",
                    fontWeight: 800,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>

              {/* ✅ ÚNICO acesso a integrações: tudo centralizado lá */}
              <Link
                href="/integrations"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(148,163,184,0.10)",
                  color: "#e5e7eb",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                Ir para Integrações →
              </Link>

              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                style={{
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid rgba(248,113,113,0.45)",
                  background: signingOut
                    ? "rgba(148,163,184,0.08)"
                    : "rgba(248,113,113,0.10)",
                  color: signingOut ? "#9ca3af" : "#fecaca",
                  fontWeight: 800,
                  cursor: signingOut ? "not-allowed" : "pointer",
                }}
              >
                {signingOut ? "Saindo..." : "Sair"}
              </button>
            </div>
          </>
        )}
      </section>

      <BottomNavbar />
    </main>
  );
}
