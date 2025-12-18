// app/events/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

/* ================= Types ================= */

type EventRow = {
  id: string;
  title: string | null;
  sport: string | null;
  description: string | null;
  date: string | null;

  street: string | null;
  city: string | null;
  state: string | null;
  address_text: string | null;

  capacity: number | null;
  waitlist_capacity: number | null;
  price_cents: number | null;

  organizer_whatsapp: string | null;

  image_path: string | null;
  image_url: string | null; // legado
};

type PublicRegistration = {
  nickname: string | null;
  registered_at: string | null;
};

/* ================= Utils ================= */

function formatDateTime(dt: string | null): string {
  if (!dt) return "Date TBD";
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

function formatPrice(priceCents: number | null): string {
  const cents = priceCents ?? 0;
  if (cents <= 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function buildAddress(e: EventRow | null): string {
  if (!e) return "Location TBD";

  const street = (e.street ?? "").trim();
  const city = (e.city ?? "").trim();
  const state = (e.state ?? "").trim();

  const parts: string[] = [];
  if (street) parts.push(street);
  if (city && state) parts.push(`${city}, ${state}`);
  else if (city) parts.push(city);
  else if (state) parts.push(state);

  const composed = parts.join(", ").trim();
  if (composed) return composed;

  const fallback = (e.address_text ?? "").trim();
  return fallback || "Location TBD";
}

function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseBrowser.storage.from("event-images").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/* ================= Page ================= */

export default function EventDetailPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const { id: eventId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [registrations, setRegistrations] = useState<PublicRegistration[]>([]);
  const [registrationsCount, setRegistrationsCount] = useState(0);

  const [isRegistered, setIsRegistered] = useState(false);
  const [nickname, setNickname] = useState("");

  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#60a5fa",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "#374151",
    color: "#ffffff",
    outline: "none",
  };

  /* ===== Mensagens pós-checkout ===== */
  useEffect(() => {
    const paid = searchParams?.get("paid");
    const canceled = searchParams?.get("canceled");

    if (paid === "1") setInfo("Payment received. Confirming your registration...");
    if (canceled === "1") setInfo("Payment canceled.");
  }, [searchParams]);

  /* ===== Carregar evento ===== */
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,sport,description,date,street,city,state,address_text,capacity,waitlist_capacity,price_cents,organizer_whatsapp,image_path,image_url"
        )
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (error) {
        setError(error.message || "Failed to load event.");
        setEvent(null);
      } else {
        setEvent((data as EventRow) ?? null);
      }

      setLoading(false);
    }

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

  /* ===== Carregar inscritos ===== */
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function loadRegs() {
      setCountsLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;

      if (!user) {
        if (!cancelled) {
          setRegistrations([]);
          setRegistrationsCount(0);
          setIsRegistered(false);
          setCountsLoading(false);
        }
        return;
      }

      const { data: regs } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true })
        .limit(200);

      const { count } = await supabase
        .from("event_registrations_public")
        .select("nickname", { count: "exact", head: true })
        .eq("event_id", eventId);

      const { data: me } = await supabase
        .from("event_registrations")
        .select("nickname")
        .eq("event_id", eventId)
        .maybeSingle();

      if (!cancelled) {
        setRegistrations((regs as PublicRegistration[]) ?? []);
        setRegistrationsCount(count ?? 0);

        if (me?.nickname) {
          setIsRegistered(true);
          setNickname(me.nickname);
        } else {
          setIsRegistered(false);
        }

        setCountsLoading(false);
      }
    }

    loadRegs();

    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

  /* ===== Polling pós-pagamento (quando voltar com paid=1) ===== */
  useEffect(() => {
    if (!eventId) return;
    if (searchParams?.get("paid") !== "1") return;

    let stopped = false;

    async function poll() {
      const { data: me } = await supabase
        .from("event_registrations")
        .select("nickname")
        .eq("event_id", eventId)
        .maybeSingle();

      if (stopped) return;

      if (me?.nickname) {
        setIsRegistered(true);
        setNickname(me.nickname);
        setInfo("Registration confirmed!");

        const { data: regs } = await supabase
          .from("event_registrations_public")
          .select("nickname, registered_at")
          .eq("event_id", eventId)
          .order("registered_at", { ascending: true })
          .limit(200);

        setRegistrations((regs as PublicRegistration[]) ?? []);
        setRegistrationsCount((regs as any[])?.length ?? 0);
        return;
      }

      setTimeout(() => !stopped && poll(), 1500);
    }

    poll();
    return () => {
      stopped = true;
    };
  }, [supabase, eventId, searchParams]);

  /* ================= REGISTER ================= */

  async function handleRegister() {
    if (!eventId) return;

    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("You must be logged in to register.");

      const nick = nickname.trim();
      if (nick.length < 2 || nick.length > 24) {
        throw new Error("Nickname must be between 2 and 24 characters.");
      }

      const price = event?.price_cents ?? 0;

      /* ===== EVENTO PAGO (SEM POPUP) ===== */
      if (price > 0) {
        setInfo("Redirecting to checkout...");

        const resp = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            nickname: nick,
            userId: user.id,
          }),
        });

        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Checkout error: ${t || resp.status}`);
        }

        const { url } = await resp.json();
        if (!url) throw new Error("Missing checkout url.");

        // ✅ mais confiável: mesma aba
        window.location.href = url;
        return;
      }

      /* ===== EVENTO GRÁTIS ===== */
      const cap = event?.capacity ?? 0;
      const waitCap = event?.waitlist_capacity ?? 0;
      const totalAllowed = (cap > 0 ? cap : 0) + (waitCap > 0 ? waitCap : 0);

      if (cap > 0 && totalAllowed > 0 && registrationsCount >= totalAllowed) {
        throw new Error("Event is full (including waitlist).");
      }

      const { error: insErr } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: user.id,
        nickname: nick,
        registered_at: new Date().toISOString(),
        payment_provider: "free",
        payment_status: "free",
        amount_cents: 0,
        currency: "usd",
      });

      if (insErr) {
        const msg = (insErr.message || "").toLowerCase();
        if (msg.includes("duplicate")) {
          setInfo("You are already registered.");
          setIsRegistered(true);
          return;
        }
        throw new Error(insErr.message);
      }

      setIsRegistered(true);
      setInfo("Registration confirmed!");

      const { data: regs } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true })
        .limit(200);

      setRegistrations((regs as PublicRegistration[]) ?? []);
      setRegistrationsCount((prev) => prev + 1);
    } catch (e: any) {
      setError(e?.message ?? "Failed to register.");
    } finally {
      setBusy(false);
    }
  }

  /* ================= Render ================= */

  const address = buildAddress(event);
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  const priceLabel = formatPrice(event?.price_cents ?? 0);

  const cap = event?.capacity ?? 0;
  const spotsLeft = cap > 0 ? Math.max(cap - registrationsCount, 0) : null;

  const img = getPublicImageUrl(event?.image_path ?? null) || event?.image_url || null;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: "16px",
        paddingBottom: "80px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <header
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#64748b",
              margin: 0,
            }}
          >
            Evento
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              {loading ? "Carregando..." : event?.title ?? "Evento"}
            </h1>

            <Link
              href="/events"
              style={{
                fontSize: 12,
                color: "#93c5fd",
                textDecoration: "underline",
                whiteSpace: "nowrap",
              }}
            >
              Voltar
            </Link>
          </div>

          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            {(event?.sport ?? "")} • {formatDateTime(event?.date ?? null)}
          </p>
        </header>

        {error ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p>
        ) : null}

        {info ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{info}</p>
        ) : null}

        {/* Card */}
        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Imagem */}
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
            {img ? (
              <img
                src={img}
                alt={event?.title ?? "event image"}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>No image</span>
            )}
          </div>

          {/* Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.5)",
                background:
                  "linear-gradient(135deg, rgba(8,47,73,0.9), rgba(12,74,110,0.9))",
                color: "#e0f2fe",
                whiteSpace: "nowrap",
              }}
            >
              {priceLabel}
            </span>

            <span
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(2,6,23,0.65)",
                color: "#e5e7eb",
                whiteSpace: "nowrap",
              }}
            >
              Inscritos: {countsLoading ? "..." : registrationsCount}
            </span>

            {cap > 0 ? (
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(2,6,23,0.65)",
                  color: "#e5e7eb",
                  whiteSpace: "nowrap",
                }}
              >
                Vagas: {spotsLeft}
              </span>
            ) : null}
          </div>

          {/* Local + mapa */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 6px 0" }}>Local</h2>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{address}</p>

            <div
              style={{
                marginTop: 10,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,0.25)",
              }}
            >
              <iframe
                title="map"
                src={mapUrl}
                width="100%"
                height="240"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Descrição */}
          {event?.description ? (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>
                Descrição
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {event.description}
              </p>
            </div>
          ) : null}

          {/* WhatsApp do organizador */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>
              Contato do organizador
            </h2>

            {isRegistered ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                WhatsApp:{" "}
                <span style={{ color: "#e5e7eb" }}>{event?.organizer_whatsapp ?? "—"}</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Faça a inscrição para liberar o WhatsApp do organizador.
              </p>
            )}
          </div>

          {/* Nickname */}
          <label style={labelStyle}>
            Nickname <span style={{ color: "#93c5fd" }}>*</span>{" "}
            <span style={{ color: "#9ca3af" }}>(visível para todos)</span>
            <input
              style={inputStyle}
              placeholder="Ex: Rafa Runner"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isRegistered}
            />
            {isRegistered ? (
              <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                Você já está inscrito. (nickname bloqueado por enquanto)
              </span>
            ) : null}
          </label>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: 12, color: "#60a5fa", margin: 0 }}>
              {isRegistered
                ? "Você já está inscrito."
                : (event?.price_cents ?? 0) > 0
                ? "Evento pago: você será redirecionado ao checkout."
                : "Evento grátis: inscrição em 1 clique."}
            </p>

            <button
              onClick={handleRegister}
              disabled={busy || isRegistered}
              style={{
                fontSize: 12,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.55)",
                background:
                  "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                color: "#e0f2fe",
                cursor: busy || isRegistered ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {isRegistered
                ? "Inscrito"
                : busy
                ? "Processando..."
                : (event?.price_cents ?? 0) > 0
                ? "Pagar e Inscrever-se"
                : "Inscrever-se"}
            </button>
          </div>

          {/* Lista pública de nicknames */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>
              Participantes
            </h2>

            {registrations.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Nenhum inscrito ainda.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {registrations
                  .map((r) => (r.nickname ?? "").trim())
                  .filter((n) => n.length > 0)
                  .slice(0, 200)
                  .map((n, idx) => (
                    <span
                      key={`${n}-${idx}`}
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.35)",
                        background: "rgba(2,6,23,0.65)",
                        color: "#e5e7eb",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
