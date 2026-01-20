// app/admin/events/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type AppEventRow = {
  id: string;
  title: string;
  date: string; // timestamptz
  city: string | null;
  state: string | null;
  published: boolean;
  capacity: number | null;
  waitlist_capacity: number;
  price_cents: number;
  created_at: string | null;
};

export default function AdminEventsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<AppEventRow[]>([]);

  useEffect(() => {
    const run = async () => {
      setErrorMsg(null);
      setCheckingAdmin(true);

      // 1) sessão
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      // 2) admin gate
      const { data: adminRow, error: adminErr } = await supabaseBrowser
        .from("app_admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (adminErr) {
        console.error("Erro ao validar admin:", adminErr);
        setErrorMsg("Erro ao validar permissões de administrador.");
        setCheckingAdmin(false);
        setLoading(false);
        return;
      }

      if (!adminRow) {
        router.replace("/");
        return;
      }

      setCheckingAdmin(false);

      // 3) carregar eventos
      try {
        setLoading(true);

        const { data, error } = await supabaseBrowser
          .from("app_events")
          .select(
            "id,title,date,city,state,published,capacity,waitlist_capacity,price_cents,created_at"
          )
          .order("date", { ascending: false });

        if (error) {
          console.error("Erro ao carregar eventos:", error);
          setErrorMsg("Erro ao carregar eventos.");
          setRows([]);
          setLoading(false);
          return;
        }

        setRows((data as AppEventRow[]) ?? []);
      } catch (err) {
        console.error("Erro inesperado:", err);
        setErrorMsg("Erro inesperado ao carregar eventos.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  const togglePublish = async (row: AppEventRow) => {
    setErrorMsg(null);

    const next = !row.published;

    const { error } = await supabaseBrowser
      .from("app_events")
      .update({ published: next, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (error) {
      console.error("Erro ao atualizar published:", error);
      setErrorMsg("Erro ao atualizar publicação.");
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, published: next } : r))
    );
  };

  if (checkingAdmin) {
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
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              Admin · Eventos
            </h1>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6, marginBottom: 0 }}>
              Lista de eventos (tabela <b>app_events</b>)
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/events/new")}
            style={{
              borderRadius: 999,
              padding: "10px 18px",
              border: "none",
              fontSize: 13,
              fontWeight: 800,
              background: "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
              color: "#0b1120",
              cursor: "pointer",
            }}
          >
            + Novo evento
          </button>
        </header>

        {errorMsg && (
          <div
            style={{
              borderRadius: 14,
              padding: 12,
              marginBottom: 12,
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(127,29,29,0.18)",
              color: "#fecaca",
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        <section
          style={{
            borderRadius: 18,
            padding: "14px",
            background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
            border: "1px solid rgba(148,163,184,0.35)",
          }}
        >
          {loading ? (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              Carregando…
            </p>
          ) : rows.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              Nenhum evento encontrado.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {rows.map((r) => {
                const when = r.date ? new Date(r.date).toLocaleString() : "";
                const where = [r.city, r.state].filter(Boolean).join(", ");

                return (
                  <div
                    key={r.id}
                    style={{
                      borderRadius: 16,
                      padding: 12,
                      border: "1px solid rgba(148,163,184,0.25)",
                      background: "rgba(2,6,23,0.55)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 260 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>
                          {r.title}
                        </p>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(148,163,184,0.25)",
                            color: r.published ? "#bbf7d0" : "#fef08a",
                            background: r.published
                              ? "rgba(34,197,94,0.10)"
                              : "rgba(234,179,8,0.10)",
                          }}
                        >
                          {r.published ? "PUBLICADO" : "RASCUNHO"}
                        </span>
                      </div>

                      <p style={{ margin: 0, marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                        {when}
                        {where ? ` · ${where}` : ""}
                      </p>

                      <p style={{ margin: 0, marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                        Capacidade: {r.capacity ?? "-"} · Waitlist: {r.waitlist_capacity} · Preço: {r.price_cents} cents
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        onClick={() => togglePublish(r)}
                        style={{
                          borderRadius: 999,
                          padding: "8px 14px",
                          border: "1px solid rgba(148,163,184,0.35)",
                          background: "rgba(2,6,23,0.6)",
                          color: "#e5e7eb",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {r.published ? "Despublicar" : "Publicar"}
                      </button>

                      <button
                        onClick={() => router.push(`/admin/events/${r.id}/edit`)}
                        style={{
                          borderRadius: 999,
                          padding: "8px 14px",
                          border: "none",
                          background:
                            "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
                          color: "#0b1120",
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
