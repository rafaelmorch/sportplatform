"use client";

import Link from "next/link";
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

  address_text: string | null;
  city: string | null;
  state: string | null;

  capacity: number | null;
  waitlist_capacity: number | null;
  price_cents: number | null;

  image_path: string | null; // Storage
  image_url: string | null; // legado (se existir)
};

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

function buildAddress(e: EventRow): string {
  const a = (e.address_text ?? "").trim();
  const city = (e.city ?? "").trim();
  const state = (e.state ?? "").trim();

  const parts: string[] = [];
  if (a) parts.push(a);
  if (city && state) parts.push(`${city}, ${state}`);
  else if (city) parts.push(city);
  else if (state) parts.push(state);

  return parts.join(" • ") || "Location TBD";
}

function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseBrowser.storage.from("event-images").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export default function EventsPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,sport,description,date,address_text,city,state,capacity,waitlist_capacity,price_cents,image_path,image_url"
        )
        .order("date", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError(error.message || "Failed to load events.");
        setEvents([]);
      } else {
        setEvents((data as EventRow[]) ?? []);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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
        {/* Header padrão */}
        <header style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#64748b",
              margin: 0,
            }}
          >
            Eventos
          </p>

          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Eventos</h1>

            {/* Botões lado a lado (mínima mudança) */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link
                href="/events/new"
                style={{
                  fontSize: 12,
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(56,189,248,0.55)",
                  background:
                    "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                  color: "#e0f2fe",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                Criar evento
              </Link>

              <Link
                href="/events/manage"
                style={{
                  fontSize: 12,
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(2,6,23,0.65)",
                  color: "#e5e7eb",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                Meus eventos
              </Link>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#9ca3af", margin: "8px 0 0 0" }}>
            Descubra eventos e confirme sua inscrição.
          </p>
        </header>

        {error ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>
            {error}
          </p>
        ) : null}

        {loading ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Carregando...</p>
        ) : events.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Nenhum evento ainda.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {events.map((e) => {
              const img = getPublicImageUrl(e.image_path) || (e.image_url ?? null);

              const priceLabel = formatPrice(e.price_cents ?? 0);
              const when = formatDateTime(e.date);
              const where = buildAddress(e);

              return (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.35)",
                      background:
                        "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
                      padding: 14,
                      display: "flex",
                      gap: 12,
                      alignItems: "stretch",
                    }}
                  >
                    {/* Thumb */}
                    <div
                      style={{
                        width: 160,
                        minWidth: 160,
                        height: 96,
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
                          alt={e.title ?? "event image"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>No image</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <h2
                            style={{
                              margin: 0,
                              fontSize: 16,
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {e.title ?? "Evento"}
                          </h2>

                          <p
                            style={{
                              margin: "6px 0 0 0",
                              fontSize: 12,
                              color: "#9ca3af",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {(e.sport ?? "")} • {when}
                          </p>

                          <p
                            style={{
                              margin: "6px 0 0 0",
                              fontSize: 12,
                              color: "#9ca3af",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {where}
                          </p>
                        </div>

                        {/* Badges */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
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

                          {typeof e.capacity === "number" && e.capacity > 0 ? (
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
                              Cap: {e.capacity}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {e.description ? (
                        <p
                          style={{
                            margin: "10px 0 0 0",
                            fontSize: 12,
                            color: "#9ca3af",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {e.description}
                        </p>
                      ) : null}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavbar />
    </main>
  );
}
