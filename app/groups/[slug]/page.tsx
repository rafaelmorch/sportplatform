// app/groups/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getGroupBySlug } from "../groups-data";
import BottomNavbar from "@/components/BottomNavbar";

type PageProps = {
  params: { slug: string };
};

export default function GroupDetailPage({ params }: PageProps) {
  // usar any aqui para não brigar com o TypeScript
  const group = getGroupBySlug(params.slug) as any;

  if (!group) {
    notFound();
  }

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
          paddingBottom: "72px", // espaço para bottom navbar
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <header
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
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
                {group.title}
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                {group.shortDescription || group.description}
              </p>
            </div>

            <a
              href="/groups"
              style={{
                fontSize: "12px",
                color: "#e5e7eb",
                textDecoration: "none",
              }}
            >
              Ver todos os grupos
            </a>
          </header>

          {/* Tags / nível */}
          <section
            style={{
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              {group.levelLabel && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    border: "1px solid #1e293b",
                    color: "#a5b4fc",
                  }}
                >
                  {group.levelLabel}
                </span>
              )}

              {Array.isArray(group.tags) &&
                group.tags.map((tag: string) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      background: "#020617",
                      border: "1px solid #1f2937",
                      color: "#9ca3af",
                    }}
                  >
                    {tag}
                  </span>
                ))}
            </div>
          </section>

          {/* Objetivo + foco */}
          <section
            style={{
              borderRadius: "16px",
              border: "1px solid #1e293b",
              background: "#020617",
              padding: "14px",
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Objetivo do grupo
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                marginBottom: "8px",
              }}
            >
              {group.longDescription || group.description}
            </p>

            {Array.isArray(group.focusAreas) && group.focusAreas.length > 0 && (
              <ul
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  paddingLeft: "18px",
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {group.focusAreas.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Desafio de 30 dias */}
          {group.challenge && (
            <section
              style={{
                borderRadius: "16px",
                border: "1px solid #1e293b",
                background:
                  "radial-gradient(circle at top, #0f172a, #020617 60%)",
                padding: "14px",
                marginBottom: "14px",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                Desafio de 30 dias
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  marginBottom: "8px",
                }}
              >
                {group.challenge.description}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                }}
              >
                Foco principal: {group.challenge.mainMetric}
              </p>
            </section>
          )}

          {/* Conexão com planos */}
          <section
            style={{
              borderRadius: "16px",
              border: "1px solid #1e293b",
              background: "#020617",
              padding: "14px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Planos de treino conectados a este grupo
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                marginBottom: "8px",
              }}
            >
              Os planos de treino da plataforma podem ser configurados para
              acompanhar exatamente a sua evolução neste grupo. Você pode
              combinar a participação no grupo com planos específicos de 5K,
              10K, maratona ou triathlon.
            </p>
            <a
              href="/plans"
              style={{
                display: "inline-block",
                marginTop: "4px",
                fontSize: "13px",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "#22c55e",
                color: "#020617",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Ver planos disponíveis
            </a>
          </section>
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}
