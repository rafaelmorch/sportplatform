// app/events/[id]/register/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type AppEventRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  location_name: string | null;
  address_text: string | null;
  city: string | null;
  state: string | null;
  image_path: string | null;
  image_url: string | null; // legado
  published: boolean;
  price_cents: number;
  currency: string | null;
  capacity: number | null;
  contact_email: string | null;
  organizer_whatsapp: string | null;
  registration_schema: any; // jsonb
};

type SchemaField = {
  key: string;
  label?: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "number"
    | "select"
    | "textarea"
    | "checkbox";
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  defaultValue?: any;
};

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

// ✅ bucket padrão já usado no projeto
function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseBrowser.storage.from("event-images").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function safeSchema(raw: any): SchemaField[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as SchemaField[];
  // caso venha string JSON
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SchemaField[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toInputValue(type: SchemaField["type"], v: any) {
  if (type === "checkbox") return !!v;
  if (v == null) return "";
  return String(v);
}

function isBlank(v: any) {
  return v == null || String(v).trim().length === 0;
}

export default function EventRegisterPage() {
  const router = useRouter();
  const { id: eventId } = useParams<{ id: string }>();

  const supabase = useMemo(() => supabaseBrowser, []);

  const [event, setEvent] = useState<AppEventRow | null>(null);
  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Load event + schema
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setInfo(null);

      const { data, error } = await supabase
        .from("app_events")
        .select(
          "id,title,description,date,location,location_name,address_text,city,state,image_path,image_url,published,price_cents,currency,capacity,contact_email,organizer_whatsapp,registration_schema"
        )
        .eq("id", eventId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setError(error.message || "Failed to load event.");
        setEvent(null);
        setSchema([]);
        setValues({});
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Event not found.");
        setEvent(null);
        setSchema([]);
        setValues({});
        setLoading(false);
        return;
      }

      const ev = data as AppEventRow;

      if (!ev.published) {
        setError("This event is not published.");
        setEvent(ev);
        setSchema([]);
        setValues({});
        setLoading(false);
        return;
      }

      const fields = safeSchema((ev as any).registration_schema);

      // defaults
      const initial: Record<string, any> = {};
      for (const f of fields) {
        initial[f.key] = f.type === "checkbox" ? !!f.defaultValue : (f.defaultValue ?? "");
      }

      // Alguns padrões úteis (se existirem no schema, já preenche)
      if (initial["currency"] == null && ev.currency) initial["currency"] = ev.currency;

      setEvent(ev);
      setSchema(fields);
      setValues(initial);

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

  const heroImg =
    getPublicImageUrl(event?.image_path ?? null) || event?.image_url || null;

  function setField(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function validate(): string | null {
    if (!event) return "Event not loaded.";

    // Regras mínimas (mesmo que o schema não tenha)
    // (Você pode remover se quiser 100% schema-driven)
    // Mas como você quer sem login, pelo menos um email é essencial pro recibo/contato.
    const mustHaveOneEmail =
      !isBlank(values["payer_email"]) ||
      !isBlank(values["attendee_email"]) ||
      !isBlank(values["participant_email"]);

    if (!mustHaveOneEmail) {
      return "Please provide an email (payer or attendee).";
    }

    for (const f of schema) {
      if (!f.required) continue;

      if (f.type === "checkbox") {
        if (!values[f.key]) return `${f.label ?? f.key} is required.`;
      } else {
        if (isBlank(values[f.key])) return `${f.label ?? f.key} is required.`;
      }
    }

    return null;
  }

  async function handleSubmit() {
    if (!eventId || !event) return;

    setError(null);
    setInfo(null);

    const vErr = validate();
    if (vErr) {
      setError(vErr);
      return;
    }

    setSubmitting(true);

    try {
      const currency = (event.currency ?? "USD").toUpperCase();
      const amountCents = Number(event.price_cents ?? 0);

      // 1) cria inscrição (pending)
      // OBS: sua tabela tem muitos campos — aqui salvamos alguns comuns + payload completo em "form_data" (se existir).
      // Se você NÃO tem coluna form_data, tudo bem: vamos tentar inserir sem ela.
      const baseInsert: any = {
        event_id: eventId,
        status: "pending",
        payment_provider: amountCents > 0 ? "stripe" : null,
        payment_status: amountCents > 0 ? "pending" : "free",
        amount_cents: amountCents,
        currency,
        attendee_name: values["attendee_name"] ?? values["participant_name"] ?? null,
        attendee_email: values["attendee_email"] ?? values["payer_email"] ?? null,
        payer_email: values["payer_email"] ?? values["attendee_email"] ?? null,
        payer_phone: values["payer_phone"] ?? values["attendee_whatsapp"] ?? null,
        attendee_whatsapp: values["attendee_whatsapp"] ?? null,
        participant_name: values["participant_name"] ?? null,
        participant_birthdate: values["participant_birthdate"] ?? null,
      };

      // tenta inserir com form_data se existir
      let regId: string | null = null;

      {
        const { data: ins1, error: err1 } = await supabase
          .from("app_event_registrations")
          .insert([{ ...baseInsert, form_data: values }])
          .select("id")
          .maybeSingle();

        if (!err1 && ins1?.id) {
          regId = ins1.id as string;
        } else {
          // fallback: sem form_data (caso coluna não exista)
          const { data: ins2, error: err2 } = await supabase
            .from("app_event_registrations")
            .insert([baseInsert])
            .select("id")
            .maybeSingle();

          if (err2) {
            throw new Error(err2.message || "Failed to create registration.");
          }
          regId = (ins2?.id as string) ?? null;
        }
      }

      if (!regId) throw new Error("Registration id not returned.");

      // 2) se for FREE, confirma e manda pra página de sucesso
      if (amountCents <= 0) {
        setInfo("Registration completed.");
        router.replace(`/events/${eventId}?registered=1`);
        return;
      }

      // 3) cria checkout session (server)
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          registrationId: regId,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload?.message || "Failed to start checkout.");
      }

      const url = payload?.url as string | undefined;
      if (!url) throw new Error("Checkout URL not returned.");

      // 4) redireciona pro Stripe
      window.location.href = url;
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  }

  const locationLine = [
    (event?.location_name ?? "").trim(),
    (event?.address_text ?? "").trim(),
    [event?.city, event?.state].filter(Boolean).join(", ").trim(),
  ]
    .filter((x) => x && x.length)
    .join(" • ") || "—";

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", padding: 16 }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <header style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => router.push(`/events/${eventId}`)}
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

          <div style={{ marginTop: 10 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b" }}>
              Registration
            </p>
            <h1 style={{ margin: "6px 0 0 0", fontSize: 24, fontWeight: 900 }}>
              {loading ? "Loading..." : (event?.title ?? "Event")}
            </h1>
            <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
              {formatDateTime(event?.date ?? null)} • {locationLine}
            </p>
          </div>
        </header>

        {error ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p>
        ) : null}
        {info ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{info}</p>
        ) : null}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* hero image */}
          <div
            style={{
              width: "100%",
              height: 220,
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.25)",
              overflow: "hidden",
              background: "rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {heroImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImg}
                alt={event?.title ?? "event image"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>No image</span>
            )}
          </div>

          {/* price */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.5)",
                background: "linear-gradient(135deg, rgba(8,47,73,0.9), rgba(12,74,110,0.9))",
                color: "#e0f2fe",
                fontWeight: 800,
              }}
            >
              {event ? (event.price_cents > 0 ? dollarsFromCents(event.price_cents) : "Free") : "—"}
            </span>
          </div>

          {/* form */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.25)",
              background: "rgba(2,6,23,0.35)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {loading ? (
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Loading form...</p>
            ) : !event ? (
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Event not available.</p>
            ) : schema.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
                No registration fields configured for this event.
              </p>
            ) : (
              <>
                {schema.map((f) => {
                  const label = f.label ?? f.key;
                  const required = !!f.required;

                  const commonLabel = (
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#60a5fa", fontWeight: 800 }}>
                        {label}
                      </p>
                      {required ? (
                        <span style={{ fontSize: 11, color: "#fca5a5" }}>*</span>
                      ) : null}
                    </div>
                  );

                  const help = f.help ? (
                    <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#94a3b8" }}>{f.help}</p>
                  ) : null;

                  const inputStyle: React.CSSProperties = {
                    width: "100%",
                    marginTop: 6,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    padding: "10px 12px",
                    outline: "none",
                    fontSize: 13,
                  };

                  if (f.type === "select") {
                    return (
                      <div key={f.key}>
                        {commonLabel}
                        <select
                          value={toInputValue("select", values[f.key])}
                          onChange={(e) => setField(f.key, e.target.value)}
                          style={inputStyle}
                        >
                          <option value="">{f.placeholder ?? "Select..."}</option>
                          {(f.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        {help}
                      </div>
                    );
                  }

                  if (f.type === "textarea") {
                    return (
                      <div key={f.key}>
                        {commonLabel}
                        <textarea
                          value={toInputValue("textarea", values[f.key])}
                          onChange={(e) => setField(f.key, e.target.value)}
                          placeholder={f.placeholder ?? ""}
                          style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                        />
                        {help}
                      </div>
                    );
                  }

                  if (f.type === "checkbox") {
                    return (
                      <div key={f.key} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!values[f.key]}
                          onChange={(e) => setField(f.key, e.target.checked)}
                          style={{ width: 18, height: 18, cursor: "pointer" }}
                        />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <p style={{ margin: 0, fontSize: 13, color: "#e5e7eb", fontWeight: 800 }}>
                            {label} {required ? <span style={{ color: "#fca5a5" }}>*</span> : null}
                          </p>
                          {help}
                        </div>
                      </div>
                    );
                  }

                  // default: text-like inputs
                  const htmlType =
                    f.type === "number"
                      ? "number"
                      : f.type === "email"
                      ? "email"
                      : f.type === "tel"
                      ? "tel"
                      : f.type === "date"
                      ? "date"
                      : "text";

                  return (
                    <div key={f.key}>
                      {commonLabel}
                      <input
                        type={htmlType}
                        value={toInputValue(f.type, values[f.key])}
                        onChange={(e) => setField(f.key, e.target.value)}
                        placeholder={f.placeholder ?? ""}
                        style={inputStyle}
                      />
                      {help}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || loading}
                  style={{
                    marginTop: 6,
                    borderRadius: 999,
                    padding: "12px 18px",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 900,
                    background:
                      "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
                    color: "#0b1120",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.75 : 1,
                  }}
                >
                  {submitting
                    ? "Starting payment..."
                    : event.price_cents > 0
                    ? "Continue to payment"
                    : "Complete registration"}
                </button>

                <p style={{ margin: "10px 0 0 0", fontSize: 12, color: "#94a3b8" }}>
                  By registering, you agree to our terms. If you have questions, contact{" "}
                  <span style={{ color: "#e5e7eb" }}>
                    {event.contact_email ?? "the organizer"}
                  </span>.
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
