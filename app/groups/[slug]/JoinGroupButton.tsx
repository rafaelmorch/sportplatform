// app/groups/[slug]/JoinGroupButton.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type JoinGroupButtonProps = {
  groupSlug: string;
};

export default function JoinGroupButton({ groupSlug }: JoinGroupButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [checking, setChecking] = useState(true);

  const router = useRouter();
  const supabase = supabaseBrowser; // já é o client

  // 1) Ao carregar, ver se o usuário JÁ está no grupo
  useEffect(() => {
    let cancelled = false;

    async function checkMembership() {
      setChecking(true);
      setErrorMessage(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from("challenge_participants")
        .select("id")
        .eq("user_id", user.id)
        .eq("group_slug", groupSlug)
        .maybeSingle();

      if (!cancelled) {
        if (!error && data) {
          setJoined(true);
        }
        setChecking(false);
      }
    }

    checkMembership();

    return () => {
      cancelled = true;
    };
  }, [groupSlug, supabase]);

  const handleClick = async () => {
    if (checking || joined) return;

    setErrorMessage(null);

    // 2) Garantir que está logado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setErrorMessage("Você precisa estar logado para participar do grupo.");
      return;
    }

    // 3) Tentar inserir na tabela challenge_participants
    const { error: insertError } = await supabase
      .from("challenge_participants")
      .insert({
        user_id: user.id,
        group_slug: groupSlug,
      })
      .single();

    if (insertError) {
      console.error("Erro ao entrar no grupo:", insertError);

      const code = (insertError as any).code;
      const message = ((insertError as any).message ?? "").toLowerCase();

      // Se for conflito/duplicado, tratamos como "já está no grupo"
      if (
        code === "23505" ||
        message.includes("duplicate") ||
        message.includes("already exists") ||
        message.includes("conflict")
      ) {
        setJoined(true);
        startTransition(() => router.refresh());
        return;
      }

      setErrorMessage("Não foi possível entrar no grupo. Tente novamente.");
      return;
    }

    // 4) Sucesso
    setJoined(true);
    startTransition(() => router.refresh());
  };

  const label = checking
    ? "Verificando..."
    : joined
    ? "Você está no grupo"
    : isPending
    ? "Entrando..."
    : "Participar do grupo";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={checking || isPending || joined}
        style={{
          padding: "12px 20px",
          borderRadius: 999,
          border: "none",
          background:
            joined || checking
              ? "linear-gradient(135deg, #16a34a, #16a34a)"
              : "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
          color: "#020617",
          fontSize: 15,
          fontWeight: 600,
          cursor: checking || isPending || joined ? "default" : "pointer",
          opacity: isPending ? 0.8 : 1,
        }}
      >
        {label}
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
