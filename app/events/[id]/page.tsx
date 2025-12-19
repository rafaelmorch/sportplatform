"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
  organizer_id: string | null;

  image_path: string | null;
  image_url: string | null; // legado
};

type PublicRegistration = {
  nickname: string | null;
  registered_at: string | null;
};

type OwnerRegistration = {
  nickname: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_whatsapp: string | null;
  registered_at: string | null;
  payment_provider: string | null;
  payment_status: string | null;
  amount_cents: number | null;
  currency: string | null;
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

  const fallback = (e.address_text ?? "").trim();
  return fallback || "Location TBD";
}

function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseBrowser.storage.from("event-images").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function normalizePhone(input: string): string {
  return input.trim().replace(/[^\d+]/g, "");
}

function fieldValue(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length ? t : "—";
}

function centsToUsdLabel(amountCents: number | null, currency: string | null): string {
  const c = Number(amountCents ?? 0);
  const cur = (currency ?? "usd").toUpperCase();
  if (!Number.isFinite(c) || c <= 0) return "Free";
  return `${cur} ${(c / 100).toFixed(2)}`;
}

function csvEscape(v: any): string {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/* ================= Page ================= */

export default function EventDetailPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const { id: eventId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [registrations, setRegistrations] = useState<PublicRegistration[]>([]);
  const [registrationsCount, setRegistrationsCount] = useState(0);

  const [isRegistered, setIsRegistered] = useState(false);
  const [nickname, setNickname] = useState("");
  const [attendeeWhatsapp, setAttendeeWhatsapp] = useState("");

  const [isOwner, setIsOwner] = useState(false);

  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  // ✅ Owner-only registrations
  const [ownerRegs, setOwnerRegs] = useState<OwnerRegistration[]>([]);
  const [ownerRegsLoading, setOwnerRegsLoading] = useState(false);
  const [ownerRegsError, setOwnerRegsError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);

  const formAnchorRef = useRef<HTMLDivElement | null>(null);

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

  function scrollToForm() {
    setTimeout(() => {
      formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  async function refreshPublicRegs(targetEventId: string) {
    const { data: regs } = await supabase
      .from("event_registrations_public")
      .select("nickname, registered_at")
      .eq("event_id", targetEventId)
      .order("registered_at", { ascending: true })
      .limit(200);

    const { count } = await supabase
      .from("event_registrations_public")
      .select("nickname", { count: "exact", head: true })
      .eq("event_id", targetEventId);

    setRegistrations((regs as PublicRegistration[]) ?? []);
    setRegistrationsCount(count ?? 0);
  }

  async function loadOwnerRegs(targetEventId: string) {
    setOwnerRegsLoading(true);
    setOwnerRegsError(null);

    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(
          "nickname,attendee_name,attendee_email,attendee_whatsapp,registered_at,payment_provider,payment_status,amount_cents,currency"
        )
        .eq("event_id", targetEventId)
        .order("registered_at", { ascending: true })
        .limit(2000);

      if (error) throw new Error(error.message);

      setOwnerRegs((data as OwnerRegistration[]) ?? []);
    } catch (e: any) {
      setOwnerRegs([]);
      setOwnerRegsError(e?.message ?? "Failed to load registrations.");
    } finally {
      setOwnerRegsLoading(false);
    }
  }

  function exportOwnerRegsToExcelCsv() {
    const rows = ownerRegs ?? [];
    const header = [
      "Nickname",
      "Name",
      "Email",
      "WhatsApp",
      "Registered At",
      "Payment Provider",
      "Payment Status",
      "Amount",
    ];

    const lines = [
      header.map(csvEscape).join(","),
      ...rows.map((r) =>
        [
          r.nickname ?? "",
          r.attendee_name ?? "",
          r.attendee_email ?? "",
          r.attendee_whatsapp ?? "",
          r.registered_at ? new Date(r.registered_at).toISOString() : "",
          r.payment_provider ?? "",
          r.payment_status ?? "",
          centsToUsdLabel(r.amount_cents, r.currency),
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const safeTitle = (event?.title ?? "event").replace(/[^\w\-]+/g, "_").slice(0, 60);
    const filename = `${safeTitle}_registrations.csv`; // Excel abre direto

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ✅ CONFIRMAÇÃO pós-checkout (mantido)
  useEffect(() => {
    if (!eventId) return;

    const paid = searchParams?.get("paid");
    const sessionId = searchParams?.get("session_id");
    const canceled = searchParams?.get("canceled");

    if (canceled === "1") {
      setInfo("Payment canceled.");
      return;
    }

    if (paid === "1" && sessionId && !confirming) {
      let cancelled = false;

      async function confirm() {
        setConfirming(true);
        setError(null);
        setFormError(null);
        setInfo("Payment received. Confirming your registration...");

        try {
          const resp = await fetch("/api/stripe/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });

          if (!resp.ok) {
            const t = await resp.text();
            throw new Error(t || "Failed to confirm payment.");
          }

          const { data: userRes } = await supabase.auth.getUser();
          const user = userRes.user;

          if (user) {
            const { data: me } = await supabase
              .from("event_registrations")
              .select("nickname, attendee_whatsapp")
              .eq("event_id", eventId)
              .maybeSingle();

            if (!cancelled && me?.nickname) {
              setIsRegistered(true);
              setNickname(me.nickname);
              if (me?.attendee_whatsapp) setAttendeeWhatsapp(me.attendee_whatsapp);
            }
          }

          if (!cancelled) {
            await refreshPublicRegs(eventId);
            setInfo("Registration confirmed!");
            router.replace(`/events/${eventId}`);
          }
        } catch (e: any) {
          if (!cancelled) setError(e?.message ?? "Failed to confirm registration.");
        } finally {
          if (!cancelled) setConfirming(false);
        }
      }

      confirm();
      return () => {
        cancelled = true;
      };
    }
  }, [eventId, searchParams, confirming, router, supabase]);

  // Carrega evento + isOwner
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setError(null);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;

      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,sport,description,date,street,city,state,address_text,capacity,waitlist_capacity,price_cents,organizer_whatsapp,organizer_id,image_path,image_url"
        )
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (error) {
        setError(error.message || "Failed to load event.");
        setEvent(null);
        setIsOwner(false);
      } else {
        const e = (data as EventRow) ?? null;
        setEvent(e);

        const owner = !!(user?.id && e?.organizer_id && user.id === e.organizer_id);
        setIsOwner(owner);

        // ✅ Se for owner, já carrega as inscrições privadas
        if (owner) {
          loadOwnerRegs(eventId);
        }
      }

      setLoading(false);
    }

    loadEvent();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, eventId]);

  // Lista pública + contagem + minha inscrição
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function loadRegs() {
      setCountsLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;

      const { data: regs, error: regsErr } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true })
        .limit(200);

      const { count, error: countErr } = await supabase
        .from("event_registrations_public")
        .select("nickname", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (user) {
        const { data: me } = await supabase
          .from("event_registrations")
          .select("nickname, attendee_whatsapp")
          .eq("event_id", eventId)
          .maybeSingle();

        if (!cancelled) {
          if (me?.nickname) {
            setIsRegistered(true);
            setNickname(me.nickname);
            if (me?.attendee_whatsapp) setAttendeeWhatsapp(me.attendee_whatsapp);
          } else {
            setIsRegistered(false);
          }
        }
      } else {
        if (!cancelled) setIsRegistered(false);
      }

      if (!cancelled) {
        if (!regsErr) setRegistrations((regs as PublicRegistration[]) ?? []);
        if (!countErr) setRegistrationsCount(count ?? 0);
        setCountsLoading(false);
      }
    }

    loadRegs();
    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

  async function handleRegister() {
    if (!eventId) return;

    setBusy(true);
    setError(null);
    setInfo(null);
    setFormError(null);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("You must be logged in to register.");

      const nick = nickname.trim();
      if (nick.length < 2 || nick.length > 24) {
        setFormError("Please enter a nickname (2–24 characters).");
        scrollToForm();
        return;
      }

      const wa = normalizePhone(attendeeWhatsapp);
      if (wa.length < 8) {
        setFormError("WhatsApp is required (example: +14075551234).");
        scrollToForm();
        return;
      }

      const attendeeEmail = user.email ?? "";
      const attendeeName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        "";

      const price = event?.price_cents ?? 0;

      if (price > 0) {
        const resp = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            nickname: nick,
            userId: user.id,
            attendeeWhatsapp: wa,
            attendeeEmail,
            attendeeName,
          }),
        });

        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Checkout error: ${t || resp.status}`);
        }

        const { url } = await resp.json();
        if (!url) throw new Error("Missing checkout url.");

        const win = window.open(url, "_blank", "noopener,noreferrer");
        if (!win) window.location.assign(url);
        return;
      }

      const cap = event?.capacity ?? 0;
      const waitCap = event?.waitlist_capacity ?? 0;
      const totalAllowed = (cap > 0 ? cap : 0) + (waitCap > 0 ? waitCap : 0);

      if (cap > 0 && totalAllowed > 0 && registrationsCount >= totalAllowed) {
        setFormError("Event is full (including waitlist).");
        scrollToForm();
        return;
      }

      const { error: insErr } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: user.id,
        nickname: nick,
        attendee_whatsapp: wa,
        attendee_email: attendeeEmail || null,
        attendee_name: attendeeName || null,
        registered_at: new Date().toISOString(),
        status: "confirmed",
        payment_provider: "free",
        payment_status: "free",
        amount_cents: 0,
        currency: "usd",
      });

      if (insErr) throw new Error(insErr.message);

      setIsRegistered(true);
      setInfo("Registration confirmed!");
      await refreshPublicRegs(eventId);

      // ✅ Se owner estiver olhando o próprio evento, refresca tabela também
      if (isOwner) await loadOwnerRegs(eventId);
    } catch (e: any) {
      setError(e?.message ?? "Failed to register.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!eventId) return;
    if (!isOwner) return;

    const ok = window.confirm("Tem certeza que deseja apagar este evento? Isso não pode ser desfeito.");
    if (!ok) return;

    setDeleteBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { error: delErr } = await supabase.from("events").delete().eq("id", eventId);
      if (delErr) throw new Error(delErr.message);

      router.push("/events/manage");
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete event.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const addressFull = buildAddress(event);
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(addressFull)}&output=embed`;

  const priceLabel = formatPrice(event?.price_cents ?? 0);

  const cap = event?.capacity ?? 0;
  const spotsLeft = cap > 0 ? Math.max(cap - registrationsCount, 0) : null;

  const img = getPublicImageUrl(event?.image_path ?? null) || event?.image_url || null;

  const titleText = fieldValue(event?.title ?? null);
  const sportText = fieldValue(event?.sport ?? null);
  const dateText = event?.date ? formatDateTime(event.date) : "—";
  const addressText = fieldValue((event?.street ?? "").trim() || (event?.address_text ?? "").trim() || null);
  const cityText = fieldValue(event?.city ?? null);
  const stateText = fieldValue(event?.state ?? null);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#e5e7eb", padding: "16px", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <header style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
            Evento
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              {loading ? "Carregando..." : event?.title ?? "Evento"}
            </h1>

            <Link href="/events" style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline", whiteSpace: "nowrap" }}>
              Voltar
            </Link>
          </div>

          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            {(event?.sport ?? "")} • {formatDateTime(event?.date ?? null)}
          </p>

          {isOwner ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <Link
                href={`/events/${eventId}/edit`}
                style={{
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(56,189,248,0.55)",
                  background: "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                  color: "#e0f2fe",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                Editar
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
                  fontWeight: 800,
                }}
              >
                {deleteBusy ? "Apagando..." : "Apagar"}
              </button>
            </div>
          ) : null}
        </header>

        {error ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p> : null}
        {info ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{info}</p> : null}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
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
              <img src={img} alt={event?.title ?? "event image"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
                background: "linear-gradient(135deg, rgba(8,47,73,0.9), rgba(12,74,110,0.9))",
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

{/* Detalhes do evento */}
<div
  style={{
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.45)",
    padding: 14,
  }}
>
  <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px 0" }}>
    Detalhes do evento
  </h2>

  <div style={{ display: "flex", flexDirection: "column" }}>
    {[
      ["Title", titleText],
      ["Sport", sportText],
      ["Date & Time", dateText],
      ["Address", addressText],
      ["City", cityText],
      ["State", stateText],
    ].map(([k, v], idx, arr) => (
      <div key={k} style={{ padding: "10px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            gap: 12,
            alignItems: "start",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#94a3b8",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {k}
          </span>

          <span
            style={{
              fontSize: 14,
              color: "#e5e7eb",
              fontWeight: 700,
              textAlign: "right",
              wordBreak: "break-word",
            }}
          >
            {v}
          </span>
        </div>

        {idx !== arr.length - 1 ? (
          <div
            style={{
              marginTop: 10,
              height: 1,
              background: "rgba(148,163,184,0.12)",
              width: "100%",
            }}
          />
        ) : null}
      </div>
    ))}
  </div>

  {/* Mobile: melhora o layout (labels em cima, valor embaixo) */}
  <style jsx>{`
    @media (max-width: 520px) {
      .detailsRow {
        grid-template-columns: 1fr !important;
      }
      .detailsValue {
        text-align: left !important;
      }
    }
  `}</style>
</div>


          {/* Local + mapa */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>Local</h2>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{addressFull}</p>

            <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(148,163,184,0.25)" }}>
              <iframe title="map" src={mapUrl} width="100%" height="240" style={{ border: 0 }} loading="lazy" />
            </div>
          </div>

          {event?.description ? (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>Descrição</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, whiteSpace: "pre-wrap" }}>{event.description}</p>
            </div>
          ) : null}

          {/* Contato do organizador */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>Contato do organizador</h2>

            {isRegistered ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                WhatsApp: <span style={{ color: "#e5e7eb" }}>{event?.organizer_whatsapp ?? "—"}</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Faça a inscrição para liberar o WhatsApp do organizador.</p>
            )}
          </div>

          <div ref={formAnchorRef} />

          {/* Form inscrição */}
          <label style={labelStyle}>
            Nickname (visível para todos)
            <input
              style={inputStyle}
              placeholder="Ex: Rafa Runner"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isRegistered}
            />
          </label>

          <label style={labelStyle}>
            Your WhatsApp <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>{" "}
            <span style={{ color: "#9ca3af", fontWeight: 400 }}>(visível só para o organizador)</span>
            <input
              style={inputStyle}
              placeholder="Ex: +14075551234"
              value={attendeeWhatsapp}
              onChange={(e) => setAttendeeWhatsapp(e.target.value)}
              disabled={isRegistered}
            />
          </label>

          {formError ? (
            <div
              style={{
                marginTop: 2,
                borderRadius: 12,
                border: "1px solid rgba(248,113,113,0.55)",
                background: "rgba(127,29,29,0.20)",
                padding: "10px 12px",
                color: "#fecaca",
                fontSize: 13,
              }}
            >
              {formError}
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <p style={{ fontSize: 12, color: "#60a5fa", margin: 0 }}>
              {isRegistered
                ? "Você já está inscrito."
                : (event?.price_cents ?? 0) > 0
                ? "Evento pago: checkout abre em nova aba."
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
                background: "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                color: "#e0f2fe",
                cursor: busy || isRegistered ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {isRegistered ? "Inscrito" : busy ? "Processando..." : (event?.price_cents ?? 0) > 0 ? "Pagar e Inscrever-se" : "Inscrever-se"}
            </button>
          </div>

          {/* Participantes (público: só nickname) */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>Participantes</h2>

            {registrations.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Nenhum inscrito ainda.</p>
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

          {/* ✅ Owner-only: tabela + export */}
          {isOwner ? (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 6px 0" }}>Inscritos (Organizador)</h2>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                    Nickname, Name, Email e WhatsApp (privado).
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    onClick={() => loadOwnerRegs(eventId)}
                    disabled={ownerRegsLoading}
                    style={{
                      fontSize: 12,
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(148,163,184,0.35)",
                      background: "rgba(2,6,23,0.65)",
                      color: "#e5e7eb",
                      cursor: ownerRegsLoading ? "not-allowed" : "pointer",
                      fontWeight: 800,
                    }}
                  >
                    {ownerRegsLoading ? "Atualizando..." : "Atualizar"}
                  </button>

                  <button
                    onClick={exportOwnerRegsToExcelCsv}
                    disabled={ownerRegsLoading || ownerRegs.length === 0}
                    style={{
                      fontSize: 12,
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(56,189,248,0.55)",
                      background: "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                      color: "#e0f2fe",
                      cursor: ownerRegsLoading || ownerRegs.length === 0 ? "not-allowed" : "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Exportar Excel
                  </button>
                </div>
              </div>

              {ownerRegsError ? (
                <p style={{ margin: "10px 0 0 0", fontSize: 13, color: "#fca5a5" }}>{ownerRegsError}</p>
              ) : null}

              <div
                style={{
                  marginTop: 10,
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.25)",
                  overflowX: "auto",
                  background: "rgba(2,6,23,0.35)",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                  <thead>
                    <tr>
                      {["Nickname", "Name", "Email", "WhatsApp", "Registered", "Payment"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "10px 12px",
                            fontSize: 12,
                            color: "#93c5fd",
                            borderBottom: "1px solid rgba(148,163,184,0.20)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ownerRegsLoading ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "12px", fontSize: 13, color: "#9ca3af" }}>
                          Carregando inscritos...
                        </td>
                      </tr>
                    ) : ownerRegs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "12px", fontSize: 13, color: "#9ca3af" }}>
                          Nenhuma inscrição ainda.
                        </td>
                      </tr>
                    ) : (
                      ownerRegs.map((r, idx) => (
                        <tr key={`${r.nickname ?? "row"}-${idx}`}>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#e5e7eb", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                            {fieldValue(r.nickname)}
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#e5e7eb", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                            {fieldValue(r.attendee_name)}
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#e5e7eb", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                            {fieldValue(r.attendee_email)}
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#e5e7eb", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                            {fieldValue(r.attendee_whatsapp)}
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#9ca3af", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                            {r.registered_at ? formatDateTime(r.registered_at) : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#9ca3af", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                            {(r.payment_provider ?? "—").toUpperCase()} • {(r.payment_status ?? "—").toUpperCase()} •{" "}
                            {centsToUsdLabel(r.amount_cents, r.currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
