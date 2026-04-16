"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type ParticipationId = "clinic1" | "clinic2";
type ClinicSlotTime = "8am" | "9am" | "10am";

const clinicTimes: ClinicSlotTime[] = ["8am", "9am", "10am"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BeachTennisRegistrationPage() {
  const router = useRouter();

  const participationOptions = [
    { id: "clinic1" as ParticipationId, label: "Clínica 1 - 04/26/2026: Treino de beach tenis + funcional na areia de aquecimento", price: 29.9 },
    { id: "clinic2" as ParticipationId, label: "Clínica 2 - 05/16/2026: Treino de beach tenis com circuito motor \(técnicas\)", price: 29.9 },
  ];

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
  participant1: "",
  email: "",
  phone: "",
  termsAccepted: false,
  clinic1Slot: null as string | null,
  clinic2Slot: null as string | null,
  proof: null as File | null,
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedClinics, setExpandedClinics] = useState<ParticipationId[]>([]);
  const [clinicInfoOpen, setClinicInfoOpen] = useState<null | "clinic1" | "clinic2">(null);
  const [slotIdByKey, setSlotIdByKey] = useState<Record<string, string>>({});
  const [slotUsage, setSlotUsage] = useState<Record<string, number>>({});
  const [slotCapacity, setSlotCapacity] = useState<Record<string, number>>({});

  const originalTotal = useMemo(() => {
    let sum = 0;
    if (form.clinic1Slot) sum += 29.9;
    if (form.clinic2Slot) sum += 29.9;
    return sum;
  }, [form.clinic1Slot, form.clinic2Slot]);

  const total = useMemo(() => {
    const hasClinic1 = !!form.clinic1Slot;
    const hasClinic2 = !!form.clinic2Slot;

    if (hasClinic1 && hasClinic2) return 49.9;
    if (hasClinic1 || hasClinic2) return 29.9;

    return 0;
  }, [form.clinic1Slot, form.clinic2Slot]);

  const discount = useMemo(() => {
    const value = originalTotal - total;
    return value > 0 ? value : 0;
  }, [originalTotal, total]);

  const summary = useMemo(() => {
    const hasClinic1 = !!form.clinic1Slot;
    const hasClinic2 = !!form.clinic2Slot;

    if (hasClinic1 && hasClinic2) return "Você selecionou as 2 clínicas.";
    if (hasClinic1 || hasClinic2) return "Você selecionou apenas 1 clínica.";

    return "Selecione uma ou mais opções para ver o valor total.";
  }, [form.clinic1Slot, form.clinic2Slot]);

  function setField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    async function loadSlotAvailability() {
      const { data: slots, error: slotsError } = await supabase
        .from("beach_tennis_clinic_slots")
        .select("id, clinic_id, slot_time, capacity")
        .eq("active", true);

      if (slotsError || !slots) return;

      const nextSlotIdByKey: Record<string, string> = {};
      const nextSlotCapacity: Record<string, number> = {};
      const slotIds: string[] = [];

      slots.forEach((slot) => {
        const key = `${slot.clinic_id}_${slot.slot_time}`;
        nextSlotIdByKey[key] = slot.id;
        nextSlotCapacity[key] = slot.capacity;
        slotIds.push(slot.id);
      });

      const usage: Record<string, number> = {};

      const { data: clinic1Regs } = await supabase
        .from("beach_tennis_registrations")
        .select("clinic1_slot_id")
        .not("clinic1_slot_id", "is", null);

      const { data: clinic2Regs } = await supabase
        .from("beach_tennis_registrations")
        .select("clinic2_slot_id")
        .not("clinic2_slot_id", "is", null);

      (clinic1Regs || []).forEach((row) => {
        const slotId = row.clinic1_slot_id as string | null;
        if (slotId) usage[slotId] = (usage[slotId] || 0) + 1;
      });

      (clinic2Regs || []).forEach((row) => {
        const slotId = row.clinic2_slot_id as string | null;
        if (slotId) usage[slotId] = (usage[slotId] || 0) + 1;
      });

      setSlotIdByKey(nextSlotIdByKey);
      setSlotCapacity(nextSlotCapacity);
      setSlotUsage(usage);
    }

    loadSlotAvailability();
  }, []);

  function toggleClinic(clinicId: ParticipationId) {
    setExpandedClinics((prev) => {
      const isOpen = prev.includes(clinicId);

      if (isOpen) {
        return prev.filter((c) => c !== clinicId);
      } else {
        return [...prev, clinicId];
      }
    });

    setForm((prev) => ({
      ...prev,
      clinic1Slot: clinicId === "clinic1" && prev.clinic1Slot ? prev.clinic1Slot : prev.clinic1Slot,
      clinic2Slot: clinicId === "clinic2" && prev.clinic2Slot ? prev.clinic2Slot : prev.clinic2Slot,
    }));
  }

  function selectClinicSlot(clinicId: ParticipationId, slotTime: ClinicSlotTime) {
    setForm((prev) => ({
      ...prev,
      clinic1Slot: clinicId === "clinic1" ? slotTime : prev.clinic1Slot,
      clinic2Slot: clinicId === "clinic2" ? slotTime : prev.clinic2Slot,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!form.clinic1Slot && !form.clinic2Slot) {
      setError("Selecione pelo menos 1 horário para continuar.");
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();
      body.append("participant1", form.participant1);
      body.append("email", form.email);
      body.append("phone", form.phone);
      body.append("termsAccepted", String(form.termsAccepted));

      if (form.clinic1Slot) {
        body.append("clinic1Slot", form.clinic1Slot);
      }

      if (form.clinic2Slot) {
        body.append("clinic2Slot", form.clinic2Slot);
      }

      if (form.proof) {
        body.append("proof", form.proof);
      }

      const response = await fetch("/api/beachtennis-registration", {
        method: "POST",
        body,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar inscrição.");
      }

      router.push(`/beachtennis/success?code=${encodeURIComponent(result.confirmationCode)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar inscrição.");
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
              Inscrição Beach Tennis
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
              Preencha os dados, selecione as clínicas e faça o upload do comprovante de pagamento via Zelle.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={sectionStyle}>
            <label style={labelStyle}>Nome do participante</label>
            <input
              style={inputStyle}
              value={form.participant1}
              onChange={(e) => setField("participant1", e.target.value)}
              placeholder="Digite o nome completo"
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
            <label style={labelStyle}>Escolha o que você gostaria de participar</label>
            <p style={{ ...helperTextStyle, marginTop: 0, marginBottom: 14 }}>
              Clique no check da clínica para abrir os horários disponíveis. Você pode escolher apenas 1 horário por clínica.
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              {participationOptions.map((option) => {
                const selectedSlot = option.id === "clinic1" ? form.clinic1Slot : form.clinic2Slot;
                const isExpanded = expandedClinics.includes(option.id);

                return (
                  <div
                    key={option.id}
                    style={{
                      ...getSelectableCardStyle(isExpanded || !!selectedSlot),
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isExpanded || !!selectedSlot}
                          onChange={() => toggleClinic(option.id)}
                          style={{ marginTop: 2 }}
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                          <span style={{ color: "#111827", fontSize: 15 }}>{option.label}</span>
                          <span style={{ color: "#64748b", fontSize: 13 }}>
                            Valor individual: ${option.price.toFixed(2)}
                          </span>
                          {selectedSlot && (
                            <span style={{ color: "#2563eb", fontSize: 13, fontWeight: 600 }}>
                              Horário selecionado: {selectedSlot}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setClinicInfoOpen(option.id as "clinic1" | "clinic2")}
                        style={{
                          width: 30,
                          height: 30,
                          minWidth: 30,
                          borderRadius: "999px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0f172a",
                          fontSize: 16,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 10px rgba(15, 23, 42, 0.08)",
                        }}
                        aria-label="Mais informações sobre a clínica"
                      >
                        ?
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          gap: 10,
                        }}
                      >
                        {clinicTimes.map((slotTime) => {
                          const active = selectedSlot === slotTime;
                          const slotKey = `${option.id}_${slotTime}`;
                          const slotId = slotIdByKey[slotKey];
                          const used = slotId ? (slotUsage[slotId] || 0) : 0;
                          const capacity = slotCapacity[slotKey] || 12;
                          const isFull = used >= capacity;

                          return (
                            <button
                              key={slotTime}
                              type="button"
                              onClick={() => {
                                if (!isFull) {
                                  selectClinicSlot(option.id, slotTime);
                                }
                              }}
                              disabled={isFull}
                              style={{
                                borderRadius: 14,
                                border: isFull
                                  ? "1px solid #fecaca"
                                  : active
                                    ? "1px solid #2563eb"
                                    : "1px solid #dbe2ea",
                                background: isFull
                                  ? "#fff5f5"
                                  : active
                                    ? "#dbeafe"
                                    : "#ffffff",
                                color: isFull
                                  ? "#b91c1c"
                                  : active
                                    ? "#1d4ed8"
                                    : "#0f172a",
                                padding: "12px 10px",
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: isFull ? "not-allowed" : "pointer",
                                fontFamily: "Calibri, Arial, sans-serif",
                                boxShadow: active && !isFull ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "none",
                                opacity: isFull ? 0.9 : 1,
                                display: "grid",
                                gap: 4,
                                justifyItems: "center",
                              }}
                            >
                              <span>{slotTime}</span>
                              {isFull && (
                                <span style={{ fontSize: 11, fontWeight: 700 }}>
                                  FULL
                                </span>
                              )}
                              {!isFull && capacity - used <= 3 && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309" }}>
                                  Últimas vagas
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
              {summary}
            </p>

            <div
              style={{
                marginTop: 18,
                borderRadius: 18,
                border: "1px solid #bfdbfe",
                background: "linear-gradient(180deg, #f0f7ff 0%, #eaf3ff 100%)",
                padding: 18,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, color: "#334155" }}>Valor original</span>
                <span style={{ fontSize: 14, color: "#0f172a" }}>${originalTotal.toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, color: "#334155" }}>Desconto</span>
                <span style={{ fontSize: 14, color: discount > 0 ? "#16a34a" : "#0f172a" }}>
                  ${discount.toFixed(2)}
                </span>
              </div>

              <div
                style={{
                  height: 1,
                  background: "rgba(148, 163, 184, 0.35)",
                  margin: "2px 0 4px",
                }}
              />

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
                  Valor final
                </p>

                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: 38,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  ${total.toFixed(2)}
                </p>
              </div>
            </div>

            <p
              style={{
                marginTop: 16,
                color: "#475569",
                lineHeight: 1.8,
                fontSize: 15,
              }}
            >
              O pagamento será por Zelle. Faça o upload do comprovante para confirmar sua inscrição no valor indicado acima.
            </p>
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>Por favor, realize o pagamento via <u>Zelle para platformsports1@gmail.com</u> no valor indicado acima e anexe o comprovante.</label>
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

        {clinicInfoOpen && (
          <div
            onClick={() => setClinicInfoOpen(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 9999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 560,
                background: "#ffffff",
                borderRadius: 22,
                padding: 24,
                boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  Informações sobre a clínica
                </h3>

                <button
                  type="button"
                  onClick={() => setClinicInfoOpen(null)}
                  style={{
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    borderRadius: 12,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontFamily: "Calibri, Arial, sans-serif",
                  }}
                >
                  Fechar
                </button>
              </div>

              <div
                style={{
                  color: "#475569",
                  lineHeight: 1.8,
                  fontSize: 15,
                }}
              >
                <p style={{ marginTop: 0 }}>
                  A clínica de Beach Tennis é um treinamento guiado pelo coach Rodrigo Batista,
                  desenvolvido para jogadores de todos os níveis.
                </p>

                <p>
                  Durante a sessão, serão disponibilizados equipamentos para a aula e orientação
                  técnica focada em:
                </p>

                <ul style={{ paddingLeft: 20, marginTop: 0 }}>
                  <li>Fundamentos do jogo</li>
                  <li>Posicionamento em quadra</li>
                  <li>Técnicas de ataque e defesa</li>
                  <li>Movimentação e tomada de decisão</li>
                </ul>

                <p style={{ marginBottom: 0 }}>
                  A clínica é uma excelente oportunidade para evoluir no esporte, corrigir detalhes
                  técnicos e ganhar mais confiança para competir no torneio. Ideal tanto para
                  iniciantes quanto para jogadores intermediários que querem melhorar seu desempenho.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





















