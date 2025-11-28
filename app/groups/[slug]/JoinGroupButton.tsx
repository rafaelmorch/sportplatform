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
  const [isLeaving, setIsLeaving] = useState(false);

  const router = useRouter();
  const supabase = supabaseBrowser;

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
        if (!cancelled) setChecking(false);
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

  // 2) Entrar no grupo
  const handleJoinClick = async () => {
    if (checking || joined || isPending || isLeaving) return;

    setErrorMessage(null);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setErrorMessage("Você precisa estar logado para participar do grupo.");
      return;
    }

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

      // Conflito/duplicado = já está no grupo
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

    setJoined(true);
    startTransition(() => router.refresh());
  };

  // 3) Sair do grupo
  const handleLeaveClick = async () => {
    if (checking || !joined || isLeaving) return;

    setErrorMessage(null);
    setIsLeaving(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setIsLeaving(false);
      setErrorMessage("Você precisa estar logado para sair do grupo.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("challenge_participants")
      .delete()
      .eq("user_id", user.id)
      .eq("group_slug", groupSlug);

    if (deleteError) {
      console.error("Erro ao sair do grupo:", deleteError);
      setIsLeaving(false);
      setErrorMessage("Não foi possível sair do grupo. Tente novamente.");
      return;
    }

    setJoined(false);
    setIsLeaving(false);
    startTransition(() => router.refresh());
  };

  const primaryLabel = checking
    ? "Verificando..."
    : joined
    ? "Você está no grupo"
    : isPending
    ? "Entrando..."
    : "Participar do grupo";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Botão principal: entrar / status */}
      <button
        type="button"
        onClick={handleJoinClick}
        disabled={checking || isPending || joined || isLeaving}
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
          cursor:
            checking || isPending || joined || isLeaving ? "default" : "pointer",
          opacity: isPending || isLeaving ? 0.8 : 1,
        }}
      >
        {primaryLabel}
      </button>

      {/* Botão menor: sair do grupo (só aparece se já estiver no grupo) */}
      {joined && !checking && (
        <button
          type="button"
          onClick={handleLeaveClick}
          disabled={isLeaving}
          style={{
            alignSelf: "flex-start",
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.7)",
            background: "transparent",
            color: "#e5e7eb",
            fontSize: 13,
            fontWeight: 500,
            cursor: isLeaving ? "default" : "pointer",
            opacity: isLeaving ? 0.7 : 1,
          }}
        >
          {isLeaving ? "Saindo do grupo..." : "Sair do grupo"}
        </button>
      )}

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
