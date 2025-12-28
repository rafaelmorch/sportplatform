// app/groups/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { trainingGroups } from "./groups-data";

export const dynamic = "force-dynamic";

// 🔗 Mapa slug → imagem (CORRIGIDO: /images/groups para não conflitar com /groups/[slug])
const groupImages: Record<string, string> = {
  "maratona-42k": "/images/groups/marathon42k.png",
  "triathlon-endurance": "/images/groups/triathlon.png",
  "corrida-para-beginners": "/images/groups/beginners.png",
  "running-weight-loss": "/images/groups/loss.png",
  "performance-5k": "/images/groups/performance5k.png",
  "performance-10k": "/images/groups/performance10k.png",
};

export default function GroupsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await (await import("@/lib/supabase-browser")).supabaseBrowser.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setAllowed(true);
    };

    check();
  }, [router]);

  if (!allowed) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#020617",
          color: "#e5e7eb",
          padding: "16px",
          paddingBottom: "80px",
        }}
      >
        <p style={{ fontSize: 13, color: "#64748b" }}>Carregando…</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço pro BottomNavbar
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#64748b",
              margin: 0,
            }}
          >
            Comunidades
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Grupos de treino
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Escolha um grupo que combine com o seu momento e acompanhe sua evolução
            junto com outros atletas.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
          }}
        >
          {trainingGroups.map((group) => {
            const imgSrc = groupImages[group.slug] ?? null;

            return (
              <Link
                key={group.slug}
                href={`/groups/${group.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background:
                      "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
                    padding: "14px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    overflow: "hidden",
                  }}
                >
                  {/* ✅ Imagem do grupo (não muda layout do texto; só adiciona o banner no topo) */}
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={group.title}
                      loading="lazy"
                      onError={(e) => {
                        // fallback silencioso: esconde imagem quebrada
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                      style={{
                        width: "100%",
                        height: 92,
                        objectFit: "cover",
                        borderRadius: 12,
                        opacity: 0.95,
                      }}
                    />
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        {group.title}
                      </h2>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          margin: 0,
                        }}
                      >
                        {group.shortDescription}
                      </p>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(56,189,248,0.5)", // azul
                        background:
                          "linear-gradient(135deg, rgba(8,47,73,0.9), rgba(12,74,110,0.9))",
                        color: "#e0f2fe",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Grupo ativo
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginTop: 6,
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: "#60a5fa", // azul no lugar do verde
                        margin: 0,
                      }}
                    >
                      Plano de 12 semanas pensado para este grupo.
                    </p>

                    <span
                      style={{
                        fontSize: 12,
                        color: "#93c5fd",
                        textDecoration: "underline",
                      }}
                    >
                      Ver detalhes
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
