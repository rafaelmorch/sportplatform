"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

/* ================= Types ================= */

type AppEventRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string | null;
  sport: string | null;
  capacity: number | null;
  waitlist_capacity: number;
  price_cents: number;
  organizer_whatsapp: string | null;
  published: boolean;
  updated_at: string;
  location_name: string | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  street: string | null;
  city: string | null;
  state: string | null;
  image_path: string | null;
  organizer_id: string | null;
  series_id: string | null;
  series_index: number | null;
  contact_email: string | null;
};

type FieldType = "text" | "email" | "phone" | "date" | "select" | "checkbox";

type FormField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  // para select
  options?: Array<{ label: string; value: string }>;
};

type ValuesMap = Record<string, string | boolean | null | undefined>;

/* ================= Utils ================= */

function formatDateTime(dt: string | null): string {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dt;
  }
}

function dollarsFromCents(cents: number): string {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// ✅ converter para valor aceito por <input value> e <select value>
// - select SEMPRE string
// - checkbox SEMPRE boolean
function toInputValue(type: FieldType, v: unknown): string | boolean {
  if (type === "checkbox") return Boolean(v);

  // daqui pra baixo: precisa ser string
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : ""; // ✅ NUNCA false
  return "";
}

function normalizePhone(s: string): string {
  return s.replace(/[^\d+]/g, "").trim();
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/* ================= Page ================= */

export default function AdminEventRegisterPage() {
  const router = useRouter();
  const { id: eventId } = useParams<{ id: string }>();

  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [eventRow, setEventRow] = useState<AppEventRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Campos do formulário (Admin = você pode ajustar por evento)
  const fields: FormField[] = [
    { key: "participant_name", label: "Participant name", type: "text", required: true, placeholder: "Full name" },
    { key: "participant_birthdate", label: "Birthdate", type: "date", required: true },
    { key: "participant_email", label: "Participant email", type: "email", required: true, placeholder: "name@email.com" },
    { key: "attendee_whatsapp", label: "WhatsApp", type: "phone", required: true, placeholder: "+1 407..." },
    { key: "nickname", label: "Nickname (optional)", type: "text", required: false, placeholder: "Nickname" },

    // exemplo de campo custom (select)
    {
      key: "shirt_size",
      label: "T-shirt size",
      type: "select",
      required: false,
      options: [
        { label: "—", value: "" },
        { label: "S", value: "S" },
        { label: "M", value: "M" },
        { label: "L", value: "L" },
        { label: "XL", value: "XL" },
      ],
    },

    // exemplo checkbox
    { key: "accept_terms", label: "I agree to the terms", type: "checkbox", required: true },
  ];

  const [values, setValues] = useState<ValuesMap>(() => {
    const init: ValuesMap = {};
    for (const f of fields) {
      init[f.key] = f.type === "checkbox" ? false : "";
    }
    return init;
  });

  function setField(key: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setInfo(null);

      // 1) precisa estar logado e ser admin
      const { data: sessionRes, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) {
        setError(sessErr.message);
        setLoading(false);
        return;
      }
      if (!sessionRes.session) {
        router.replace("/login");
        return;
      }

      const userId = sessionRes.session.user.id;

      const { data: adminRow, error: adminErr } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (adminErr) {
        setError("Erro ao validar permissões de admin.");
        setLoading(false);
        return;
      }
      if (!adminRow) {
        router.replace("/");
        return;
      }

      // 2) carregar evento
      const { data, error } = await supabase
        .from("app_events")
        .select(
          "id,title,description,date,location,image_url,created_by,created_at,sport,capacity,waitlist_capacity,price_cents,organizer_whatsapp,published,updated_at,location_name,address_text,lat,lng,street,city,state,image_path,organizer_id,series_id,series_index,contact_email"
        )
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (error) {
        setError(error.message || "Failed to load event.");
        setEventRow(null);
      } else {
        setEventRow(data as AppEventRow);
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [supabase, eventId, router]);

  function validate(): string | null {
    for (const f of fields) {
      const raw = values[f.key];

      if (f.required) {
        if (f.type === "checkbox") {
          if (raw !== true) return `Please accept: ${f.label}`;
        } else {
          const s = String(raw ?? "").trim();
          if (!s) return `Missing: ${f.label}`;
        }
      }

      if (f.type === "email") {
        const s = String(raw ?? "").trim();
        if (s && !isEmail(s)) return "Invalid email.";
      }
    }
    return null;
  }

  async function handleSaveTestRegistration() {
    if (!eventRow) return;

    setSaving(true);
    setError(null);
    setInfo(null);

    const vErr = validate();
    if (vErr) {
      setError(vErr);
      setSaving(false);
      return;
    }

    try {
      const payload: any = {
        event_id: eventRow.id,
        status: "registered",
        payment_provider: "manual",
        payment_status: eventRow.price_cents > 0 ? "unpaid" : "free",
        amount_cents: eventRow.price_cents ?? 0,
        currency: "USD",

        // mapeamento para colunas existentes (você mostrou a lista)
        nickname: String(values.nickname ?? "").trim() || null,
        attendee_whatsapp: normalizePhone(String(values.attendee_whatsapp ?? "")),
        attendee_name: String(values.participant_name ?? "").trim(),
        attendee_email: String(values.participant_email ?? "").trim(),
        payer_email: String(values.participant_email ?? "").trim(),
        payer_phone: normalizePhone(String(values.attendee_whatsapp ?? "")),
        participant_name: String(values.participant_name ?? "").trim(),
        participant_birthdate: String(values.participant_birthdate ?? "").trim() || null,

        // extras (se sua tabela tiver json, aqui não tem; então só guardamos no nickname por enquanto)
        // se você quiser guardar campos variáveis de verdade, a gente cria uma coluna jsonb depois.
      };

      const { error: insErr } = await supabase.from("app_event_registrations").insert(payload);
      if (insErr) throw new Error(insErr.message);

      setInfo("Registration saved (test).");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save registration.");
    } finally {
      setSaving(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#020617",
    color: "#e5e7eb",
    padding: 16,
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "radial-gradient(circle at top left, #020617, #020617 55%, #000 100%)",
    padding: 14,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(2,6,23,0.65)",
    color: "#e5e7eb",
    outline: "none",
    fontSize: 13,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#93c5fd",
    marginBottom: 6,
    fontWeight: 700,
  };

  if (loading) {
    return (
      <main style={containerStyle}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading…</p>
        </div>
      </main>
    );
  }

  if (!eventRow) {
    return (
      <main style={containerStyle}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 13, color: "#fca5a5" }}>{error ?? "Event not found."}</p>
          <Link href="/admin/events" style={{ color: "#93c5fd", textDecoration: "underline", fontSize: 13 }}>
            Back
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={containerStyle}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => router.push("/admin/events")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(2,6,23,0.65)",
                color: "#e5e7eb",
                cursor: "pointer",
                fontSize: 18,
                fontWeight: 900,
                lineHeight: "40px",
              }}
              aria-label="Back"
              title="Back"
            >
              ←
            </button>

            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
                Admin • Registration (test)
              </p>
              <h1 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 0 0" }}>{eventRow.title}</h1>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0 0" }}>
                {formatDateTime(eventRow.date)} • {eventRow.location_name || eventRow.location || "—"} •{" "}
                <span style={{ color: "#e5e7eb", fontWeight: 800 }}>{dollarsFromCents(eventRow.price_cents ?? 0)}</span>
              </p>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/events/${eventRow.id}/register`} style={{ color: "#93c5fd", textDecoration: "underline", fontSize: 13 }}>
                Open public register
              </Link>
            </div>
          </div>
        </header>

        {error ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p> : null}
        {info ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{info}</p> : null}

        <section style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>Form</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "8px 0 14px 0" }}>
            Isso aqui é para testar o fluxo e salvar uma inscrição no Supabase.
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            {fields.map((f) => {
              const commonLabel = (
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{f.label}</span>
                  {f.required ? <span style={{ color: "#fda4af", fontWeight: 900 }}>*</span> : null}
                </div>
              );

              if (f.type === "checkbox") {
                return (
                  <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(toInputValue("checkbox", values[f.key]))}
                      onChange={(e) => setField(f.key, e.target.checked)}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 13, color: "#e5e7eb" }}>{f.label}</span>
                  </label>
                );
              }

              if (f.type === "select") {
                const v = toInputValue("select", values[f.key]); // ✅ sempre string
                return (
                  <div key={f.key}>
                    <div style={labelStyle}>{commonLabel}</div>
                    <select value={v as string} onChange={(e) => setField(f.key, e.target.value)} style={inputStyle}>
                      {(f.options ?? [{ label: "—", value: "" }]).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              const htmlType =
                f.type === "email" ? "email" : f.type === "phone" ? "tel" : f.type === "date" ? "date" : "text";

              const v = toInputValue(f.type, values[f.key]) as string;

              return (
                <div key={f.key}>
                  <div style={labelStyle}>{commonLabel}</div>
                  <input
                    type={htmlType}
                    value={v}
                    placeholder={f.placeholder ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    style={inputStyle}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button
              onClick={handleSaveTestRegistration}
              disabled={saving}
              style={{
                borderRadius: 999,
                padding: "10px 18px",
                border: "none",
                fontSize: 13,
                fontWeight: 900,
                background: "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
                color: "#0b1120",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Save test registration"}
            </button>

            <Link
              href="/admin/events"
              style={{
                borderRadius: 999,
                padding: "10px 18px",
                border: "1px solid rgba(148,163,184,0.35)",
                fontSize: 13,
                fontWeight: 900,
                color: "#e5e7eb",
                textDecoration: "none",
                background: "rgba(2,6,23,0.55)",
              }}
            >
              Back
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
