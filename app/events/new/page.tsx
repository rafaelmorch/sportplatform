// app/events/new/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type FormState = {
  title: string;
  sport: string;
  description: string;
  date: string; // datetime-local
  address_text: string;
  city: string;
  state: string;
  organizer_whatsapp: string;
  capacity: string; // keep as string for empty input
  waitlist_capacity: string; // optional
  price_usd: string; // dollars string
};

function toIntOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function toCentsOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export default function NewEventPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [form, setForm] = useState<FormState>({
    title: "",
    sport: "",
    description: "",
    date: "",
    address_text: "",
    city: "",
    state: "",
    organizer_whatsapp: "",
    capacity: "",
    waitlist_capacity: "",
    price_usd: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const helpStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
  };

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePublish() {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      // auth
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("You must be logged in to create an event.");

      // validate required
      const title = form.title.trim();
      if (title.length < 2) throw new Error("Title is required.");

      const sport = form.sport.trim();
      if (sport.length < 2) throw new Error("Sport is required.");

      const date = form.date.trim();
      if (!date) throw new Error("Date/Time is required.");

      const address_text = form.address_text.trim();
      if (address_text.length < 4) throw new Error("Address (full text) is required.");

      const city = form.city.trim();
      if (city.length < 2) throw new Error("City is required.");

      const state = form.state.trim();
      if (state.length < 2) throw new Error("State is required.");

      const capacityNum = toIntOrNull(form.capacity);
      if (capacityNum === null || capacityNum <= 0) {
        throw new Error("Capacity is required and must be > 0.");
      }

      const priceCents = toCentsOrNull(form.price_usd);
      if (priceCents === null || priceCents < 0) {
        throw new Error("Price (USD) is required (use 0 for Free).");
      }

      const waitlistNum = toIntOrNull(form.waitlist_capacity);
      if (waitlistNum !== null && waitlistNum < 0) {
        throw new Error("Waitlist must be empty or >= 0.");
      }

      const organizer_whatsapp = form.organizer_whatsapp.trim();

      // optional image upload
      let image_path: string | null = null;

      if (file) {
        try {
          const safeName = file.name.replace(/\s+/g, "-");
          const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

          const { error: upErr } = await supabase.storage
            .from("event-images")
            .upload(path, file, { upsert: false });

          if (upErr) {
            // Do NOT block creating event
            setInfo(null);
            setError(`Falha no upload da imagem: ${upErr.message} (evento será criado sem imagem)`);
          } else {
            image_path = path;
          }
        } catch (e: any) {
          setError(`Falha no upload da imagem: ${e?.message || "unknown"} (evento será criado sem imagem)`);
        }
      }

      // insert event
      const payload: any = {
        title,
        sport,
        description: form.description?.trim() || null,
        date: new Date(date).toISOString(),

        address_text,
        city,
        state,

        organizer_whatsapp: organizer_whatsapp || null,

        capacity: capacityNum,
        waitlist_capacity: waitlistNum ?? 0,
        price_cents: priceCents,

        image_path,
      };

      const { data, error: insErr } = await supabase
        .from("events")
        .insert(payload)
        .select("id")
        .single();

      if (insErr) {
        throw new Error(insErr.message || "Failed to create event.");
      }

      setInfo("Evento publicado!");
      router.push(`/events/${data.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to publish.");
    } finally {
      setBusy(false);
    }
  }

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
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
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
              gap: 10,
              alignItems: "center",
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Criar evento</h1>

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

          <p style={{ fontSize: 13, color: "#9ca3af", margin: "8px 0 0 0" }}>
            Preencha os campos obrigatórios (*) e publique seu evento.
          </p>
        </header>

        {error ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p>
        ) : null}

        {info ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{info}</p>
        ) : null}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Image (optional) */}
          <div>
            <p style={{ margin: 0, fontWeight: 700 }}>Imagem do evento (opcional)</p>
            <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#9ca3af" }}>
              PNG/JPG — ideal 1200×630.
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg"
              style={{ marginTop: 10 }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(f ? URL.createObjectURL(f) : null);
              }}
            />

            <div
              style={{
                marginTop: 10,
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
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>No image</span>
              )}
            </div>
          </div>

          {/* Basic */}
          <label style={labelStyle}>
            Title *
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: 5K Morning Run"
              disabled={busy}
            />
          </label>

          <label style={labelStyle}>
            Sport *
            <input
              style={inputStyle}
              value={form.sport}
              onChange={(e) => set("sport", e.target.value)}
              placeholder="Ex: Running, Soccer, Cycling..."
              disabled={busy}
            />
          </label>

          <label style={labelStyle}>
            Date/Time *
            <input
              style={inputStyle}
              type="datetime-local"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              disabled={busy}
            />
          </label>

          <label style={labelStyle}>
            Description (optional)
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detalhes do evento..."
              disabled={busy}
            />
          </label>

          {/* Location */}
          <label style={labelStyle}>
            Address (full text) *
            <input
              style={inputStyle}
              value={form.address_text}
              onChange={(e) => set("address_text", e.target.value)}
              placeholder="Ex: 12639 Langstaff Dr"
              disabled={busy}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12 }}>
            <label style={labelStyle}>
              City *
              <input
                style={inputStyle}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Ex: Windermere"
                disabled={busy}
              />
            </label>

            <label style={labelStyle}>
              State *
              <input
                style={inputStyle}
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="Ex: FL"
                disabled={busy}
              />
            </label>
          </div>

          {/* Organizer WhatsApp */}
          <label style={labelStyle}>
            WhatsApp do organizador *
            <input
              style={inputStyle}
              value={form.organizer_whatsapp}
              onChange={(e) => set("organizer_whatsapp", e.target.value)}
              placeholder="Ex: +16892480582"
              disabled={busy}
            />
            <div style={helpStyle}>
              (Só aparecerá para quem confirmar a inscrição)
            </div>
          </label>

          {/* Capacity / Waitlist / Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Capacity *
              <input
                style={inputStyle}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                placeholder="Ex: 20"
                inputMode="numeric"
                disabled={busy}
              />
            </label>

            <label style={labelStyle}>
              Waitlist (optional)
              <input
                style={inputStyle}
                value={form.waitlist_capacity}
                onChange={(e) => set("waitlist_capacity", e.target.value)}
                placeholder="Ex: 10"
                inputMode="numeric"
                disabled={busy}
              />
            </label>

            <label style={labelStyle}>
              Price (USD) *
              <input
                style={inputStyle}
                value={form.price_usd}
                onChange={(e) => set("price_usd", e.target.value)}
                placeholder="Ex: 15 (use 0 for Free)"
                inputMode="decimal"
                disabled={busy}
              />
            </label>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handlePublish}
              disabled={busy}
              style={{
                fontSize: 12,
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.55)",
                background:
                  "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                color: "#e0f2fe",
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 800,
              }}
            >
              {busy ? "Publicando..." : "Publicar evento"}
            </button>
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
