"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

/* ================= Types ================= */

type FieldType = "text" | "textarea" | "select" | "checkbox" | "number" | "date";

type EventField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

type AppEventRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  published: boolean;
};

type RegistrationValues = Record<string, string | number | boolean | null>;

/* ================= Utils ================= */

function toInputValue(
  kind: "text" | "textarea" | "select" | "number" | "date",
  v: unknown
): string {
  if (v === null || v === undefined) return "";

  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "boolean") return v ? "true" : "false";

  return String(v);
}

/* ================= Page ================= */

export default function AdminEventRegisterPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const supabase = useMemo(() => supabaseBrowser, []);

  const [event, setEvent] = useState<AppEventRow | null>(null);
  const [fields, setFields] = useState<EventField[]>([]);
  const [values, setValues] = useState<RegistrationValues>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ================= Load ================= */

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("app_events")
        .select("id,title,description,date,published")
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const row: AppEventRow = {
        id: data.id,
        title: data.title,
        description: data.description ?? null,
        date: data.date,
        published: data.published,
      };

      setEvent(row);

      // 🔧 Campos dinâmicos de exemplo (depois vem do banco)
      const defaultFields: EventField[] = [
        { key: "attendee_name", label: "Nome completo", type: "text", required: true },
        { key: "attendee_email", label: "Email", type: "text", required: true },
        { key: "attendee_whatsapp", label: "WhatsApp", type: "text", required: true },
        {
          key: "shirt_size",
          label: "Tamanho da camiseta",
          type: "select",
          options: ["P", "M", "G", "GG"],
        },
        { key: "accept_terms", label: "Aceito os termos", type: "checkbox", required: true },
      ];

      setFields(defaultFields);

      const initialValues: RegistrationValues = {};
      defaultFields.forEach((f) => {
        initialValues[f.key] = f.type === "checkbox" ? false : "";
      });

      setValues(initialValues);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, supabase]);

  /* ================= Handlers ================= */

  function setField(key: string, value: string | number | boolean) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit() {
    if (!eventId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        event_id: eventId,
        ...values,
      };

      const { error } = await supabase.from("app_event_registrations").insert(payload);

      if (error) throw error;

      setSuccess("Inscrição salva com sucesso!");
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar inscrição");
    } finally {
      setSaving(false);
    }
  }

  /* ================= Render ================= */

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#020617", color: "#9ca3af", padding: 16 }}>
        Carregando…
      </main>
    );
  }

  if (!event) {
    return (
      <main style={{ minHeight: "100vh", background: "#020617", color: "#fca5a5", padding: 16 }}>
        Evento não encontrado
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", padding: 16 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button
          onClick={() => router.push(`/admin/events/${eventId}`)}
          style={{ marginBottom: 12, background: "none", color: "#93c5fd", border: "none" }}
        >
          ← Voltar
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{event.title}</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
          Página de inscrição (admin)
        </p>

        {error && <p style={{ color: "#fca5a5" }}>{error}</p>}
        {success && <p style={{ color: "#86efac" }}>{success}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map((f) => {
            const commonLabel = (
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                {f.label}
                {f.required && <span style={{ color: "#f87171" }}> *</span>}
              </label>
            );

            if (f.type === "checkbox") {
              return (
                <div key={f.key}>
                  {commonLabel}
                  <input
                    type="checkbox"
                    checked={!!values[f.key]}
                    onChange={(e) => setField(f.key, e.target.checked)}
                  />
                </div>
              );
            }

            if (f.type === "select") {
              return (
                <div key={f.key}>
                  {commonLabel}
                  <select
                    value={toInputValue("select", values[f.key])}
                    onChange={(e) => setField(f.key, e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                  >
                    <option value="">Selecione</option>
                    {f.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={f.key}>
                {commonLabel}
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={toInputValue(f.type === "number" ? "number" : "text", values[f.key])}
                  onChange={(e) => setField(f.key, e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            marginTop: 20,
            padding: "12px 18px",
            borderRadius: 999,
            fontWeight: 800,
            background: "linear-gradient(to right, #38bdf8, #0ea5e9)",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Salvando…" : "Salvar inscrição"}
        </button>
      </div>
    </main>
  );
}
