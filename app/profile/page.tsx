"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Profile = {
  full_name: string | null;
};

type ConnectionRow = {
  provider: string;
  expires_at: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Conexões
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [connections, setConnections] = useState<Record<string, ConnectionRow>>(
    {}
  );

  useEffect(() => {
    const run = async () => {
      setErrorMsg(null);
      setSuccessMsg(null);

      // ✅ 0) BLOQUEIO: precisa estar logado
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const user = session.user;
      setEmail(user.email ?? null);

      // 1) Perfil
      try {
        const { data: profile, error: profileError } = await supabaseBrowser
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

      // 2) Conexões (fonte da verdade = tabelas de tokens)
      try {
        setLoadingConnections(true);

        // Strava (não usa maybeSingle pra não quebrar se tiver duplicado)
        const { data: stravaRows, error: stravaErr } = await supabaseBrowser
          .from("strava_tokens")
          .select("athlete_id")
          .eq("user_id", user.id)
          .limit(1);

        if (stravaErr) {
          console.error("Erro ao checar strava_tokens:", stravaErr);
        }

        const stravaAthleteId = Array.isArray(stravaRows)
          ? stravaRows[0]?.athlete_id
          : null;

        const map: Record<string, ConnectionRow> = {};

        if (stravaAthleteId) {
          map["strava"] = { provider: "strava", expires_at: null };
        }

        setConnections(map);
      } catch (err) {
        console.error("Erro inesperado ao carregar conexões:", err);
      } finally {
        setLoadingConnections(false);
      }
    };

    run();
  }, [router]);

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
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        setErrorMsg("Você precisa estar logado para salvar o perfil.");
        setSaving(false);
        router.push("/login");
        return;
      }

      const user = session.user;

      const { error: upsertError } = await supabaseBrowser.from("profiles").upsert(
        {
          id: user.id,
          full_name: name.trim(),
        },
        { onConflict: "id" }
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

  const handleSignOut = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setSigningOut(true);
      const { error } = await supabaseBrowser.auth.signOut();
      if (error) {
        console.error("Erro ao deslogar:", error);
        setErrorMsg("Erro ao sair. Tente novamente.");
        setSigningOut(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Erro inesperado ao deslogar:", err);
      setErrorMsg("Erro inesperado ao sair.");
    } finally {
      setSigningOut(false);
    }
  };

  function getStatus(provider: "strava") {
    const c = connections[provider];

    // ✅ pedido: não mostrar "Não conectado" no Profile
    if (!c) return { label: "", color: "#9ca3af" };

    return { label: "Conectado", color: "#bbf7d0" };
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "999px",
                background:
                  "radial-gradient(circle at 20% 20%, #38bdf8, #0ea5e9 40%, #0f172a 100%)",
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
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                Meu Perfil
              </h1>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                Gerencie o nome exibido na SportPlatform.
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              borderRadius: 999,
              padding: "8px 14px",
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(2,6,23,0.6)",
              color: "#e5e7eb",
              fontSize: 13,
              fontWeight: 600,
              cursor: signingOut ? "not-allowed" : "pointer",
              opacity: signingOut ? 0.7 : 1,
            }}
            title="Sair da conta"
          >
            {signingOut ? "Saindo..." : "Sair"}
          </button>
        </header>

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
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              Carregando perfil...
            </p>
          ) : (
            <form
              onSubmit={handleSave}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label htmlFor="name" style={{ fontSize: 12, color: "#d1d5db" }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#d1d5db" }}>
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
                <p style={{ fontSize: 12, color: "#fca5a5", margin: 0, marginTop: 4 }}>
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p style={{ fontSize: 12, color: "#bbf7d0", margin: 0, marginTop: 4 }}>
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
                    "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
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

        <section
          style={{
            borderRadius: 18,
            padding: "16px 14px",
            background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
            border: "1px solid rgba(148,163,184,0.35)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 6 }}>
                Conexões
              </h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Conecte seus apps para importar atividades automaticamente.
              </p>

              {/* ✅ ÚNICO BOTÃO: manda para /integrations */}
              <a
                href="/integrations"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  background: "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
                  color: "#0b1120",
                  textDecoration: "none",
                  marginTop: 12,
                }}
              >
                Gerenciar integrações
              </a>
            </div>

            {loadingConnections && (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Carregando…</span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
              marginTop: 14,
            }}
          >
            {(() => {
              const s = getStatus("strava");
              return (
                <div
                  style={{
                    borderRadius: 14,
                    padding: 14,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.55)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                        Strava
                      </p>

                      {/* ✅ pedido: some com "Não conectado" */}
                      {!!s.label && (
                        <p
                          style={{
                            margin: 0,
                            marginTop: 4,
                            fontSize: 12,
                            color: s.color,
                          }}
                        >
                          {s.label}
                        </p>
                      )}
                    </div>

                    {/* ❌ removido botão aqui */}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      marginTop: 10,
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    Importa suas corridas, pedaladas e treinos para o dashboard.
                  </p>
                </div>
              );
            })()}
          </div>
        </section>

        <section
          style={{
            borderRadius: 18,
            padding: "16px 14px",
            background: "radial-gradient(circle at top, #020617, #020617 60%)",
            border: "1px solid rgba(148,163,184,0.35)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 8 }}>
            Como usamos seu nome
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
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
