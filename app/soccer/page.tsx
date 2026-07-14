"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SoccerRegistrationPage() {
  const router = useRouter();

  const waiverText = `Acordo de Responsabilidade, Risco e Autorização de Imagem

1. Responsabilidade e Riscos:
Estou ciente e assumo integralmente todos os riscos inerentes à prática de atividade física, incluindo possíveis incidentes, quedas ou lesões leves que possam ocorrer durante o evento.

2. Condição Física:
Declaro que estou em boas condições de saúde e apto fisicamente para a prática esportiva, isentando a organização de qualquer responsabilidade médica.

3. Cumprimento das Regras:
Comprometo-me a seguir todas as regras, orientações e instruções fornecidas pela equipe organizadora e pelos monitores do evento.

4. Isenção de Responsabilidade:
Isento e desobrigo os organizadores, parceiros, patrocinadores, voluntários e todos os demais envolvidos no evento de qualquer responsabilidade civil, criminal ou financeira por incidentes que possam ocorrer durante a participação.

5. Uso de Imagem e Voz:
Autorizo, de forma livre e irrevogável, o uso da minha imagem e voz em fotos, vídeos e materiais promocionais relacionados ao evento, em meios digitais, impressos ou audiovisuais, sem limitação de tempo ou território.`;

  const [form, setForm] = useState({
    teamName: "",
    responsibleName: "",
    email: "",
    phone: "",
    termsAccepted: false,
    proof: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regulationOpen, setRegulationOpen] = useState(false);
  function setField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!form.proof) {
        throw new Error("Anexe o comprovante de pagamento.");
      }

      const body = new FormData();

      body.append("teamName", form.teamName);
      body.append("responsibleName", form.responsibleName);
      body.append("email", form.email);
      body.append("phone", form.phone);
      body.append("proof", form.proof);

      const response = await fetch("/api/soccer-registration", {
        method: "POST",
        body,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar inscrição.");
      }

      router.push(
        `/soccer/success?code=${encodeURIComponent(
          result.confirmationCode
        )}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao enviar inscrição."
      );
    } finally {
      setLoading(false);
    }
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #edf3fb 100%)",
    color: "#1f2937",
    fontFamily: "Calibri, Arial, sans-serif",
    padding: "28px 16px 56px",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 760,
    margin: "0 auto",
  };

  const sectionStyle: React.CSSProperties = {
    borderRadius: 22,
    border: "1px solid rgba(226, 232, 240, 0.95)",
    background: "rgba(255, 255, 255, 0.97)",
    padding: 22,
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)",
    backdropFilter: "blur(6px)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #d8e1ec",
    background: "#ffffff",
    padding: "15px 16px",
    fontSize: 15,
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  };

  const optionBaseStyle: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#fbfdff",
    padding: 15,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 10,
    fontWeight: 600,
    fontSize: 15,
    color: "#1f2937",
  };

  const helperTextStyle: React.CSSProperties = {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.6,
  };

  function getSelectableCardStyle(selected: boolean): React.CSSProperties {
    return {
      ...optionBaseStyle,
      border: selected ? "1px solid #64748b" : "1px solid #e5e7eb",
      background: selected ? "#f1f5f9" : "#fbfdff",
      boxShadow: selected ? "0 0 0 3px rgba(100, 116, 139, 0.12)" : "none",
    };
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div
          style={{
            ...sectionStyle,
            marginBottom: 22,
            padding: 18,
            background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)",
            border: "1px solid rgba(51, 65, 85, 0.95)",
            boxShadow: "0 18px 38px rgba(15, 23, 42, 0.18)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              borderRadius: 18,
              background:
                "radial-gradient(circle at top left, rgba(148,163,184,0.20), rgba(17,24,39,0.98) 60%), linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              padding: "22px 18px 20px",
              border: "1px solid rgba(71, 85, 105, 0.45)",
            }}
          >
            <img
              src="/logo-sports-platform.png"
              alt="Platform Sports"
              style={{
                width: "100%",
                maxWidth: "100%",
                height: "auto",
                display: "block",
                margin: "0 auto 18px",
              }}
            />

            <h1
              style={{
                margin: 0,
                fontSize: 34,
                fontWeight: 600,
                color: "#f8fafc",
                letterSpacing: "-0.02em",
                textAlign: "center",
              }}
            >
              Inscrição Campeonato de Futebol
            </h1>

            <p
              style={{
                marginTop: 12,
                marginBottom: 0,
                color: "#cbd5e1",
                lineHeight: 1.8,
                fontSize: 16,
                textAlign: "center",
                maxWidth: 620,
                marginInline: "auto",
              }}
            >
              Preencha os dados da equipe e faça o upload do comprovante de pagamento para concluir sua inscrição.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={sectionStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  color: "#0f172a",
                }}
              >
                Regulamento Oficial
              </h2>

              <button
                type="button"
                onClick={() => setRegulationOpen(true)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#2563eb",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "Calibri, Arial, sans-serif",
                }}
              >
                Abrir em tela cheia
              </button>
            </div>

            <img
              src="/images/soccer-regulamento.jpeg"
              alt="Regulamento do Campeonato de Futebol"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: 18,
                border: "1px solid #dbe3ee",
                background: "#ffffff",
              }}
            />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>Nome do Time</label>
            <input
              style={inputStyle}
              value={form.teamName}
              onChange={(e) => setField("teamName", e.target.value)}
              placeholder="Digite o nome do time"
              required
            />
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>Nome do Responsável</label>
            <input
              style={inputStyle}
              value={form.responsibleName}
              onChange={(e) => setField("responsibleName", e.target.value)}
              placeholder="Digite o nome do responsável"
              required
            />
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>E-mail de contato</label>
            <input
              type="email"
              style={inputStyle}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="Digite seu e-mail"
              required
            />
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>Telefone de contato</label>
            <input
              type="tel"
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="(689) 248-0582"
              required
            />
          </div>

          <div style={sectionStyle}>
            <p
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#2563eb",
              }}
            >
              Resumo da inscrição
            </p>

            <p
              style={{
                marginTop: 0,
                color: "#475569",
                lineHeight: 1.8,
                fontSize: 15,
              }}
            >
              Inscrição de uma equipe para o Campeonato de Futebol.
            </p>

            <div
              style={{
                marginTop: 18,
                borderRadius: 18,
                border: "1px solid #bfdbfe",
                background:
                  "linear-gradient(180deg, #f0f7ff 0%, #eaf3ff 100%)",
                padding: 18,
                display: "grid",
                gap: 14,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#2563eb",
                  }}
                >
                  Taxa de inscrição
                </p>

                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 38,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  US$ 450
                </p>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#475569",
                    fontSize: 15,
                  }}
                >
                  por equipe
                </p>
              </div>

              <div
                style={{
                  height: 1,
                  background: "rgba(148, 163, 184, 0.35)",
                }}
              />

              <div
                style={{
                  color: "#334155",
                  lineHeight: 1.8,
                  fontSize: 15,
                }}
              >
                Cada equipe poderá inscrever até{" "}
                <strong>9 atletas</strong>.
              </div>

              <div
                style={{
                  color: "#475569",
                  lineHeight: 1.8,
                  fontSize: 15,
                }}
              >
                Após a confirmação da inscrição, a organização entrará
                em contato para solicitar a relação completa dos atletas.
              </div>
            </div>

            <p
              style={{
                marginTop: 16,
                marginBottom: 0,
                color: "#475569",
                lineHeight: 1.8,
                fontSize: 15,
              }}
            >
              O pagamento será realizado por Zelle. Anexe o comprovante
              abaixo para concluir a inscrição.
            </p>
          </div>
<div style={sectionStyle}>
            <label style={{ ...labelStyle, fontSize: 18, lineHeight: 1.6, fontWeight: 700 }}>Realize o pagamento de US$ 450 via Zelle para platformsports1@gmail.com e anexe o comprovante.</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style={inputStyle}
              onChange={(e) => setField("proof", e.target.files?.[0] || null)}
              required
            />
            <p style={helperTextStyle}>Formatos aceitos: JPG, PNG ou PDF.</p>
          </div>

          <div style={sectionStyle}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 21,
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              Acordo de Responsabilidade, Risco e Autorização de Imagem
            </h2>

            <div
              style={{
                maxHeight: 320,
                overflow: "auto",
                whiteSpace: "pre-line",
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                background: "#fbfdff",
                padding: 16,
                color: "#475569",
                lineHeight: 1.9,
                fontSize: 14,
              }}
            >
              {waiverText}
            </div>

            <label style={{ ...getSelectableCardStyle(form.termsAccepted), marginTop: 16 }}>
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => setField("termsAccepted", e.target.checked)}
                required
              />
              <span style={{ color: "#111827", fontSize: 15 }}>
                Eu li e concordo com os termos acima.
              </span>
            </label>
          </div>

          {error && (
            <div
              style={{
                borderRadius: 16,
                border: "1px solid #fecaca",
                background: "#fff5f5",
                color: "#b91c1c",
                padding: 15,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                border: 0,
                borderRadius: 16,
                background: loading ? "#93c5fd" : "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                color: "#ffffff",
                padding: "16px 30px",
                fontWeight: 600,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.85 : 1,
                minWidth: 220,
                boxShadow: loading ? "none" : "0 10px 22px rgba(37, 99, 235, 0.22)",
                transition: "all 0.2s ease",
                fontFamily: "Calibri, Arial, sans-serif",
              }}
            >
              {loading ? "Enviando inscrição..." : "Enviar inscrição"}
            </button>
          </div>
        </form>

        {regulationOpen && (
          <div
            onClick={() => setRegulationOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 980,
                maxHeight: "94vh",
                overflow: "auto",
                borderRadius: 18,
                background: "#ffffff",
                padding: 12,
                boxShadow: "0 28px 70px rgba(0, 0, 0, 0.45)",
              }}
            >
              <button
                type="button"
                onClick={() => setRegulationOpen(false)}
                aria-label="Fechar regulamento"
                style={{
                  position: "sticky",
                  top: 8,
                  marginLeft: "auto",
                  zIndex: 2,
                  width: 42,
                  height: 42,
                  borderRadius: "999px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: 24,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.18)",
                }}
              >
                ×
              </button>

              <img
                src="/images/soccer-regulamento.jpeg"
                alt="Regulamento do Campeonato de Futebol"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: 12,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}














