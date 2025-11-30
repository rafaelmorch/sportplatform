// app/groups/[slug]/LeaveGroupButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type LeaveGroupButtonProps = {
  groupSlug: string;
};

export default function LeaveGroupButton({ groupSlug }: LeaveGroupButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = supabaseBrowser;

  const handleClick = async () => {
    if (isPending) return;

    setErrorMessage(null);

    // 1) Garantir que o usuário está logado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setErrorMessage("Você precisa estar logado para sair do grupo.");
      return;
    }

    // 2) Descobrir o ID do grupo a partir do slug
    const { data: groupRow, error: groupError } = await supabase
      .from("training_groups")
      .select("id")
      .eq("slug", groupSlug)
      .maybeSingle();

    if (groupError) {
      console.error("Erro ao buscar o grupo para sair:", groupError);
      setErrorMessage("Não foi possível identificar o grupo.");
      return;
    }

    if (!groupRow) {
      setErrorMessage("Grupo não encontrado.");
      return;
    }

    // 3) Remover da tabela correta: training_group_members
    const { error: deleteError } = await supabase
      .from("training_group_members")
      .delete()
      .eq("user_id", user.id)
      .eq("group_id", groupRow.id);

    if (deleteError) {
      console.error("Erro ao sair do grupo:", deleteError);
      setErrorMessage("Não foi possível sair do grupo.");
      return;
    }

    // 4) Atualizar a tela (contagem de membros etc.)
    startTransition(() => router.refresh());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          padding: "10px 16px",
          borderRadius: 999,
          border: "1px solid #f87171",
          backgroundColor: "transparent",
          color: "#fca5a5",
          fontSize: 14,
          fontWeight: 500,
          cursor: isPending ? "default" : "pointer",
        }}
      >
        {isPending ? "Saindo..." : "Sair do grupo"}
      </button>

      {errorMessage && (
        <p
          style={{
            fontSize: 12,
            color: "#f97373",
            margin: 0,
          }}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
