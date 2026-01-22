"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type AppEventRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  price_cents: number;
  currency: string | null;
  published: boolean;
  capacity: number | null;
  waitlist_capacity: number;
};

type RegistrationInsert = {
  event_id: string;
  user_id?: string | null;
  status?: string | null;

  attendee_name?: string | null;
  attendee_email?: string | null;
  attendee_whatsapp?: string | null;
  nickname?: string | null;

  payer_email?: string | null;
  payer_phone?: string | null;

  participant_name?: string | null;
  participant_birthdate?: string | null;

  payment_provider?: string | null;
  payment_status?: string | null;
  amount_cents?: number | null;
  currency?: string | null;
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

function moneyFromCents(cents: number, currency: string | null) {
  const cur = (currency || "USD").toUpperCase();
  const value = (cents || 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(value);
  } catch {
    return `${value.toFixed(2)} ${cur}`;
  }
}

function fieldValue(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length ? t : "—";
}

export default function EventRegisterPage() {
  const router = useRouter();
  const { id: eventId } = useParams<{ id: string }>();

  const supabase = useMemo(() => supabaseBrowser, []);

  const [event, setEvent] = useState<AppEventRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // form
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeeWhatsapp, setAttendeeWhatsapp] = useState("");
  const [nickname, setNickname] = useState("");

  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("");

  const [participantName, setParticipantName] = useState("");
  const [participantBirthdate, setParticipantBirthdate] = useState(""); // YYYY-MM-DD

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("app_events")
        .select("id,title,description,date,location,price_cents,currency,published,capacity,waitlist_capacity")
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (error) {
        setError(error.message || "Failed to load event.");
        setEvent(null);
      } else {
        setEvent((data as AppEventRow) ?? null);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId) return;

    setSubmitting(true);
    setError(null);
    setOkMsg(null);

    try {
      const ev = event;
      if (!ev) throw new Error("Event not found.");
      if (!ev.published) throw new Error("This event is not published.");

      // validações mínimas
      if (!attendeeName.trim()) throw new Error("Please enter your name.");
      if (!attendeeEmail.trim()) throw new Error("Please enter your email.");
      if (!payerEmail.trim()) throw new Error("Please enter payer email.");
      if (!participantName.trim()) throw new Error("Please enter participant name.");

      const amountCents = ev.price_cents ?? 0;
      const currency = (ev.currency || "USD").toUpperCase();

      // 1) cria inscrição (sem login)
      const payload: RegistrationInsert = {
        event_id: eventId,
        user_id: null,
        status: "pending",

        attendee_name: attendeeName.trim(),
        attendee_email: attendeeEmail.trim(),
        attendee_whatsapp: attendeeWhatsapp.trim() || null,
        nickname: nickname.trim() || null,

        payer_email: payerEmail.trim(),
        payer_phone: payerPhone.trim() || null,

        participant_name: participantName.trim(),
        participant_birthdate: participantBirthdate.trim() || null,

        payment_provider: amountCents > 0 ? "stripe" : null,
        payment_status: amountCents > 0 ? "unpaid" : "free",
        amount_cents: amountCents,
        currency,
      };

      const { data: regRow, error: regErr } = await supabase
        .from("app_event_registrations")
        .insert(payload)
        .select("id")
        .single();

      if (regErr) throw new Error(regErr.message || "Failed to create registration.");

      const registrationId = (regRow as any)?.id as string | undefined;
      if (!registrationId) throw new Error("Registration created but missing id.");

      // 2) se for pago, cria checkout e redireciona
      if (amountCents > 0) {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            registrationId,
            // dados úteis pro checkout (caso seu endpoint use)
            payerEmail: payerEmail.trim(),
            attendeeName: attendeeName.trim(),
          }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            json?.error ||
            json?.message ||
            "Stripe checkout failed. Please try again.";
          throw new Error(msg);
        }

        const url = json?.url as string | undefined;
        if (!url) throw new Error("Missing Stripe checkout URL.");

        window.location.href = url;
        return;
      }

      // se gratuito, finaliza aqui
      setOkMsg("Registration completed!");
      // opcional: mandar pra página do evento
      setTimeout(() => router.push(`/events/${eventId}`), 900);
    } catch (err: any) {
      setError(err?.message || "Failed to register.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = loading ? "Loading..." : fieldValue(event?.title ?? null);
  const when = formatDateTime(event?.date ?? null);
  const price = event ? moneyFromCents(event.price_cents ?? 0, event.currency) : "—";

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", padding: 16 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => router.push(eventId ? `/events/${eventId}` : "/events")}
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
                Event Registration
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: "6px 0 0 0" }}>{title}</h1>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0 0" }}>
                {when} • {price}
              </p>
            </div>

            <div style={{ marginLeft: "auto" }}>
              <Link href="/events" style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline" }}>
                Events
              </Link>
            </div>
          </div>
        </header>

        {error ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p>
        ) : null}
        {okMsg ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{okMsg}</p>
        ) : null}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "14px 14px",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Registration</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "8px 0 0 0" }}>
            Complete the form below to register. No login required.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Your name *">
                <input value={attendeeName} onChange={(e) => setAttendeeName(e.target.value)} placeholder="Full name" style={inputStyle} />
              </Field>

              <Field label="Your email *">
                <input value={attendeeEmail} onChange={(e) => setAttendeeEmail(e.target.value)} placeholder="you@email.com" style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="WhatsApp (optional)">
                <input value={attendeeWhatsapp} onChange={(e) => setAttendeeWhatsapp(e.target.value)} placeholder="+1 (xxx) xxx-xxxx" style={inputStyle} />
              </Field>

              <Field label="Nickname (optional)">
                <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname" style={inputStyle} />
              </Field>
            </div>

            <div style={{ height: 1, background: "rgba(148,163,184,0.25)", margin: "6px 0" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Payer email *">
                <input value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="payer@email.com" style={inputStyle} />
              </Field>

              <Field label="Payer phone (optional)">
                <input value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder="+1 (xxx) xxx-xxxx" style={inputStyle} />
              </Field>
            </div>

            <div style={{ height: 1, background: "rgba(148,163,184,0.25)", margin: "6px 0" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Participant name *">
                <input value={participantName} onChange={(e) => setParticipantName(e.target.value)} placeholder="Participant full name" style={inputStyle} />
              </Field>

              <Field label="Participant birthdate (optional)">
                <input
                  value={participantBirthdate}
                  onChange={(e) => setParticipantBirthdate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  style={inputStyle}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={submitting || loading || !event}
              style={{
                marginTop: 6,
                borderRadius: 999,
                padding: "12px 18px",
                border: "none",
                fontSize: 13,
                fontWeight: 900,
                background: "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
                color: "#0b1120",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting
                ? "Processing..."
                : (event?.price_cents ?? 0) > 0
                  ? "Continue to payment"
                  : "Register"}
            </button>

            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              By registering you agree to the event terms and policies.
            </p>
          </form>
        </section>

        {event?.description ? (
          <section style={{ marginTop: 14, color: "#9ca3af", fontSize: 13, whiteSpace: "pre-wrap" }}>
            {event.description}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#93c5fd", fontWeight: 800 }}>{label}</span>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(2,6,23,0.65)",
  color: "#e5e7eb",
  outline: "none",
};
