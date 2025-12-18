// app/events/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
  if (!priceCents || priceCents <= 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceCents / 100);
}

function buildAddress(e: EventRow | null): string {
  if (!e) return "";
  const parts = [e.street, e.city, e.state].filter(Boolean);
  return parts.join(", ");
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

  const [event, setEvent] = useState<EventRow | null>(null);
  const [registrations, setRegistrations] = useState<PublicRegistration[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [nickname, setNickname] = useState("");

  const [loading, setLoading] = useState(true);
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

  /* ========== Load event + registrations ========== */

  useEffect(() => {
    if (!eventId) return;

    async function load() {
      setLoading(true);

      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      setEvent(eventData as EventRow);

      const { data: regs } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at");

      setRegistrations((regs as PublicRegistration[]) || []);

      const { data: me } = await supabase
        .from("event_registrations")
        .select("nickname")
        .eq("event_id", eventId)
        .maybeSingle();

      if (me?.nickname) {
        setIsRegistered(true);
        setNickname(me.nickname);
      }

      setLoading(false);
    }

    load();
  }, [supabase, eventId]);

  /* ========== Register ========== */

  async function handleRegister() {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const nick = nickname.trim();
      if (nick.length < 2 || nick.length > 24) {
        throw new Error("Nickname must be between 2 and 24 characters.");
      }

      const { error } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        nickname: nick,
      });

      if (error) throw error;

      setIsRegistered(true);
      setInfo("You are registered!");

      const { data: regs } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at");

      setRegistrations((regs as PublicRegistration[]) || []);
    } catch (e: any) {
      setError(e.message || "Failed to register.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 20, color: "#e5e7eb" }}>
        Loading event…
      </main>
    );
  }

  const img =
    getPublicImageUrl(event?.image_path ?? null) || event?.image_url;

  const address = buildAddress(event);
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    address
  )}&output=embed`;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: 16,
        paddingBottom: 80,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Evento
          </p>

          <h1 style={{ fontSize: 24, fontWeight: 700 }}>
            {event?.title}
          </h1>

          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            {event?.sport} • {formatDateTime(event?.date)}
          </p>
        </header>

        {error && (
          <p style={{ color: "#fca5a5", fontSize: 13 }}>{error}</p>
        )}
        {info && (
          <p style={{ color: "#86efac", fontSize: 13 }}>{info}</p>
        )}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Image */}
          <div style={{ height: 220 }}>
            {img ? (
              <img
                src={img}
                alt="event"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <p style={{ fontSize: 12, color: "#9ca3af" }}>No image</p>
            )}
          </div>

          {/* Address */}
          <p style={{ fontSize: 13, color: "#9ca3af" }}>{address}</p>

          <iframe
            src={mapUrl}
            height={240}
            style={{ border: 0, borderRadius: 12 }}
          />

          {/* Description */}
          {event?.description && (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              {event.description}
            </p>
          )}

          {/* Organizer */}
          <div>
            <strong>Organizer contact</strong>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              {isRegistered
                ? event?.organizer_whatsapp
                : "Register to see WhatsApp"}
            </p>
          </div>

          {/* Nickname */}
          <label style={labelStyle}>
            Nickname (visible to participants)
            <input
              style={inputStyle}
              placeholder="Ex: Rafa Runner"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isRegistered}
            />
          </label>

          {/* CTA */}
          <button
            onClick={handleRegister}
            disabled={busy || isRegistered}
            style={{
              padding: "12px",
              borderRadius: 999,
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              cursor: busy || isRegistered ? "not-allowed" : "pointer",
            }}
          >
            {isRegistered ? "Registered" : busy ? "Registering…" : "Register"}
          </button>

          {/* Public nicknames */}
          <div>
            <strong>Participants</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {registrations.map((r, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.35)",
                  }}
                >
                  {r.nickname}
                </span>
              ))}
            </div>
          </div>

          <Link href="/events" style={{ fontSize: 12, color: "#93c5fd" }}>
            ← Back to events
          </Link>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
