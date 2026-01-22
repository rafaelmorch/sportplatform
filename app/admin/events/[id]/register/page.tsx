// app/admin/events/[id]/register/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  image_path: string | null;
  sport: string | null;
  capacity: number | null;
  waitlist_capacity: number;
  price_cents: number;
  currency?: string | null;
  organizer_whatsapp: string | null;
  contact_email: string | null;
  published: boolean;
};

type FieldType = "text" | "email" | "tel" | "number" | "date" | "textarea" | "select" | "checkbox";

type RegistrationField = {
  id: string;
  event_id: string;
  key: string;
  label: string | null;
  type: FieldType;
  required: boolean | null;
  options: string[] | null; // para select
  placeholder: string | null;
  helper_text: string | null;
  sort_order: number | null;
  // valores default opcionais
  default_value: string | null;
  created_at?: string | null;
};

type ValuesState = Record<string, string | number | boolean | null | undefined>;

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
  const v = Math.max(0, cents || 0) / 100;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// ✅ Importante: NUNCA retornar boolean pra value=
// checkbox deve usar checked.
function toInputValue(type: FieldType, v: unknown): string | number {
  if (v === null || v === undefined) {
    // number pode ficar "" também, mas vamos manter string vazia
    return "";
  }

  if (type === "number") {
    if (typeof v === "number") return Number.isFinite(v) ? v : "";
    const n = Number(String(v));
    return Number.isFinite(n) ? n : "";
  }

  // ✅ Todo o resto precisa ser STRING (inclusive textarea/select/date/email/tel/text)
  // checkbox não deveria passar por aqui (porque usa checked), mas se passar, vira string.
  return String(v);
}

function normalizeOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x)).filter(Boolean);
  }
  if (typeof raw === "string") {
    // aceita "a,b,c" ou linhas
    const parts = raw
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts;
  }
  return [];
}

function safeBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["true", "1", "yes", "y", "on"].includes(v.toLowerCase());
  return false;
}

/* ================= Page ================= */

