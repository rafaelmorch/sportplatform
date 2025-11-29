"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Training = {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number | null;
  price_cents: number | null;
  currency: string | null;
  slug: string;
};

function formatPrice(priceCents: number | null, currency: string | null) {
  if (!priceCents || !currency) return null;
  const value = priceCents / 100;
  return `${currency} ${value.toFixed(2)}`;
}

export default function PlansPage() {
  const supabase = supabaseBrowser;

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrainings() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("trainings")
        .select(
          "id, title, description, duration_weeks, price_cents, currency, slug"
        )
        .eq("visibility", "platform") // só os planos “da plataforma”
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar treinamentos:", error);
        setErrorMsg("Não foi possível carregar os planos de treino.");
      } else {
        setTrainings((data ?? []) as Training[]);
      }

      setLoading(false);
    }

    fetchTrainings();
  }, [supabase]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "72px", // espaço para navbar
        }}
      >
        <div
          style={{
            maxWidth: "1024px",
            margin: "0 auto",
          }}
        >
          <header
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  marginBottom: "4px",
                }}
              >
                Planos de treino
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                Programas estruturados criados pelos treinadores na plataforma.
              </p>
            </div>

            <Link
              href="/plans/new"
              style={{
                fontSize: 13,
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.6)",
                textDecoration: "none",
                color: "#e5e7eb",
              }}
            >
              + Criar novo treinamento
            </Link>
          </header>

          {/* Mensagens de status */}
          {errorMsg && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(127,29,29,0.9)",
                color: "#fee2e2",
                fontSize: 13,
              }}
            >
              {errorMsg}
            </div>
          )}

          {loading && (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Carregando planos...</p>
          )}

          {!loading && !errorMsg && trainings.length === 0 && (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Ainda não há planos de treino cadastrados. Clique em{" "}
              <strong>&quot;Criar novo treinamento&quot;</strong> para adicionar o
              primeiro.
            </p>
          )}

          {!loading && trainings.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px",
              }}
            >
              {trainings.map((plan) => {
                const priceLabel = formatPrice(
                  plan.price_cents,
                  plan.currency
                );
                const durationLabel = plan.duration_weeks
                  ? `${plan.duration_weeks} semana${
                      plan.duration_weeks > 1 ? "s" : ""
                    }`
                  : null;

                return (
                  <Link
                    key={plan.id}
                    href={`/plans/${plan.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <article
                      style={{
                        borderRadius: "16px",
                        border: "1px solid #1e293b",
                        background:
                          "radial-gradient(circle at top left, #0f172a, #020617)",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        height: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "8px",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <h2
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              marginBottom: "4px",
                            }}
                          >
                            {plan.title}
                          </h2>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#cbd5e1",
                            }}
                          >
                            {plan.description ||
                              "Plano com progressão estruturada."}
                          </p>
                        </div>

                        {priceLabel && (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#4ade80",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {priceLabel}
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                        }}
                      >
                        {durationLabel
                          ? `Duração: ${durationLabel}`
                          : "Duração não informada"}
                      </p>

                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "11px",
                          color: "#64748b",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>Ver detalhes do plano</span>
                        <span>⟶</span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}
