// app/groups/page.tsx
import Link from "next/link";
import BottomNavbar from "@/components/BottomNavbar";
import { trainingGroups } from "./groups-data";

export default function GroupsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px"
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto"
        }}
      >
        <header
          style={{
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0
            }}
          >
            Grupos de treino
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#9ca3af",
              margin: 0
            }}
          >
            Escolha o grupo que melhor se conecta com o seu momento de treino.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18
          }}
        >
          {trainingGroups.map((group) => (
            <article
              key={group.slug}
              style={{
                borderRadius: 24,
                padding: "18px 18px",
                background:
                  "radial-gradient(circle at top, #020617, #020617 60%, #000000 100%)",
                border: "1px solid rgba(55,65,81,0.9)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 180
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: 0
                  }}
                >
                  {group.title}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#d1d5db",
                    margin: 0
                  }}
                >
                  {group.shortDescription}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  fontSize: 12,
                  color: "#9ca3af"
                }}
              >
                <span>{group.includedChallengeSummary}</span>
                <Link
                  href={`/groups/${group.slug}`}
                  style={{
                    textDecoration: "none",
                    color: "#93c5fd",
                    fontWeight: 500
                  }}
                >
                  Ver detalhes →
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
