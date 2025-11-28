// app/groups/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  trainingGroups,
  type TrainingGroup,
  type TrainingGroupSlug,
} from "../groups-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

export default function GroupDetailPage({ params }: PageProps) {
  const slug = params.slug as TrainingGroupSlug;

  const group = trainingGroups.find(
    (g) => g.slug === slug
  ) as TrainingGroup | undefined;

  if (!group) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Botão voltar */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/groups"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#9ca3af",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ←
            </span>
            <span>Voltar para grupos</span>
          </Link>
        </div>

        {/* Header do grupo */}
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
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
            Grupo de treino
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            {group.title}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            {group.shortDescription}
          </p>
        </header>

        {/* Sobre o grupo */}
        <section
          style={{
            borderRadius: 20,
            border: "1px solid rgba(55,65,81,0.9)",
            background:
              "radial-gradient(circle at top, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginTop: 0,
              marginBottom: 8,
            }}
          >
            Sobre o grupo
          </h2>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#d1d5db",
              margin: 0,
            }}
          >
            {group.longDescription}
          </p>
        </section>
      </div>
    </main>
  );
}
