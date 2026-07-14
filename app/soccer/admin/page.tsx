"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Registration = {
  id: string;
  created_at: string;
  confirmation_code: string;
  team_name: string;
  responsible_name: string;
  contact_email: string;
  contact_phone: string;
  total_amount: number;
  status: string;
  payment_proof_path: string | null;
  payment_proof_url: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SoccerAdminPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      setError("");

      const result = await supabase
        .from("soccer_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("RESULT:", result);

      const { data, error: loadError } = result;

      console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("SOCCER ADMIN DATA:", data);
      console.log("SOCCER ADMIN ERROR:", loadError);

      if (loadError) {
        console.error("SOCCER ADMIN ERROR:", loadError);
        setError("Não foi possível carregar as inscrições.");
      } else {
        setRegistrations((data || []) as Registration[]);
      }

      setLoadingData(false);
    }

    loadRegistrations();
  }, [authorized]);

  const filteredRegistrations = useMemo(() => {
    const term = search.trim().toLowerCase();

    const byStatus =
      statusFilter === "all"
        ? registrations
        : registrations.filter((item) => item.status === statusFilter);

    if (!term) return byStatus;

    return byStatus.filter((item) => {
      return (
        item.team_name?.toLowerCase().includes(term) ||
        item.responsible_name?.toLowerCase().includes(term) ||
        item.contact_email?.toLowerCase().includes(term) ||
        item.contact_phone?.toLowerCase().includes(term) ||
        item.confirmation_code?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term)
      );
    });
  }, [registrations, search, statusFilter]);

  const approvedRegistrations = registrations.filter(
    (item) => item.status === "approved"
  );

  const confirmedTotal = approvedRegistrations.reduce(
    (sum, item) => sum + Number(item.total_amount || 0),
    0
  );

  function getStatusLabel(status: string) {
    if (status === "approved") return "Aprovada";
    if (status === "submitted") return "Aguardando confirmação";
    return status;
  }

  async function updateStatus(id: string, status: "submitted" | "approved") {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch("/api/soccer-registration/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar a inscrição.");
      }

      setRegistrations((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar a inscrição."
      );
    } finally {
      setUpdatingId(null);
    }
  }
  function exportToCsv() {
    if (!filteredRegistrations.length) return;

    const headers = [
      "Codigo",
      "Data",
      "Nome do Time",
      "Responsavel",
      "Email",
      "Telefone",
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
      new Date(item.created_at).toLocaleString("pt-BR"),
      item.team_name,
      item.responsible_name,
      item.contact_email,
      item.contact_phone,
      Number(item.total_amount).toFixed(2),
      item.status,
      item.payment_proof_url || item.payment_proof_path || "",
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "inscricoes-campeonato-futebol.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function openProof(
    path: string | null,
    publicUrl: string | null
  ) {
    if (publicUrl) {
      window.open(publicUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!path) {
      alert("Comprovante não encontrado.");
      return;
    }

    const { data, error: proofError } = await supabase.storage
      .from("registration-proofs")
      .createSignedUrl(path, 60);

    if (!proofError && data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }

    alert("Não foi possível abrir o comprovante.");
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
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "14px 16px",
    fontSize: 16,
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

  const cellStyle: React.CSSProperties = {
    padding: 12,
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "middle",
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
            Digite a senha para acessar as inscrições do campeonato.
          </p>

          <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              style={inputStyle}
              required
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
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
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
            Inscrições do Campeonato de Futebol
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
              marginTop: 18,
            }}
          >
            <div>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                Total de equipes
              </div>
              <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 700 }}>
                {registrations.length}
              </div>
            </div>

            <div>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                Inscrições aprovadas
              </div>
              <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 700 }}>
                {approvedRegistrations.length}
              </div>
            </div>

            <div>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                Valor confirmado
              </div>
              <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 700 }}>
                US$ {confirmedTotal.toFixed(2)}
              </div>
            </div>
          </div>
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
            <div
              style={{
                display: "flex",
                gap: 12,
                flex: "1 1 520px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 300px" }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por time, responsável, e-mail ou código..."
                  style={inputStyle}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  ...inputStyle,
                  width: "auto",
                  minWidth: 210,
                }}
              >
                <option value="all">Todos os status</option>
                <option value="submitted">Aguardando confirmação</option>
                <option value="approved">Aprovadas</option>
              </select>
            </div>

            <button
              type="button"
              onClick={exportToCsv}
              style={secondaryButtonStyle}
            >
              Exportar para Excel
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 18,
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

          {loadingData ? (
            <p style={{ margin: 0, color: "#475569" }}>
              Carregando inscrições...
            </p>
          ) : filteredRegistrations.length === 0 ? (
            <p style={{ margin: 0, color: "#475569" }}>
              Nenhuma inscrição encontrada.
            </p>
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
                  minWidth: 1050,
                }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={cellStyle}>Código</th>
                    <th style={cellStyle}>Nome do Time</th>
                    <th style={cellStyle}>Responsável</th>
                    <th style={cellStyle}>E-mail</th>
                    <th style={cellStyle}>Telefone</th>
                    <th style={cellStyle}>Valor</th>
                    <th style={cellStyle}>Status</th>
                    <th style={cellStyle}>Data</th>
                                        <th style={cellStyle}>Comprovante</th>
                    <th style={cellStyle}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRegistrations.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        background:
                          index % 2 === 0 ? "#ffffff" : "#f8fafc",
                      }}
                    >
                      <td style={cellStyle}>
                        <strong>{item.confirmation_code || "-"}</strong>
                      </td>

                      <td style={cellStyle}>{item.team_name}</td>

                      <td style={cellStyle}>{item.responsible_name}</td>

                      <td style={cellStyle}>{item.contact_email}</td>

                      <td style={cellStyle}>{item.contact_phone}</td>

                      <td style={cellStyle}>
                        US$ {Number(item.total_amount).toFixed(2)}
                      </td>

                      <td style={cellStyle}>{getStatusLabel(item.status)}</td>

                      <td style={cellStyle}>
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </td>

                      <td style={cellStyle}>
                        {item.payment_proof_path ? (
                          <button
                            type="button"
                            onClick={() =>
                              openProof(item.payment_proof_path, item.payment_proof_url)
                            }
                            style={secondaryButtonStyle}
                          >
                            Ver arquivo
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td style={cellStyle}>
                        {item.status === "approved" ? (
                          <button
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => updateStatus(item.id, "submitted")}
                            style={secondaryButtonStyle}
                          >
                            {updatingId === item.id
                              ? "Atualizando..."
                              : "Voltar para pendente"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => updateStatus(item.id, "approved")}
                            style={buttonStyle}
                          >
                            {updatingId === item.id
                              ? "Atualizando..."
                              : "Aprovar inscrição"}
                          </button>
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




