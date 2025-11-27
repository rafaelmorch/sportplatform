// app/groups/page.tsx
import Link from "next/link";
import { trainingGroups } from "./groups-data";
import BottomNavbar from "@/components/BottomNavbar";

export default function GroupsPage() {
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
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Grupos de Treinamento
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {trainingGroups.map((group) => (
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
                borderRadius: 16,
                padding: "14px",
                background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
                border: "1px solid rgba(148,163,184,0.35)",
                cursor: "pointer",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: "#e2e8f0",
                }}
              >
                {group.title}
              </h2>

              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  marginBottom: 10,
                }}
              >
                {group.shortDescription}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  margin: 0,
                }}
              >
                {group.members} participantes
              </p>
            </div>
          </Link>
        ))}
      </div>

      <BottomNavbar />
    </main>
  );
}
