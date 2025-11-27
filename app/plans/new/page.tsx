"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Challenge = {
  id: string;
  title: string;
};

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
  const supabase = supabaseBrowser;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<string>("");
  const [price, setPrice] = useState<string>(""); // em dólar (ex: 199.99)

  // >>> NOVOS ESTADOS PARA GRUPOS <<<
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState<string[]>(
    []
  );
  const [isGeneric, setIsGeneric] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carrega os grupos (desafios) existentes
  useEffect(() => {
    async function fetchChallenges() {
      setLoadingChallenges(true);
      const { data, error } = await supabase
        .from("challenges")
        .select("id, title")
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Erro ao carregar grupos/desafios:", error);
      } else {
        setChallenges(data ?? []);
      }
      setLoadingChallenges(false);
    }

    fetchChallenges();
  }, [supabase]);

  function toggleChallengeSelection(id: string) {
    setSelectedChallengeIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

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

      // 5) Insert no Supabase (treinamento)
      const { data, error } = await supabase
        .from("trainings")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          level: null, // não usamos mais nível
          duration_weeks: isNaN(duration as number) ? null : duration,
          visibility: "platform",
          created_by: userId,
          price_cents: priceCents,
          currency: "USD",
          slug: finalSlug,
          is_generic: isGeneric,
        })
        .select("id, slug")
        .single();

      if (error || !data) {
        console.error("Erro ao criar treinamento:", error);
        // slug único pode dar conflito
        const pgError = error as any;
        if (pgError?.code === "23505") {
          setErrorMsg(
            "Já existe um treinamento com um slug gerado parecido. Tente ajustar o título."
          );
        } else {
          setErrorMsg("Não foi possível criar o treinamento. Tente novamente.");
        }
        setLoading(false);
        return;
      }

      const trainingId = (data as any).id as string;
      const createdSlug = (data as any).slug ?? finalSlug;

      // 6) Cria vínculos treinamento <-> grupos selecionados
      if (selectedChallengeIds.length > 0) {
        const rows = selectedChallengeIds.map((challengeId) => ({
          training_id: trainingId,
          challenge_id: challengeId,
        }));

        const { error: relError } = await supabase
          .from("training_challenges")
          .insert(rows);

        if (relError) {
          console.error(
            "Erro ao vincular treinamento aos grupos/desafios:",
            relError
          );
          // Não vamos travar o fluxo por isso, só avisar
          setErrorMsg(
            "Treinamento criado, mas houve um problema ao vincular aos grupos."
          );
        }
      }

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

          {/* Duração + Preço */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
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

          {/* Apropriado para o grupo */}
          <div
            style={{
              marginTop: 4,
              paddingTop: 10,
              borderTop: "1px solid rgba(31,41,55,0.9)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <label
              style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb" }}
            >
              Apropriado para o grupo
            </label>

            {loadingChallenges ? (
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                Carregando grupos...
              </p>
            ) : challenges.length === 0 ? (
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                Ainda não há grupos cadastrados. Você pode marcar o
                treinamento como genérico.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {challenges.map((ch) => (
                  <label
                    key={ch.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#e5e7eb",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChallengeIds.includes(ch.id)}
                      onChange={() => toggleChallengeSelection(ch.id)}
                      style={{
                        width: 16,
                        height: 16,
                      }}
                    />
                    <span>{ch.title}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Opção genérica */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#e5e7eb",
                marginTop: 4,
              }}
            >
              <input
                type="checkbox"
                checked={isGeneric}
                onChange={(e) => setIsGeneric(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                }}
              />
              <span>
                Treinamento genérico (não vinculado a um grupo específico)
              </span>
            </label>
          </div>

          {/* Botão salvar */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
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
