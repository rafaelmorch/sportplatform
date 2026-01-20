"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

/* ================= Types ================= */

type ActivityRow = {
  id: string;
  created_at: string | null;
  organizer_id: string | null;

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

  organizer_whatsapp: string | null;

  image_path: string | null;
  image_url: string | null;

  published: boolean | null;
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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fieldValue(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length ? t : "—";
}

function buildAddress(a: ActivityRow | null): string {
  if (!a) return "";
  const ad = (a.address_text ?? "").trim();
  const city = (a.city ?? "").trim();
  const st = (a.state ?? "").trim();

  const parts: string[] = [];
  if (ad) parts.push(ad);
  if (city && st) parts.push(`${city}, ${st}`);
  else if (city) parts.push(city);
  else if (st) parts.push(st);

  const full = parts.join(", ").trim();
  return full || "Location TBD";
}

function normalizePhone(input: string): string {
  return input.trim().replace(/[^\d+]/g, "");
}

function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseBrowser.storage.from("event-images").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/* ================= Page ================= */

export default function ActivityDetailPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const { id: activityId } = useParams<{ id: string }>();

  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [isOwner, setIsOwner] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!activityId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;

      const { data, error: e } = await supabase
        .from("activities")
        .select(
          "id,created_at,organizer_id,title,sport,description,date,address_text,city,state,capacity,waitlist_capacity,price_cents,organizer_whatsapp,image_path,image_url,published"
        )
        .eq("id", activityId)
        .single();

      if (cancelled) return;

      if (e) {
        setError(e.message || "Failed to load activity.");
        setActivity(null);
        setIsOwner(false);
        setLoading(false);
        return;
      }

      const a = (data as ActivityRow) ?? null;
      setActivity(a);

      const owner = !!(user?.id && a?.organizer_id && user.id === a.organizer_id);
      setIsOwner(owner);

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, activityId]);

  async function handleDelete() {
    if (!activityId) return;
    if (!isOwner) return;

    const ok = window.confirm("Tem certeza que deseja apagar esta activity? Isso não pode ser desfeito.");
    if (!ok) return;

    setDeleteBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { error: delErr } = await supabase.from("activities").delete().eq("id", activityId);
      if (delErr) throw new Error(delErr.message);

      router.push("/activities/manage");
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete activity.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const addressFull = buildAddress(activity);
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(addressFull)}&output=embed`;

  const img = getPublicImageUrl(activity?.image_path ?? null) || activity?.image_url || null;

  const priceLabel = formatPrice(activity?.price_cents ?? 0);
  const cap = activity?.capacity ?? 0;

  const cardStyle: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(2,6,23,0.65)",
    color: "#e5e7eb",
    whiteSpace: "nowrap",
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#e5e7eb", padding: "16px", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <header style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
            Activity
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
              {loading ? "Carregando..." : activity?.title ?? "Activity"}
            </h1>

            <Link href="/activities" style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline", whiteSpace: "nowrap" }}>
              Voltar
            </Link>
          </div>

          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            {fieldValue(activity?.sport)} • {formatDateTime(activity?.date ?? null)}
          </p>

          {isOwner ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <Link
                href={`/activities/${activityId}/edit`}
                style={{
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(56,189,248,0.55)",
                  background: "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                  color: "#e0f2fe",
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                Editar
              </Link>

              <Link
                href="/activities/manage"
                style={{
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(2,6,23,0.65)",
                  color: "#e5e7eb",
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                Minhas activities
              </Link>

              <button
                onClick={handleDelete}
                disabled={deleteBusy}
                style={{
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(248,113,113,0.55)",
                  background: "rgba(127,29,29,0.35)",
                  color: "#fecaca",
                  cursor: deleteBusy ? "not-allowed" : "pointer",
                  fontWeight: 900,
                }}
              >
                {deleteBusy ? "Apagando..." : "Apagar"}
              </button>
            </div>
          ) : null}
        </header>

        {error ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p> : null}
        {info ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{info}</p> : null}

        <section style={cardStyle}>
          {/* HERO IMAGE */}
          <div
            style={{
              width: "100%",
              height: 240,
              borderRadius: 16,
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
                alt={activity?.title ?? "activity image"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>No image</span>
            )}
          </div>

          {/* BADGES */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.5)",
                background: "linear-gradient(135deg, rgba(8,47,73,0.9), rgba(12,74,110,0.9))",
                color: "#e0f2fe",
                whiteSpace: "nowrap",
                fontWeight: 900,
              }}
            >
              {priceLabel}
            </span>

            {cap > 0 ? <span style={badgeStyle}>Capacity: {cap}</span> : <span style={badgeStyle}>Capacity: —</span>}

            {activity?.published === false ? (
              <span style={{ ...badgeStyle, border: "1px solid rgba(251,191,36,0.55)", color: "#fde68a" }}>
                Draft / Not published
              </span>
            ) : null}
          </div>

          {/* DETAILS */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "10px 0 6px 0" }}>Detalhes</h2>

            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.25)",
                background: "rgba(2,6,23,0.35)",
                padding: 12,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Sport</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#e5e7eb" }}>{fieldValue(activity?.sport)}</p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Date & Time</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#e5e7eb" }}>{formatDateTime(activity?.date ?? null)}</p>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Address</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#e5e7eb", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {fieldValue(activity?.address_text)}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>City</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#e5e7eb" }}>{fieldValue(activity?.city)}</p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>State</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#e5e7eb" }}>{fieldValue(activity?.state)}</p>
              </div>
            </div>
          </div>

          {/* MAP */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "10px 0 6px 0" }}>Mapa</h2>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{addressFull}</p>

            <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(148,163,184,0.25)" }}>
              <iframe title="map" src={mapUrl} width="100%" height="260" style={{ border: 0 }} loading="lazy" />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressFull)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(56,189,248,0.55)",
                  background: "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                  color: "#e0f2fe",
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                Abrir no Google Maps
              </a>
            </div>
          </div>

          {/* DESCRIPTION */}
          {activity?.description ? (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: "10px 0 6px 0" }}>Descrição</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, whiteSpace: "pre-wrap" }}>{activity.description}</p>
            </div>
          ) : null}

          {/* CONTACT */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "10px 0 6px 0" }}>Contato</h2>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              Organizador WhatsApp: <span style={{ color: "#e5e7eb" }}>{fieldValue(activity?.organizer_whatsapp)}</span>
            </p>

            {activity?.organizer_whatsapp ? (
              <div style={{ marginTop: 10 }}>
                <a
                  href={`https://wa.me/${normalizePhone(activity.organizer_whatsapp).replace(/^\+/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    padding: "10px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(34,197,94,0.45)",
                    background: "rgba(22,163,74,0.18)",
                    color: "#bbf7d0",
                    textDecoration: "none",
                    fontWeight: 900,
                  }}
                >
                  Abrir WhatsApp
                </a>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
