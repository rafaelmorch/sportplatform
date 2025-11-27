"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

type LevelOption = "Iniciante" | "Intermediário" | "Avançado";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

export default function NewTrainingPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<LevelOption | "">("");
  const [durationWeeks, setDurationWeeks] = useState<string>("");
  const [price, setPrice] = useState<string>(""); // em dólar (ex: 199.99)
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg("Dê um nome para o seu treinamento.");
      return;
    }

    setLoading(true);

    try {
      // 1) Verifica sessão
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.error("Erro de sessão:", sessionError);
        setErrorMsg("Você precisa estar logado para criar um treinamento.");
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // 2) Gera slug
      const baseSlug = slugify(title);
      const finalSlug = baseSlug || `training-${Date.now()}`;

      // 3) Converte preço para centavos (USD)
      let priceCents: number | null = null;
      if (price.trim()) {
        const normalized = price
          .trim()
          .replace(/[^\d.,]/g, "") // tira $, espaços etc.
          .replace(",", "."); // permite 199,99 ou 199.99

        const parsed = Number(normalized);
        if (!isNaN(parsed) && parsed > 0) {
          priceCents = Math.round(parsed * 100);
        }
      }

      // 4) Converte duração
      const duration =
        durationWeeks.trim() === "" ? null : Number(durationWeeks);

      // 5) Insert no Supabase
      const { data, error } = await supabase
        .from("trainings")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          level: level || null,
          duration_weeks: isNaN(duration as number) ? null : duration,
          visibility: "platform",
          created_by: userId,
          price_cents: priceCents,
          currency: "USD",
          slug: finalSlug,
        })
        .select("slug")
        .single();

      if (error) {
        console.error("Erro ao criar treinamento:", error);
        // slug único pode dar conflito
        if ((error as any).code === "23505") {
          setErrorMsg(
            "Já existe um treinamento com um slug gerado parecido. Tente ajustar o título."
          );
        } else {
          setErrorMsg("Não foi possível criar o treinamento. Tente novamente.");
        }
        setLoading(false);
        return;
      }

      const createdSlug = (data as any)?.slug ?? finalSlug;

      setSuccessMsg("Treinamento criado com sucesso!");
      setTimeout(() => {
        router.push(`/plans/${createdSlug}`);
      }, 600);
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
      return;
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px", // espaço pro BottomNavbar
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            marginBottom: "20px",
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
            Treinamentos
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Criar novo treinamento
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Cadastre um treinamento para disponibilizar na plataforma. Depois
            você poderá conectá-lo a desafios e eventos.
          </p>
        </header>

        {/* Mensagens */}
        {errorMsg && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(127,29,29,0.9)",
              color: "#fee2e2",
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(22,163,74,0.15)",
              border: "1px solid rgba(22,163,74,0.6)",
              color: "#bbf7d0",
              fontSize: 13,
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            borderRadius: 20,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "16px 14px",
            marginBottom: 18,
          }}
        >
          {/* Título */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}
            >
              Nome do treinamento *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: 10K para iniciantes em 8 semanas"
              required
              style={{
                height: 40,
                borderRadius: 12,
                border: "1px solid rgba(55,65,81,0.9)",
                padding: "0 10px",
                fontSize: 14,
                backgroundColor: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          {/* Descrição */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}
            >
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique para quem é este treinamento, o que inclui, volume semanal aproximado, etc."
              rows={4}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(55,65,81,0.9)",
                padding: "8px 10px",
                fontSize: 14,
                backgroundColor: "#020617",
                color: "#e5e7eb",
                resize: "vertical",
              }}
            />
          </div>

          {/* Linha: nível + duração + preço */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {/* Nível */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <label
                style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}
              >
                Nível
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelOption | "")}
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(55,65,81,0.9)",
                  padding: "0 10px",
                  fontSize: 14,
                  backgroundColor: "#020617",
                  color: level ? "#e5e7eb" : "#6b7280",
                }}
              >
                <option value="">Selecione</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>

            {/* Duração */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <label
                style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}
              >
                Duração (semanas)
              </label>
              <input
                type="number"
                min={1}
                max={52}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                placeholder="Ex.: 8"
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(55,65,81,0.9)",
                  padding: "0 10px",
                  fontSize: 14,
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>

            {/* Preço (USD) */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <label
                style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}
              >
                Preço (US$)
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex.: 199.99"
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(55,65,81,0.9)",
                  padding: "0 10px",
                  fontSize: 14,
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>
          </div>

          {/* Botão salvar */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              height: 46,
              borderRadius: 999,
              border: "1px solid rgba(34,197,94,0.9)",
              background:
                "linear-gradient(135deg, #22c55e, #16a34a, #22c55e)",
              color: "#020617",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s ease-out",
            }}
          >
            {loading ? "Salvando..." : "Salvar treinamento"}
          </button>
        </form>
      </div>

      <BottomNavbar />
    </main>
  );
}
