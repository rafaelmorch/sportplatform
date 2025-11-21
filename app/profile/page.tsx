// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import BottomNavbar from "@/components/BottomNavbar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = {
  full_name: string | null;
};

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setErrorMsg(null);
        setSuccessMsg(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Erro ao buscar usuário:", userError);
          setErrorMsg("Erro ao carregar usuário.");
          setLoadingProfile(false);
          return;
        }

        if (!user) {
          setErrorMsg("Você precisa estar logado para acessar o perfil.");
          setLoadingProfile(false);
          return;
        }

        setEmail(user.email ?? null);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle<Profile>();

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
        }

        const currentName =
          profile?.full_name ||
          (user.user_metadata as any)?.full_name ||
          (user.user_metadata as any)?.name ||
          "";


        setName(currentName);
      } catch (err) {
        console.error("Erro inesperado ao carregar perfil:", err);
        setErrorMsg("Erro inesperado ao carregar perfil.");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Por favor, preencha o nome.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMsg("Você precisa estar logado para salvar o perfil.");
        setSaving(false);
        return;
      }

      // upsert garante que o registro exista
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: name.trim(),
        },
        { onConflict: "id" } // usa id como chave única
      );

      if (upsertError) {
        console.error("Erro ao salvar perfil:", upsertError);
        setErrorMsg("Erro ao salvar dados do perfil.");
        setSaving(false);
        return;
      }

      setSuccessMsg("Perfil atualizado com sucesso!");
      setSaving(false);
    } catch (err) {
      console.error("Erro inesperado ao salvar perfil:", err);
      setErrorMsg("Erro inesperado ao salvar o perfil.");
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço para a bottom navbar fixa
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "999px",
                background:
                  "radial-gradient(circle at 20% 20%, #22c55e, #16a34a 40%, #0f172a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "#0b1120",
              }}
            >
              {name ? name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Meu Perfil
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                Gerencie o nome exibido na SportPlatform.
              </p>
            </div>
          </div>
        </header>

        {/* Card de edição de nome */}
        <section
          style={{
            borderRadius: 18,
            padding: "16px 14px",
            background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
            border: "1px solid rgba(148,163,184,0.4)",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              marginBottom: 10,
            }}
          >
            Dados básicos
          </h2>

          {loadingProfile ? (
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Carregando perfil...
            </p>
          ) : (
            <form
              onSubmit={handleSave}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  htmlFor="name"
                  style={{
                    fontSize: 12,
                    color: "#d1d5db",
                  }}
                >
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  style={{
                    borderRadius: 10,
                    padding: "8px 10px",
                    border: "1px solid rgba(55,65,81,0.9)",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontSize: 13,
                  }}
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    margin: 0,
                    marginTop: 2,
                  }}
                >
                  Este é o nome que aparecerá no feed, dashboard e em outras
                  áreas do app.
                </p>
              </div>

              {email && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#d1d5db",
                    }}
                  >
                    E-mail (somente leitura)
                  </span>
                  <div
                    style={{
                      borderRadius: 10,
                      padding: "8px 10px",
                      border: "1px solid rgba(31,41,55,0.9)",
                      backgroundColor: "#020617",
                      fontSize: 13,
                      color: "#9ca3af",
                    }}
                  >
                    {email}
                  </div>
                </div>
              )}

              {errorMsg && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#fca5a5",
                    margin: 0,
                    marginTop: 4,
                  }}
                >
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#bbf7d0",
                    margin: 0,
                    marginTop: 4,
                  }}
                >
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 8,
                  alignSelf: "flex-start",
                  borderRadius: 999,
                  padding: "8px 16px",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  background:
                    "linear-gradient(to right, #22c55e, #16a34a, #15803d)",
                  color: "#0b1120",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  transition: "opacity 0.15s ease-out",
                }}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
          )}
        </section>

        {/* Card explicativo (opcional) */}
        <section
          style={{
            borderRadius: 18,
            padding: "16px 14px",
            background: "radial-gradient(circle at top, #020617, #020617 60%)",
            border: "1px solid rgba(148,163,184,0.35)",
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Como usamos seu nome
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            O nome definido aqui é utilizado para identificar você no feed, nos
            rankings, no dashboard de performance e em outras áreas da
            SportPlatform. Você pode alterá-lo a qualquer momento.
          </p>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
