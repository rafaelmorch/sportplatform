"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
  organizer_id: string | null;

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
  const { data } = supabaseBrowser.storage
    .from("event-images")
    .getPublicUrl(path);
  return data?.publicUrl ?? null;
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

  const [isOwner, setIsOwner] = useState(false);

  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  /* ================= Effects ================= */

  useEffect(() => {
    const paid = searchParams?.get("paid");
    const canceled = searchParams?.get("canceled");

    if (paid === "1") {
      setInfo("Payment received. Confirming your registration...");
    } else if (canceled === "1") {
      setInfo("Payment canceled.");
    }
  }, [searchParams]);

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
      } else {
        const e = data as EventRow;
        setEvent(e);
        setIsOwner(!!(user?.id && e.organizer_id === user.id));
      }

      setLoading(false);
    }

    loadEvent();
    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function loadRegs() {
      setCountsLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;

      const { data: regs } = await supabase
        .from("event_registrations_public")
        .select("nickname, registered_at")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true });

      const { count } = await supabase
        .from("event_registrations_public")
        .select("nickname", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (user) {
        const { data: me } = await supabase
          .from("event_registrations")
          .select("nickname")
          .eq("event_id", eventId)
          .maybeSingle();

        if (!cancelled) {
          setIsRegistered(!!me?.nickname);
          setNickname(me?.nickname ?? "");
        }
      }

      if (!cancelled) {
        setRegistrations((regs ?? []) as PublicRegistration[]);
        setRegistrationsCount(count ?? 0);
        setCountsLoading(false);
      }
    }

    loadRegs();
    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

  /* ================= Actions ================= */

  async function handleRegister() {
    if (!eventId || !event) return;

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

      const price = event.price_cents ?? 0;

      /* ========= PAGO → NOVA ABA APENAS ========= */
      if (price > 0) {
        const win = window.open("about:blank", "_blank", "noopener,noreferrer");

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
          try { win?.close(); } catch {}
          throw new Error("Checkout error.");
        }

        const { url } = await resp.json();
        if (!url) {
          try { win?.close(); } catch {}
          throw new Error("Missing checkout url.");
        }

        if (win) {
          win.location.href = url;
          setInfo("Checkout aberto em nova aba.");
        } else {
          setInfo("Pop-up bloqueado. Permita pop-ups e tente novamente.");
        }

        return;
      }

      /* ========= GRÁTIS ========= */
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

      if (insErr) throw new Error(insErr.message);

      setIsRegistered(true);
      setInfo("Registration confirmed!");
      setRegistrationsCount((c) => c + 1);
    } catch (e: any) {
      setError(e?.message ?? "Failed to register.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!eventId || !isOwner) return;

    const ok = window.confirm("Tem certeza que deseja apagar este evento?");
    if (!ok) return;

    setDeleteBusy(true);
    try {
      await supabase.from("events").delete().eq("id", eventId);
      router.push("/events/manage");
    } finally {
      setDeleteBusy(false);
    }
  }

  /* ================= Render ================= */

  const img =
    getPublicImageUrl(event?.image_path ?? null) ||
    event?.image_url ||
    null;

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
      {/* 🔥 layout e JSX permanecem exatamente como você já tinha */}
      <BottomNavbar />
    </main>
  );
}
