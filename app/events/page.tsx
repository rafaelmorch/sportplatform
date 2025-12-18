// app/events/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type EventRow = {
  id: string;
  title: string | null;
  description: string | null;
  date: string | null; // timestamptz
  location: string | null; // legado
  image_url: string | null; // legado
  image_path: string | null; // novo (Storage)
  created_by: string | null;
  created_at: string | null;

  street: string | null;
  city: string | null;
  state: string | null;
  address_text: string | null;

  capacity: number | null;
  waitlist_capacity: number | null;
  price_cents: number | null;

  published: boolean | null;
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

function buildAddress(e: EventRow): string {
  const parts: string[] = [];
  const street = (e.street ?? "").trim();
  const city = (e.city ?? "").trim();
  const state = (e.state ?? "").trim();

  if (street) parts.push(street);
  if (city && state) parts.push(`${city}, ${state}`);
  else if (city) parts.push(city);
  else if (state) parts.push(state);

  const composed = parts.join(", ").trim();
  if (composed) return composed;

  // fallback
  const fallback = (e.address_text ?? e.location ?? "").trim();
  return fallback || "Location TBD";
}

function getPublicImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  // image_path pode vir como "event-images/xxx.jpg" ou só "xxx.jpg"
  const bucket = "event-images";
  const path = imagePath.startsWith(`${bucket}/`)
    ? imagePath.slice(bucket.length + 1)
    : imagePath;

  const { data } = supabaseBrowser.storage.from(bucket).getPublicUrl(path);
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
          "id,title,description,date,location,image_url,image_path,created_by,created_at,street,city,state,address_text,capacity,waitlist_capacity,price_cents,published"
        )
        .eq("published", true)
        .order("date", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError(error.message ?? "Failed to load events");
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
    <main style={{ padding: 16, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Eventos
        </h1>
        <span style={{ fontSize: 12, opacity: 0.75 }}>
          {loading ? "Loading..." : `${events.length} events`}
        </span>
      </div>

      {error ? (
        <p style={{ opacity: 0.9 }}>
          Error loading events: <span style={{ opacity: 0.85 }}>{error}</span>
        </p>
      ) : null}

      {loading ? (
        <p style={{ opacity: 0.85 }}>Loading events...</p>
      ) : events.length === 0 ? (
        <p style={{ opacity: 0.85 }}>
          No events yet. Check back soon.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          {events.map((e) => {
            const address = buildAddress(e);
            const priceLabel = formatPrice(e.price_cents);
            const cap = e.capacity ?? 0;
            const waitCap = e.waitlist_capacity ?? 0;

            const img =
              getPublicImageUrl(e.image_path) || (e.image_url ?? null);

            return (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid rgba(31,41,55,0.9)",
                  borderRadius: 16,
                  overflow: "hidden",
                  background:
                    "linear-gradient(to bottom, rgba(15,23,42,0.92), rgba(15,23,42,0.88))",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 150,
                    borderBottom: "1px solid rgba(31,41,55,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "radial-gradient(circle at top, rgba(59,130,246,0.12), transparent)",
                  }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={e.title ?? "Event image"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain", // ✅ não corta
                        display: "block",
                        background:
                          "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.35))",
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      No image
                    </div>
                  )}
                </div>

                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          lineHeight: "20px",
                          marginBottom: 6,
                        }}
                      >
                        {e.title ?? "Untitled event"}
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        {formatDateTime(e.date)}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          opacity: 0.85,
                          marginTop: 4,
                        }}
                      >
                        {address}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(59,130,246,0.35)",
                        background:
                          "radial-gradient(circle at top, rgba(59,130,246,0.16), transparent)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {priceLabel}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      fontSize: 12,
                      opacity: 0.9,
                    }}
                  >
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(31,41,55,0.9)",
                        background: "rgba(0,0,0,0.15)",
                      }}
                    >
                      Capacity: {cap || "—"}
                    </span>

                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(31,41,55,0.9)",
                        background: "rgba(0,0,0,0.15)",
                      }}
                    >
                      Waitlist: {waitCap}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
