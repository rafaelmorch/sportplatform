// app/profile/groups/page.tsx

import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { trainingGroups, type TrainingGroup } from "@/app/groups/groups-data";

export const dynamic = "force-dynamic";

export default async function MyGroupsPage() {
  const supabase = supabaseBrowser;

  // Verifica se o usuário está logado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main
        style={{
          padding: "24px",
          color: "white",
          textAlign: "center",
        }}
      >
        <h2>Você precisa estar logado</h2>
        <p>Entre na sua conta para ver seus grupos de treino.</p>
      </main>
    );
  }

  // Busca grupos que o usuário participa
  const { data: memberships, error } = await supabase
    .from("group_members")
    .select("groupSlug")
    .eq("userId", user.id);

  if (error) {
    console.error("Erro ao carregar grupos do usuário:", error);
  }

  const userGroupSlugs: string[] = memberships?.map((m) => m.groupSlug) ?? [];

  const groups: TrainingGroup[] = trainingGroups.filter((g) =>
    userGroupSlugs.includes(g.slug)
  );

  return (
    <main
      style={{
        padding: "24px",
        color: "white",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        Meus Grupos de Treino
      </h1>

      {groups.length === 0 && (
        <p style={{ color: "#94a3b8" }}>
          Você ainda não participa de nenhum grupo.
        </p>
      )}

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
              {group.title}
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
    </main>
  );
}
