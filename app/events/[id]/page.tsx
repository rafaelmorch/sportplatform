// app/events/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

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
  location: string | null;
  location_name: string | null;

  capacity: number | null;
  waitlist_capacity: number | null;
  price_cents: number | null;

  organizer_whatsapp: string | null;

  image_path: string | null;
  image_url: string | null;
  created_by: string | null;
};

type PublicRegistration = {
  nickname: string | null;
  registered_at: string | null;
};

function formatDateTime(dt: string | null): string {
  if (!dt) return "Data a definir";
  try {
    const d = new Date(dt);
    return d.toLocaleString("en-US", {
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
  if (!e) return "";
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

  const fallback = (e.address_text ?? e.location_name ?? e.location ?? "").trim();
  return fallback || "Location TBD";
}

function getPublicImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  const bucket = "event-images";
  const path = imagePath.startsWith(`${bucket}/`)
    ? imagePath.slice(bucket.length + 1)
    : imagePath;

  const { data } = supabaseBrowser.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export default function EventDetailPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const eventId = params?.id;

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [registrationsCount, setRegistrationsCount] = useState<number>(0);
  const [publicRegs, setPublicRegs] = useState<PublicRegistration[]>([]);
  const [countsLoading, setCountsLoading] = useState(true);

  const [isRegistered, setIsRegistered] = useState(false);
  const [nickname, setNickname] = useState("");

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

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      if (!eventId) return;
      setLoading(true);
      setError(null);
      setInfo(null);

      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,sport,description,date,street,city,state,address_text,location,location_name,capacity,waitlist_capacity,price_cents,organizer_whatsapp,image_path,image_url,created_by"
        )
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (error) {
        setError(error.message ?? "Failed to load event");
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

  useEffect(() => {
    let cancelled = false;

    async function loadCountsAndRegistration() {
      if (!eventId) return;
      setCountsLoading(true);
      setError(null);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        setIsRegistered(false);
        setCountsLoading(false);
        return;
      }

      // 1) Count (via view pública: conta rows)
      const { count, error: countErr } = await supabase
        .from("event_registrations_public")
        .select("nickname", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (!cancelled) {
        if (countErr) {
          setError(countErr.message ?? "Failed to load registrations count");
          setRegistrationsCount(0);
        } else {
          setRegistrationsCount(count ?? 0);
        }
      }

      // 2) Lista de nicknames (via view pública)
      const { data: regs, error: regsErr } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true })
        .limit(200);

      if (!cancelled) {
        if (!regsErr) setPublicRegs((regs as PublicRegistration[]) ?? []);
      }

      // 3) "Eu já estou inscrito?" (na tabela, mas policy permite só a própria linha)
      const { data: me, error: meErr } = await supabase
        .from("event_registrations")
        .select("id, nickname")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (!meErr && me?.id) {
          setIsRegistered(true);
          if (me.nickname) setNickname(me.nickname);
        } else {
          setIsRegistered(false);
        }
      }

      if (!cancelled) setCountsLoading(false);
    }

    loadCountsAndRegistration();

    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

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

      // Atualiza contagem para decisão de vagas
      const { count } = await supabase
        .from("event_registrations_public")
        .select("nickname", { count: "exact", head: true })
        .eq("event_id", eventId);

      const currentCount = count ?? 0;

      const cap = event?.capacity ?? 0;
      const waitCap = event?.waitlist_capacity ?? 0;
      const totalAllowed = (cap > 0 ? cap : 0) + (waitCap > 0 ? waitCap : 0);

      if (cap > 0 && totalAllowed > 0 && currentCount >= totalAllowed) {
        throw new Error("Event is full (including waitlist).");
      }

      // Insere inscrição com nickname
      const { error: insErr } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: user.id,
        nickname: nick,
        registered_at: new Date().toISOString(),
      });

      if (insErr) {
        if ((insErr.message || "").toLowerCase().includes("duplicate")) {
          setInfo("You are already registered.");
          setIsRegistered(true);
          return;
        }
        throw new Error(insErr.message);
      }

      setIsRegistered(true);
      setInfo("Registration confirmed!");
      setRegistrationsCount((prev) => prev + 1);

      // Recarrega lista pública (nickname aparece para todos logados)
      const { data: regs } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true })
        .limit(200);

      setPublicRegs((regs as PublicRegistration[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to register.");
    } finally {
      setBusy(false);
    }
  }

  const address = buildAddress(event);
  const priceLabel = formatPrice(event?.price_cents ?? 0);

  const cap = event?.capacity ?? 0;
  const waitCap = event?.waitlist_capacity ?? 0;

  const spotsLeft = cap > 0 ? Math.max(cap - registrationsCount, 0) : null;

  const mapQuery = encodeURIComponent(address || "");
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  const img =
    getPublicImageUrl(event?.image_path ?? null) || (event?.image_url ?? null);

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

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
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
            {event?.sport ? `${event.sport} • ` : ""}
            {formatDateTime(event?.date ?? null)}
          </p>
        </header>

        {error ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>
            {error}
          </p>
        ) : null}

        {info ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>
            {info}
          </p>
        ) : null}

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

            {waitCap > 0 ? (
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
                Waitlist: {waitCap}
              </span>
            ) : null}
          </div>

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 6px 0" }}>
              Local
            </h2>
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
                src={mapEmbedUrl}
                width="100%"
                height="240"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline" }}
              >
                Abrir no Google Maps
              </a>
            </div>
          </div>

          {event?.description ? (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>
                Descrição
              </h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, whiteSpace: "pre-wrap" }}>
                {event.description}
              </p>
            </div>
          ) : null}

          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>
              Contato do organizador
            </h2>

            {isRegistered ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                WhatsApp:{" "}
                <span style={{ color: "#e5e7eb" }}>
                  {event?.organizer_whatsapp ?? "—"}
                </span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Faça a inscrição para liberar o WhatsApp do organizador.
              </p>
            )}
          </div>

          {/* Lista pública de nicknames */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>
              Participantes
            </h2>

            {publicRegs.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Nenhum inscrito ainda.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {publicRegs
                  .map((r, idx) => (r.nickname ?? "").trim())
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

          {/* Nickname + CTA */}
          {!isRegistered ? (
            <label style={labelStyle}>
              Nickname (visível para todos)
              <input
                style={inputStyle}
                placeholder="Ex: Rafa Runner"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 6,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: 12, color: "#60a5fa", margin: 0 }}>
              {isRegistered
                ? "Você já está inscrito."
                : "Inscrição em 1 clique (pagamento entra na próxima etapa)."}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href="/events/new"
                style={{
                  fontSize: 12,
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(2,6,23,0.65)",
                  color: "#e5e7eb",
                  textDecoration: "none",
                }}
              >
                Criar outro
              </Link>

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
                {isRegistered ? "Inscrito" : busy ? "Inscrevendo..." : "Inscrever-se"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
