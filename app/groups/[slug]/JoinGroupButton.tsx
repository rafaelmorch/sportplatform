"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type JoinGroupButtonProps = {
  // aceito tanto groupSlug quanto slug para não quebrar usos antigos
  groupSlug?: string;
  slug?: string;
};

export default function JoinGroupButton(props: JoinGroupButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const groupSlug = props.groupSlug ?? props.slug;

  // Se por algum motivo vier sem slug, mostra botão desabilitado
  if (!groupSlug) {
    return (
      <button
        type="button"
        disabled
        style={{
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.6)",
          backgroundColor: "transparent",
          color: "#9ca3af",
          fontSize: 13,
          cursor: "not-allowed",
          opacity: 0.7,
        }}
      >
        Participar do grupo
      </button>
    );
  }

  function handleClick() {
    setErrorMsg(null);

    startTransition(async () => {
      const supabase = supabaseBrowser;

      // garante que o usuário está logado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMsg("Faça login para participar do grupo.");
        return;
      }

      const { error } = await supabase.from("group_members").insert({
        group_slug: groupSlug,
        user_id: user.id,
      });

      if (error) {
        console.error("Erro ao entrar no grupo:", error);
        setErrorMsg("Não foi possível entrar no grupo. Tente novamente.");
        return;
      }

      // força refresh da página de detalhes
      router.refresh();
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid rgba(34,197,94,0.7)",
          background:
            "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
          color: "#020617",
          fontSize: 14,
          fontWeight: 600,
          cursor: isPending ? "wait" : "pointer",
          opacity: isPending ? 0.8 : 1,
        }}
      >
        {isPending ? "Entrando..." : "Participar do grupo"}
      </button>

      {errorMsg && (
        <p
          style={{
            fontSize: 11,
            color: "#fca5a5",
            margin: 0,
          }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}
