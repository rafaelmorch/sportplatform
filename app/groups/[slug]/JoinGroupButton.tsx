// app/groups/[slug]/JoinGroupButton.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type JoinGroupButtonProps = {
  groupId: string;
  groupSlug: string;
  initialMembersCount: number;
};

export default function JoinGroupButton({
  groupId,
  groupSlug,
  initialMembersCount,
}: JoinGroupButtonProps) {
  const router = useRouter();
  const supabase = supabaseBrowser;

  const [isMember, setIsMember] = useState(false);
  const [membersCount, setMembersCount] = useState(initialMembersCount);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verifica se o usuário já está no grupo
  useEffect(() => {
    let isMounted = true;

    async function checkMembership() {
      setLoadingCheck(true);
      setErrorMsg(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data, error } = await supabase
          .from("training_group_members")
          .select("id")
          .eq("group_id", groupId)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!error && data && isMounted) {
          setIsMember(true);
        }
      }

      if (isMounted) {
        setLoadingCheck(false);
      }
    }

    checkMembership();

    return () => {
      isMounted = false;
    };
  }, [groupId, supabase]);

  async function handleJoin() {
    setErrorMsg(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      // manda pro login e volta pra este grupo
      router.push(`/login?redirect=/groups/${groupSlug}`);
      return;
    }

    if (isMember || joining) {
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase.from("training_group_members").insert({
        group_id: groupId,
        user_id: session.user.id,
      });

      if (error) {
        const anyErr = error as any;
        if (anyErr?.code === "23505") {
          setIsMember(true);
        } else {
          console.error("Erro ao entrar no grupo:", error);
          setErrorMsg("Não foi possível entrar no grupo. Tente novamente.");
        }
      } else {
        setIsMember(true);
        setMembersCount((prev) => prev + 1);
      }
    } finally {
      setJoining(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {errorMsg && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(127,29,29,0.9)",
            color: "#fee2e2",
            fontSize: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={handleJoin}
        disabled={loadingCheck || joining || isMember}
        style={{
          height: 44,
          borderRadius: 999,
          border: isMember
            ? "1px solid rgba(148,163,184,0.6)"
            : "1px solid rgba(34,197,94,0.9)",
          background: isMember
            ? "transparent"
            : "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
          color: isMember ? "#e5e7eb" : "#020617",
          fontSize: 14,
          fontWeight: 600,
          cursor:
            loadingCheck || joining || isMember ? "default" : "pointer",
          opacity: joining || loadingCheck ? 0.7 : 1,
          transition: "opacity 0.15s ease-out",
        }}
      >
        {loadingCheck
          ? "Carregando..."
          : isMember
          ? "Você já está neste grupo"
          : joining
          ? "Entrando no grupo..."
          : "Participar do grupo"}
      </button>

      <span
        style={{
          fontSize: 11,
          color: "#9ca3af",
        }}
      >
        {membersCount} atleta(s) atualmente neste grupo.
      </span>
    </div>
  );
}
