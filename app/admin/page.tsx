// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setErrorMsg(null);

      // 1) precisa estar logado
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      // 2) checar se é admin na tabela app_admins
      const { data, error } = await supabaseBrowser
        .from("app_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao validar admin:", error);
        setErrorMsg("Erro ao validar permissões de administrador.");
        setLoading(false);
        return;
      }

      if (!data) {
        // logado mas não é admin → manda pro começo do site (ou onde você quiser)
        router.replace("/");
        return;
      }

      setLoading(false);
    };

    run();
  }, [router]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
          Verificando permissões…
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            Admin Panel
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>
            Área administrativa (site) para controlar o app.
          </p>
        </header>

        {errorMsg && (
          <p style={{ fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>
            {errorMsg}
          </p>
        )}

        <section
          style={{
            borderRadius: 18,
            padding: "16px 14px",
            background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
            border: "1px solid rgba(148,163,184,0.35)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            Eventos
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
            (Próximo passo) Criar / editar eventos em <b>app_events</b>.
          </p>

          <button
            onClick={() => router.push("/admin/events")}
            style={{
              marginTop: 12,
              borderRadius: 999,
              padding: "10px 18px",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              background:
                "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
              color: "#0b1120",
              cursor: "pointer",
            }}
          >
            Gerenciar eventos
          </button>
        </section>
      </div>
    </main>
  );
}