export default function AdminEventRegisterPage() {
  const router = useRouter();
  const { id: eventId } = useParams<{ id: string }>();

  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [event, setEvent] = useState<AppEventRow | null>(null);
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [values, setValues] = useState<ValuesState>({});

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // 1) valida admin + carrega evento + campos
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!eventId) return;

      setLoading(true);
      setError(null);
      setInfo(null);

      // ✅ precisa estar logado e ser admin
      setCheckingAdmin(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      const { data: adminRow, error: adminErr } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (adminErr) {
        console.error(adminErr);
        setError("Erro ao validar permissões de administrador.");
        setCheckingAdmin(false);
        setLoading(false);
        return;
      }

      if (!adminRow) {
        router.replace("/");
        return;
      }

      setCheckingAdmin(false);

      // ✅ carrega evento
      const { data: ev, error: evErr } = await supabase
        .from("app_events")
        .select(
          "id,title,description,date,location,image_url,image_path,sport,capacity,waitlist_capacity,price_cents,organizer_whatsapp,contact_email,published"
        )
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (evErr) {
        console.error(evErr);
        setError(evErr.message || "Falha ao carregar evento.");
        setEvent(null);
        setFields([]);
        setValues({});
        setLoading(false);
        return;
      }

      const safeEvent = ev as AppEventRow;
      setEvent(safeEvent);

      // ✅ carrega campos custom do evento (tabela que você já criou/rodou SQL)
      // Se o nome da tabela for diferente no seu DB, troque aqui.
      const { data: ff, error: ffErr } = await supabase
        .from("app_event_registration_fields")
        .select("id,event_id,key,label,type,required,options,placeholder,helper_text,sort_order,default_value")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      if (ffErr) {
        console.warn("Campos não carregaram:", ffErr);
        // ainda deixa a página funcionar com campos padrão
        setFields([]);
      } else {
        const list = (ff as RegistrationField[]) ?? [];
        setFields(list);

        // defaults
        const initial: ValuesState = {};
        for (const f of list) {
          if (f.type === "checkbox") {
            initial[f.key] = safeBool(f.default_value);
          } else if (f.type === "number") {
            initial[f.key] =
              f.default_value && Number.isFinite(Number(f.default_value)) ? Number(f.default_value) : "";
          } else {
            initial[f.key] = f.default_value ?? "";
          }
        }
        setValues(initial);
      }

      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [eventId, router, supabase]);

  function setField(key: string, v: string | number | boolean) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function validate(): string | null {
    // se você quiser forçar campos básicos, define aqui.
    // Aqui validamos apenas os custom fields marcados como required.
    for (const f of fields) {
      const required = !!f.required;
      if (!required) continue;

      const v = values[f.key];

      if (f.type === "checkbox") {
        if (!safeBool(v)) return `Campo obrigatório: ${f.label || f.key}`;
        continue;
      }

      if (f.type === "number") {
        const n = typeof v === "number" ? v : Number(String(v ?? ""));
        if (!Number.isFinite(n)) return `Campo obrigatório: ${f.label || f.key}`;
        continue;
      }

      const s = String(v ?? "").trim();
      if (!s.length) return `Campo obrigatório: ${f.label || f.key}`;
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      // ✅ cria um registro (rascunho) de inscrição no banco
      // Aqui é ADMIN: pode ser para testar/gerar link/pagamento.
      // Se você já tem uma tabela (ex: app_event_registrations), mantenha esse nome.
      const payload = {
        event_id: event.id,
        status: "draft",
        payment_provider: "stripe",
        payment_status: "pending",
        currency: "usd",
        amount_cents: event.price_cents ?? 0,
        // campos comuns (se existirem na tabela)
        attendee_name: String(values["attendee_name"] ?? "").trim() || null,
        attendee_email: String(values["attendee_email"] ?? "").trim() || null,
        attendee_whatsapp: String(values["attendee_whatsapp"] ?? "").trim() || null,
        // campos custom no JSON
        custom_fields: values,
      };

      const { data: reg, error: regErr } = await supabase
        .from("app_event_registrations")
        .insert(payload as any)
        .select("id")
        .single();

      if (regErr) throw new Error(regErr.message);

      // ✅ chama sua rota do Stripe (se existir) pra criar checkout
      // Se você já tem essa rota, ela deve devolver { url }.
      // Se ainda não estiver pronta, comenta esse bloco e só salva a inscrição.
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          registrationId: reg?.id,
          // manda os dados pra preencher metadata
          values,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Stripe checkout failed (${res.status}). ${t}`.trim());
      }

      const json = (await res.json()) as { url?: string };
      if (json?.url) {
        window.location.href = json.url;
        return;
      }

      setInfo("Inscrição criada, mas checkout não retornou URL.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Falha ao criar inscrição.");
    } finally {
      setBusy(false);
    }
  }

  /* ================= Styles ================= */

  const cardStyle: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "radial-gradient(circle at top left, #020617, #020617 55%, #000000 100%)",
    padding: 14,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.55)",
    color: "#e5e7eb",
    padding: "10px 12px",
    fontSize: 13,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#93c5fd",
    marginBottom: 6,
    fontWeight: 700,
  };

  const helperStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
  };

  const btnStyle: React.CSSProperties = {
    borderRadius: 999,
    padding: "10px 16px",
    border: "none",
    fontSize: 13,
    fontWeight: 800,
    background: "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
    color: "#0b1120",
    cursor: "pointer",
  };

  /* ================= Render ================= */

  if (loading || checkingAdmin) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Carregando…</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", padding: 16 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 14, color: "#fca5a5" }}>{error || "Evento não encontrado."}</p>
          <Link href="/admin/events" style={{ color: "#93c5fd", textDecoration: "underline", fontSize: 13 }}>
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", padding: 16 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              aria-label="Voltar"
              title="Voltar"
            >
              ←
            </button>

            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
                Admin • Registration
              </p>
              <h1 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 0 0" }}>{event.title}</h1>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0 0" }}>
                {formatDateTime(event.date)} • {event.location || "—"} • {dollarsFromCents(event.price_cents || 0)}
              </p>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Link href={`/admin/events/${event.id}/edit`} style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline" }}>
                Editar evento
              </Link>
              <Link href="/admin/events" style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline" }}>
                Lista
              </Link>
            </div>
          </div>
        </header>

        {error ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p> : null}
        {info ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{info}</p> : null}

        {/* Card */}
        <section style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Criar inscrição (Admin / Teste)</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8, marginBottom: 12 }}>
            Esta tela cria uma inscrição e (se sua rota Stripe estiver pronta) abre o checkout.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Campos “comuns” (opcional) */}
            <div>
              <div style={labelStyle}>Nome</div>
              <input
                type="text"
                value={String(values["attendee_name"] ?? "")}
                onChange={(e) => setField("attendee_name", e.target.value)}
                placeholder="Nome do participante"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={labelStyle}>Email</div>
              <input
                type="email"
                value={String(values["attendee_email"] ?? "")}
                onChange={(e) => setField("attendee_email", e.target.value)}
                placeholder="email@exemplo.com"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={labelStyle}>WhatsApp</div>
              <input
                type="tel"
                value={String(values["attendee_whatsapp"] ?? "")}
                onChange={(e) => setField("attendee_whatsapp", e.target.value)}
                placeholder="+1 (407) ..."
                style={inputStyle}
              />
            </div>

            {/* Campos dinâmicos (por evento) */}
            {fields.length ? (
              <div style={{ marginTop: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: "8px 0 10px 0" }}>Campos do evento</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {fields.map((f) => {
                    const commonLabel = (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span>{f.label || f.key}</span>
                        {f.required ? <span style={{ fontSize: 11, color: "#fca5a5" }}>* obrigatório</span> : null}
                      </div>
                    );

                    const placeholder = f.placeholder || undefined;
                    const helper = f.helper_text ? <div style={helperStyle}>{f.helper_text}</div> : null;

                    if (f.type === "textarea") {
                      return (
                        <div key={f.id}>
                          <div style={labelStyle}>{commonLabel}</div>
                          <textarea
                            value={String(toInputValue("textarea", values[f.key]))}
                            onChange={(e) => setField(f.key, e.target.value)}
                            placeholder={placeholder}
                            style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                          />
                          {helper}
                        </div>
                      );
                    }

                    if (f.type === "select") {
                      const opts = normalizeOptions(f.options);
                      return (
                        <div key={f.id}>
                          <div style={labelStyle}>{commonLabel}</div>
                          <select
                            value={String(toInputValue("select", values[f.key]))}
                            onChange={(e) => setField(f.key, e.target.value)}
                            style={inputStyle}
                          >
                            <option value="">Select…</option>
                            {opts.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                          {helper}
                        </div>
                      );
                    }

                    if (f.type === "checkbox") {
                      return (
                        <div key={f.id} style={{ border: "1px solid rgba(148,163,184,0.25)", borderRadius: 14, padding: 12, background: "rgba(2,6,23,0.35)" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={safeBool(values[f.key])}
                              onChange={(e) => setField(f.key, e.target.checked)}
                              style={{ transform: "scale(1.1)" }}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#e5e7eb" }}>
                                {f.label || f.key} {f.required ? <span style={{ color: "#fca5a5" }}>*</span> : null}
                              </span>
                              {f.helper_text ? <span style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{f.helper_text}</span> : null}
                            </div>
                          </label>
                        </div>
                      );
                    }

                    // default = input
                    const inputType: "text" | "email" | "tel" | "number" | "date" = (["email", "tel", "number", "date"].includes(f.type) ? f.type : "text") as any;

                    return (
                      <div key={f.id}>
                        <div style={labelStyle}>{commonLabel}</div>
                        <input
                          type={inputType}
                          value={toInputValue(f.type, values[f.key]) as any}
                          onChange={(e) => {
                            if (f.type === "number") {
                              const raw = e.target.value;
                              if (raw === "") return setField(f.key, "");
                              const n = Number(raw);
                              setField(f.key, Number.isFinite(n) ? n : "");
                              return;
                            }
                            setField(f.key, e.target.value);
                          }}
                          placeholder={placeholder}
                          style={inputStyle}
                        />
                        {helper}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 6, fontSize: 13, color: "#9ca3af" }}>
                Nenhum campo dinâmico encontrado para este evento (app_event_registration_fields).
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              <button type="submit" disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}>
                {busy ? "Abrindo checkout..." : "Continuar (Stripe)"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/events")}
                style={{
                  borderRadius: 999,
                  padding: "10px 16px",
                  border: "1px solid rgba(148,163,184,0.35)",
                  fontSize: 13,
                  fontWeight: 800,
                  background: "rgba(2,6,23,0.5)",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
