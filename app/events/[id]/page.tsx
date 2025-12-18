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
  image_url: string | null;
};

type PublicRegistration = {
  nickname: string | null;
  registered_at: string | null;
};

/* ================= Utils ================= */

function formatDateTime(dt: string | null): string {
  if (!dt) return "Date TBD";
  return new Date(dt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const parts: string[] = [];
  if (e.street) parts.push(e.street);
  if (e.city && e.state) parts.push(`${e.city}, ${e.state}`);
  return parts.join(", ") || e.address_text || "Location TBD";
}

function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseBrowser.storage
    .from("event-images")
    .getPublicUrl(path);
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

  /* ===== Mensagens pós-checkout ===== */
  useEffect(() => {
    if (searchParams?.get("paid") === "1") {
      setInfo("Payment received. Confirming your registration...");
    }
    if (searchParams?.get("canceled") === "1") {
      setInfo("Payment canceled.");
    }
  }, [searchParams]);

  /* ===== Carregar evento ===== */
  useEffect(() => {
    if (!eventId) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) setError(error.message);
      else setEvent(data as EventRow);

      setLoading(false);
    })();
  }, [supabase, eventId]);

  /* ===== Carregar inscritos ===== */
  useEffect(() => {
    if (!eventId) return;

    (async () => {
      setCountsLoading(true);

      const { data: regs } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true });

      const { count } = await supabase
        .from("event_registrations_public")
        .select("nickname", { count: "exact", head: true })
        .eq("event_id", eventId);

      const { data: me } = await supabase
        .from("event_registrations")
        .select("nickname")
        .eq("event_id", eventId)
        .maybeSingle();

      setRegistrations((regs as PublicRegistration[]) ?? []);
      setRegistrationsCount(count ?? 0);

      if (me?.nickname) {
        setIsRegistered(true);
        setNickname(me.nickname);
      }

      setCountsLoading(false);
    })();
  }, [supabase, eventId]);

  /* ===== Polling pós-pagamento ===== */
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
          .order("registered_at", { ascending: true });

        setRegistrations((regs as PublicRegistration[]) ?? []);
        setRegistrationsCount((regs as any[])?.length ?? 0);
        return;
      }

      setTimeout(() => !stopped && poll(), 2000);
    }

    poll();
    return () => {
      stopped = true;
    };
  }, [supabase, eventId, searchParams]);

  /* ================= REGISTER ================= */

  async function handleRegister() {
    if (!event || !eventId) return;

    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Login required.");

      const nick = nickname.trim();
      if (nick.length < 2 || nick.length > 24) {
        throw new Error("Nickname must be 2–24 characters.");
      }

      /* ===== EVENTO PAGO ===== */
      if ((event.price_cents ?? 0) > 0) {
        // abrir popup ANTES do await (evita bloqueio)
        const popup = window.open(
          "about:blank",
          "_blank",
          "noopener,noreferrer"
        );
        if (!popup) {
          throw new Error("Popup blocked. Allow popups for this site.");
        }

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
          popup.close();
          throw new Error(`Checkout error: ${t}`);
        }

        const { url } = await resp.json();
        popup.location.href = url;
        return;
      }

      /* ===== EVENTO GRÁTIS ===== */
      const { error: insErr } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: user.id,
          nickname: nick,
          registered_at: new Date().toISOString(),
          payment_provider: "free",
          payment_status: "free",
          amount_cents: 0,
          currency: "usd",
        });

      if (insErr) throw insErr;

      setIsRegistered(true);
      setInfo("Registration confirmed!");
    } catch (e: any) {
      setError(e.message ?? "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  const img =
    getPublicImageUrl(event?.image_path ?? null) || event?.image_url || null;

  /* ================= Render ================= */

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: 16,
        paddingBottom: 80,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#64748b" }}>Evento</p>
          <h1 style={{ fontSize: 24 }}>
            {loading ? "Loading..." : event?.title}
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            {event?.sport} • {formatDateTime(event?.date ?? null)}
          </p>
        </header>

        {error && <p style={{ color: "#fca5a5" }}>{error}</p>}
        {info && <p style={{ color: "#86efac" }}>{info}</p>}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            padding: 14,
          }}
        >
          {img && (
            <img
              src={img}
              alt="event"
              style={{ width: "100%", maxHeight: 220, objectFit: "contain" }}
            />
          )}

          <p>{buildAddress(event)}</p>
          <p>{formatPrice(event?.price_cents ?? 0)}</p>

          <label>
            Nickname *
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isRegistered}
              style={{
                width: "100%",
                padding: 10,
                marginTop: 4,
                background: "#374151",
                color: "#fff",
                borderRadius: 8,
              }}
            />
          </label>

          <button
            onClick={handleRegister}
            disabled={busy || isRegistered}
            style={{
              marginTop: 12,
              padding: "10px 16px",
              borderRadius: 999,
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
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
