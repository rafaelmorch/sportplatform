"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type RegistrationRow = {
  id: string;
  created_at: string;
  participant_1_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  confirmation_code: string | null;
  clinic1_slot_id: string | null;
  clinic2_slot_id: string | null;
  total_amount: number | null;
  status: string | null;
  payment_proof_path: string | null;
  payment_proof_url: string | null;
};

type SlotRow = {
  id: string;
  clinic_id: "clinic1" | "clinic2";
  clinic_label: string | null;
  slot_time: string;
  capacity: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BeachTennisClinicAdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [slotsMap, setSlotsMap] = useState<Record<string, SlotRow>>({});
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password === "platform123") {
      setAuthorized(true);
      setError("");
      return;
    }

    setError("Senha incorreta.");
  }

  useEffect(() => {
    async function loadData() {
      if (!authorized) return;

      setLoading(true);
      setError("");

      const [registrationsResult, slotsResult] = await Promise.all([
        supabase
          .from("beach_tennis_registrations")
          .select("id, created_at, participant_1_name, contact_email, contact_phone, confirmation_code, clinic1_slot_id, clinic2_slot_id, total_amount, status, payment_proof_path, payment_proof_url")
          .order("created_at", { ascending: false }),
        supabase
          .from("beach_tennis_clinic_slots")
          .select("id, clinic_id, clinic_label, slot_time, capacity")
          .eq("active", true)
          .order("clinic_id", { ascending: true })
          .order("slot_time", { ascending: true }),
      ]);

      if (registrationsResult.error) {
        setError("Não foi possível carregar as inscrições.");
        setLoading(false);
        return;
      }

      if (slotsResult.error) {
        setError("Não foi possível carregar os horários.");
        setLoading(false);
        return;
      }

      const registrationsData = (registrationsResult.data || []) as RegistrationRow[];
      const slotsData = (slotsResult.data || []) as SlotRow[];

      const nextSlotsMap: Record<string, SlotRow> = {};
      slotsData.forEach((slot) => {
        nextSlotsMap[slot.id] = slot;
      });

      setRegistrations(registrationsData);
      setSlots(slotsData);
      setSlotsMap(nextSlotsMap);
      setLoading(false);
    }

    loadData();
  }, [authorized]);

  const filteredRegistrations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return registrations;

    return registrations.filter((item) => {
      return (
        (item.participant_1_name || "").toLowerCase().includes(term) ||
        (item.contact_email || "").toLowerCase().includes(term) ||
        (item.contact_phone || "").toLowerCase().includes(term) ||
        (item.confirmation_code || "").toLowerCase().includes(term) ||
        (item.status || "").toLowerCase().includes(term) ||
        (slotsMap[item.clinic1_slot_id || ""]?.slot_time || "").toLowerCase().includes(term) ||
        (slotsMap[item.clinic2_slot_id || ""]?.slot_time || "").toLowerCase().includes(term)
      );
    });
  }, [registrations, search, slotsMap]);

  const slotUsage = useMemo(() => {
    const usage: Record<string, number> = {};

    registrations.forEach((item) => {
      if (item.status === "denied") return;

      if (item.clinic1_slot_id) {
        usage[item.clinic1_slot_id] = (usage[item.clinic1_slot_id] || 0) + 1;
      }
      if (item.clinic2_slot_id) {
        usage[item.clinic2_slot_id] = (usage[item.clinic2_slot_id] || 0) + 1;
      }
    });

    return usage;
  }, [registrations]);

  const groupedSlots = useMemo(() => {
    return {
      clinic1: slots.filter((slot) => slot.clinic_id === "clinic1"),
      clinic2: slots.filter((slot) => slot.clinic_id === "clinic2"),
    };
  }, [slots]);

  async function updateRegistrationStatus(id: string, nextStatus: string) {
    setSavingStatusId(id);
    setError("");

    const { error: updateError } = await supabase
      .from("beach_tennis_registrations")
      .update({ status: nextStatus })
      .eq("id", id);

    if (updateError) {
      setError("Não foi possível atualizar o status.");
      setSavingStatusId(null);
      return;
    }

    setRegistrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item
      )
    );

    setSavingStatusId(null);
  }

  function exportToCsv() {
    if (!filteredRegistrations.length) return;

    const headers = [
      "Codigo",
      "Data",
      "Nome",
      "Email",
      "Telefone",
      "Clinica 1",
      "Clinica 2",
      "Valor",
      "Status",
      "Comprovante",
    ];

    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredRegistrations.map((item) => [
      item.confirmation_code || "",
      new Date(item.created_at).toLocaleString(),
      item.participant_1_name || "",
      item.contact_email || "",
      item.contact_phone || "",
      item.clinic1_slot_id ? (slotsMap[item.clinic1_slot_id]?.slot_time || "-") : "-",
      item.clinic2_slot_id ? (slotsMap[item.clinic2_slot_id]?.slot_time || "-") : "-",
      item.total_amount != null ? Number(item.total_amount).toFixed(2) : "",
      item.status || "",
      item.payment_proof_path || "",
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob(["`uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "beachtennis-clinic-inscricoes.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function openProof(path: string | null, fallbackUrl: string | null) {
    if (!path && !fallbackUrl) return;

    if (path) {
      const { data, error } = await supabase.storage
        .from("registration-proofs")
        .createSignedUrl(path, 120);

      if (!error && data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        return;
      }
    }

    if (fallbackUrl) {
      window.open(fallbackUrl, "_blank");
    } else {
      alert("Não foi possível abrir o comprovante.");
    }
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #eef4fb 0%, #f8fbff 100%)",
    padding: "32px 16px 56px",
    fontFamily: "Calibri, Arial, sans-serif",
    color: "#0f172a",
  };

  const shellStyle: React.CSSProperties = {
    maxWidth: 1280,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #dbe5f0",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  };

  const heroStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
    color: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.20)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 14,
    border: "1px solid #d6deea",
    background: "#ffffff",
    padding: "14px 16px",
    fontSize: 15,
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    minWidth: 130,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    padding: "8px 10px",
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Calibri, Arial, sans-serif",
  };

  const buttonStyle: React.CSSProperties = {
    border: 0,
    borderRadius: 14,
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "#ffffff",
    padding: "14px 18px",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "Calibri, Arial, sans-serif",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "Calibri, Arial, sans-serif",
  };

  if (!authorized) {
    return (
      <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...cardStyle, width: "100%", maxWidth: 460 }}>
          <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28, fontWeight: 600, color: "#0f172a" }}>
            Portal de Inscrições
          </h1>

          <p style={{ marginTop: 0, marginBottom: 18, color: "#475569", lineHeight: 1.7, fontSize: 15 }}>
            Digite a senha para acessar as inscrições da clínica.
          </p>

          <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              style={inputStyle}
            />

            {error && (
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #fecaca",
                  background: "#fff5f5",
                  color: "#b91c1c",
                  padding: 12,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <button type="submit" style={buttonStyle}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <div style={heroStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, marginBottom: 8, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.72)" }}>
                Beach Tennis Clinic
              </p>

              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600 }}>
                Painel de inscrições
              </h1>

              <p style={{ marginTop: 10, marginBottom: 0, color: "rgba(255,255,255,0.82)", fontSize: 16, lineHeight: 1.7 }}>
                Acompanhe os inscritos por horário e confira os comprovantes do Zelle.
              </p>
            </div>

            <div style={{ minWidth: 220, borderRadius: 20, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.16)", padding: 18 }}>
              <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(255,255,255,0.70)" }}>
                Total de inscrições
              </p>
              <p style={{ margin: "10px 0 0 0", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
                {registrations.length}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {(["clinic1", "clinic2"] as const).map((clinicId) => {
            const clinicSlots = groupedSlots[clinicId];
            const clinicTitle =
              clinicSlots[0]?.clinic_label ||
              (clinicId === "clinic1" ? "Clínica 1" : "Clínica 2");

            return (
              <div key={clinicId} style={cardStyle}>
                <p style={{ margin: 0, marginBottom: 8, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#2563eb", fontWeight: 700 }}>
                  {clinicId === "clinic1" ? "Dia 1" : "Dia 2"}
                </p>

                <h2 style={{ marginTop: 0, marginBottom: 18, fontSize: 22, fontWeight: 600, color: "#0f172a" }}>
                  {clinicTitle}
                </h2>

                <div style={{ display: "grid", gap: 12 }}>
                  {clinicSlots.map((slot) => {
                    const used = slotUsage[slot.id] || 0;
                    const isFull = used >= slot.capacity;

                    return (
                      <div
                        key={slot.id}
                        style={{
                          borderRadius: 18,
                          border: isFull ? "1px solid #fecaca" : "1px solid #dbe7f4",
                          background: isFull ? "#fff5f5" : "#f8fbff",
                          padding: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                            {slot.slot_time}
                          </p>
                          <p style={{ margin: "6px 0 0 0", fontSize: 14, color: "#64748b" }}>
                            {used} de {slot.capacity} vagas preenchidas
                          </p>
                        </div>

                        <div
                          style={{
                            borderRadius: 999,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            background: isFull ? "#fee2e2" : "#dbeafe",
                            color: isFull ? "#b91c1c" : "#1d4ed8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isFull ? "Full" : used + "/" + slot.capacity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
            <div style={{ flex: "1 1 320px", maxWidth: 420 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, email, telefone, código ou horário..."
                style={inputStyle}
              />
            </div>

            <button type="button" onClick={exportToCsv} style={secondaryButtonStyle}>
              Exportar CSV
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 14,
                borderRadius: 12,
                border: "1px solid #fecaca",
                background: "#fff5f5",
                color: "#b91c1c",
                padding: 12,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <p style={{ margin: 0, color: "#475569" }}>Carregando inscrições...</p>
          ) : filteredRegistrations.length === 0 ? (
            <p style={{ margin: 0, color: "#475569" }}>Nenhuma inscrição encontrada.</p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 18, background: "#ffffff" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1220, color: "#0f172a" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Código</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Nome</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Email</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Telefone</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Clínica 1</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Clínica 2</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Valor</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Status</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Comprovante</th>
                    <th style={{ padding: 14, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>Data</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRegistrations.map((item, index) => (
                    <tr key={item.id} style={{ background: index % 2 === 0 ? "#ffffff" : "#fbfdff", borderBottom: "1px solid #edf2f7" }}>
                      <td style={{ padding: 14, fontWeight: 600 }}>{item.confirmation_code || "-"}</td>
                      <td style={{ padding: 14 }}>{item.participant_1_name || "-"}</td>
                      <td style={{ padding: 14 }}>{item.contact_email || "-"}</td>
                      <td style={{ padding: 14 }}>{item.contact_phone || "-"}</td>
                      <td style={{ padding: 14 }}>
                        {item.clinic1_slot_id ? (slotsMap[item.clinic1_slot_id]?.slot_time || "-") : "-"}
                      </td>
                      <td style={{ padding: 14 }}>
                        {item.clinic2_slot_id ? (slotsMap[item.clinic2_slot_id]?.slot_time || "-") : "-"}
                      </td>
                      <td style={{ padding: 14 }}>
                        {item.total_amount != null ? "$" + Number(item.total_amount).toFixed(2) : "-"}
                      </td>
                      <td style={{ padding: 14 }}>
                        <select
                          value={item.status || "submitted"}
                          onChange={(e) => updateRegistrationStatus(item.id, e.target.value)}
                          disabled={savingStatusId === item.id}
                          style={selectStyle}
                        >
                          <option value="submitted">submitted</option>
                          <option value="approved">approved</option>
                          <option value="denied">denied</option>
                        </select>
                      </td>
                      <td style={{ padding: 14 }}>
                        {item.payment_proof_path || item.payment_proof_url ? (
                          <button
                            type="button"
                            onClick={() => openProof(item.payment_proof_path, item.payment_proof_url)}
                            style={secondaryButtonStyle}
                          >
                            Ver comprovante
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: 14 }}>{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
