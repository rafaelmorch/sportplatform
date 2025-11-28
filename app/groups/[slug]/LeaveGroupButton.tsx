"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type LeaveGroupButtonProps = {
  groupSlug: string;
};

export default function LeaveGroupButton({ groupSlug }: LeaveGroupButtonProps) {
  const supabase = supabaseBrowser;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLeave() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Você precisa estar logado.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("userId", user.id)
      .eq("groupSlug", groupSlug);

    if (error) {
      console.error("Erro ao sair do grupo:", error);
      alert("Não foi possível sair do grupo.");
      setLoading(false);
      return;
    }

    // Atualiza a página
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleLeave}
      disabled={loading}
      style={{
        marginTop: 10,
        backgroundColor: "#991b1b",
        padding: "10px 14px",
        borderRadius: 12,
        color: "white",
        fontSize: 14,
        fontWeight: 600,
        border: "1px solid #7f1d1d",
        width: "100%",
      }}
    >
      {loading ? "Saindo..." : "Sair do Grupo"}
    </button>
  );
}
