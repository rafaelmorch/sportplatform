"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Registration = {
  id: string;
  created_at: string;
  participant_1_name: string;
  participant_2_name: string;
  contact_email: string;
  contact_phone: string;
  category: string;
  level: string | null;
  shirt_size_participant_1: string;
  shirt_size_participant_2: string;
  selected_options: string[];
  selection_summary: string | null;
  total_amount: number;
  payment_proof_path: string | null;
  confirmation_code: string | null;
  status: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BeachTennisAdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");

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
    async function loadRegistrations() {
      if (!authorized) return;

      setLoadingData(true);

      const { data, error } = await supabase
        .from("beach_tennis_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRegistrations(data as Registration[]);
      } else {
        setError("Não foi possível carregar as inscrições.");
      }

      setLoadingData(false);
    }

    loadRegistrations();
  }, [authorized]);

  const filteredRegistrations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return registrations;

    return registrations.filter((item) => {
      return (
        item.participant_1_name?.toLowerCase().includes(term) ||
        item.participant_2_name?.toLowerCase().includes(term) ||
        item.contact_email?.toLowerCase().includes(term) ||
        item.contact_phone?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.level?.toLowerCase().includes(term) ||
        item.confirmation_code?.toLowerCase().includes(term) ||
        item.selection_summary?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term)
      );
    });
  }, [registrations, search]);

  function exportToCsv() {
    if (!filteredRegistrations.length) return;

    const headers = [
      "Codigo",
      "Data",
      "Participante 1",
      "Participante 2",
      "Email",
      "Telefone",
      "Categoria",
      "Nivel",
      "Camisa Participante 1",
      "Camisa Participante 2",
      "Resumo",
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
      item.participant_1_name,
      item.participant_2_name,
      item.contact_email,
      item.contact_phone,
      item.category,
      item.level || "",
      item.shirt_size_participant_1,
      item.shirt_size_participant_2,
      item.selection_summary || "",
      Number(item.total_amount).toFixed(2),
      item.status,
      item.payment_proof_path || "",
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inscricoes-beach-tennis.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function openProof(path: string | null) {
    if (!path) return;

    const { data, error } = await supabase.storage
      .from("registration-proofs")
      .createSignedUrl(path, 60);

    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      alert("Não foi possível abrir o comprovante.");
    }
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #edf3fb 100%)",
    padding: "32px 16px",
    fontFamily: "Calibri, Arial, sans-serif",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #dbe3ee",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "14px 16px",
    fontSize: 15,
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
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
      <div
        style={{
          ...pageStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ ...cardStyle, maxWidth: 460 }}>
          <h1
            style={{
              margin: 0,
              marginBottom: 12,
              fontSize: 28,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Portal de Inscrições
          </h1>

          <p
            style={{
              marginTop: 0,
              marginBottom: 18,
              color: "#475569",
              lineHeight: 1.7,
              fontSize: 15,
            }}
          >
            Digite a senha para acessar as inscrições do Beach Tennis.
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
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 18 }}>
        <div style={cardStyle}>
          <h1
            style={{
              margin: 0,
              marginBottom: 12,
              fontSize: 30,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Portal de Inscrições
          </h1>

          <p
            style={{
              margin: 0,
              color: "#475569",
              lineHeight: 1.7,
              fontSize: 16,
            }}
          >
            Área dos organizadores para visualizar as inscrições do Beach Tennis.
          </p>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div style={{ flex: "1 1 320px", maxWidth: 420 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, email, código, categoria..."
                style={inputStyle}
              />
            </div>

            <button
              type="button"
              onClick={exportToCsv}
              style={secondaryButtonStyle}
            >
              Exportar para Excel
            </button>
          </div>

          {loadingData ? (
            <p style={{ margin: 0, color: "#475569" }}>Carregando inscrições...</p>
          ) : filteredRegistrations.length === 0 ? (
            <p style={{ margin: 0, color: "#475569" }}>Nenhuma inscrição encontrada.</p>
          ) : (
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                background: "#ffffff",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                  color: "#111827",
                  minWidth: 1500,
                }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Código</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Participante 1</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Participante 2</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Email</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Telefone</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Categoria</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Nível</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Camisa P1</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Camisa P2</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Resumo</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Valor</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Status</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Data</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Comprovante</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRegistrations.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <td style={{ padding: 12 }}>{item.confirmation_code || "-"}</td>
                      <td style={{ padding: 12 }}>{item.participant_1_name}</td>
                      <td style={{ padding: 12 }}>{item.participant_2_name}</td>
                      <td style={{ padding: 12 }}>{item.contact_email}</td>
                      <td style={{ padding: 12 }}>{item.contact_phone}</td>
                      <td style={{ padding: 12 }}>{item.category}</td>
                      <td style={{ padding: 12 }}>{item.level || "-"}</td>
                      <td style={{ padding: 12 }}>{item.shirt_size_participant_1}</td>
                      <td style={{ padding: 12 }}>{item.shirt_size_participant_2}</td>
                      <td style={{ padding: 12 }}>{item.selection_summary || "-"}</td>
                      <td style={{ padding: 12 }}>${Number(item.total_amount).toFixed(2)}</td>
                      <td style={{ padding: 12 }}>{item.status}</td>
                      <td style={{ padding: 12 }}>{new Date(item.created_at).toLocaleString()}</td>
                      <td style={{ padding: 12 }}>
                        {item.payment_proof_path ? (
                          <button
                            type="button"
                            onClick={() => openProof(item.payment_proof_path)}
                            style={secondaryButtonStyle}
                          >
                            Ver arquivo
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
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
