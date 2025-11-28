// app/profile/groups/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  trainingGroups,
  type TrainingGroup,
  type TrainingGroupSlug,
} from "../../groups/groups-data";

type GroupMemberRow = {
  group_slug: string | null;
};

export default function ProfileGroupsPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser;

    async function load() {
      setLoading(true);
      setError(null);

      // 1) Pega usuário logado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        setError("Erro ao carregar usuário.");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("Você precisa estar logado para ver seus grupos.");
        setLoading(false);
        return;
      }

      // 2) Busca na tabela group_members os grupos deste usuário
      const { data, error } = await supabase
        .from("group_members")
        .select("group_slug")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setError("Erro ao carregar seus grupos.");
        setLoading(false);
        return;
      }

      const slugs = (data ?? [])
        .map((row: GroupMemberRow) => row.group_slug)
        .filter((slug): slug is TrainingGroupSlug => !!slug);

      // 3) Cruza com a lista estática de grupos
      const myGroups = trainingGroups.filter((g) => slugs.includes(g.slug));

      setGroups(myGroups);
      setLoading(false);
    }

    load();
  }, []);

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
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Botão voltar para Perfil */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/profile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              borderRadius: 999,
              padding: "6px 14px",
              border: "1px solid rgba(148,163,184,0.6)",
              textDecoration: "none",
              color: "#e5e7eb",
            }}
          >
            ← Voltar para perfil
          </Link>
        </div>

        {/* Título */}
        <header style={{ marginBottom: 20 }}>
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
              fontSize: 22,
              fontWeight: 700,
              margin: "4px 0 0 0",
            }}
          >
            Meus grupos de treino
          </h1>
        </header>

        {/* Estados: carregando / erro / vazio */}
        {loading && (
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            Carregando seus grupos...
          </p>
        )}

        {error && !loading && (
          <p style={{ fontSize: 14, color: "#f87171" }}>{error}</p>
        )}

        {!loading && !error && groups.length === 0 && (
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            Você ainda não participa de nenhum grupo. Acesse a aba{" "}
            <Link
              href="/groups"
              style={{ color: "#22c55e", textDecoration: "none" }}
            >
              Grupos
            </Link>{" "}
            para entrar em uma comunidade.
          </p>
        )}

        {/* Lista de grupos do usuário */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 8,
          }}
        >
          {groups.map((group) => (
            <Link
              key={group.slug}
              href={`/groups/${group.slug}`}
              style={{
                display: "block",
                textDecoration: "none",
                borderRadius: 20,
                border: "1px solid rgba(30,64,175,0.7)",
                background:
                  "radial-gradient(circle at top left, rgba(37,99,235,0.15), #020617 55%, #000000 100%)",
                padding: "14px 16px",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 4,
                  color: "#f9fafb",
                }}
              >
                {group.name}
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#cbd5f5",
                  margin: 0,
                }}
              >
                {group.shortDescription}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
