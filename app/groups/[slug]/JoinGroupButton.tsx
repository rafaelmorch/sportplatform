"use client";

import { useState } from "react";
import type { TrainingGroupSlug } from "../groups-data";

type JoinGroupButtonProps = {
  slug: TrainingGroupSlug;
};

export default function JoinGroupButton({ slug }: JoinGroupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  async function handleJoin() {
    if (loading) return;
    setLoading(true);

    try {
      // 🚧 Aqui no futuro vamos conectar com o Supabase:
      // - pegar o usuário logado
      // - inserir na tabela de participantes do grupo / desafio
      // Por enquanto, só simulamos:
      console.log("Entrar no grupo:", slug);
      setJoined(true);
    } catch (error) {
      console.error("Erro ao entrar no grupo:", error);
      alert("Em breve você poderá entrar automaticamente no grupo pela plataforma.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={loading}
      style={{
        fontSize: 13,
        padding: "8px 16px",
        borderRadius: 999,
        border: "1px solid rgba(34,197,94,0.8)",
        background:
          "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(21,128,61,0.2))",
        color: "#bbf7d0",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {joined
        ? "Você está no grupo"
        : loading
        ? "Entrando..."
        : "Participar do grupo"}
    </button>
  );
}
