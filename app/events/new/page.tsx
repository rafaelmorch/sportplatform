// app/events/new/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

/* ================= Helpers ================= */

function toCents(input: string): number {
  const raw = input.trim();
  if (!raw) return 0;
  const normalized = raw.replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

function normalizeWhatsApp(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/[^\d]/g, "");
  return plus + digits;
}

function isValidWhatsApp(input: string): boolean {
  const norm = normalizeWhatsApp(input);
  const digits = norm.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/* ===== Label com asterisco ===== */
function Label({
  text,
  required = false,
}: {
  text: string;
  required?: boolean;
}) {
  return (
    <span>
      {text}
      {required && (
        <span style={{ color: "#2563eb", marginLeft: 4 }}>*</span>
      )}
    </span>
  );
}

export default function NewEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();

  /* ================= State ================= */

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");

  const [capacity, setCapacity] = useState("20");
  const [waitlistCapacity, setWaitlistCapacity] = useState("0");
  const [price, setPrice] = useState("0");

  const [organizerWhatsapp, setOrganizerWhatsapp] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= Styles ================= */

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

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 110,
    resize: "vertical",
  };

  /* ================= Image ================= */

  function onPickImage(file: File | null) {
    setImageFile(file);
    setError(null);
    if (!file) {
      setImagePreview(null);
      return;
    }
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadEventImage(userId: string): Promise<string | null> {
    if (!imageFile) return null;

    const bucket = "event-images";
    const safeName = imageFile.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type || "image/jpeg",
      });

    if (error) throw new Error(error.message);
    return path;
  }

  /* ================= Submit ================= */

  async function submit(publishNow: boolean) {
    setBusy(true);
    setError(null);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("You must be logged in.");

      if (!title.trim()) throw new Error("Title is required.");
      if (!sport.trim()) throw new Error("Sport is required.");
      if (!date) throw new Error("Date & time is required.");
      if (!street || !city || !stateUS)
        throw new Error("Complete address is required.");
      if (!capacity || Number(capacity) < 1)
        throw new Error("Capacity must be at least 1.");
      if (!isValidWhatsApp(organizerWhatsapp))
        throw new Error("Invalid WhatsApp.");

      const imagePath = await uploadEventImage(user.id);
      const addressText = `${street}, ${city}, ${stateUS.toUpperCase()}`;

      const { data, error } = await supabase
        .from("events")
        .insert({
          title: title.trim(),
          sport: sport.trim(),
          date: new Date(date).toISOString(),
          description: description.trim(),
          created_by: user.id,

          street,
          city,
          state: stateUS.toUpperCase(),
          address_text: addressText,
          location: addressText,
          location_name: addressText,

          capacity: Number(capacity),
          waitlist_capacity: Number(waitlistCapacity),
          price_cents: toCents(price),

          organizer_whatsapp: normalizeWhatsApp(organizerWhatsapp),
          published: publishNow,
          image_path: imagePath,

          lat: null,
          lng: null,
        })
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/events/${data.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create event.");
    } finally {
      setBusy(false);
    }
  }

  /* ================= Render ================= */

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
              margin: 0,
            }}
          >
            Eventos
          </p>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              Criar evento
            </h1>
            <Link
              href="/events"
              style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline" }}
            >
              Voltar
            </Link>
          </div>

          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Campos marcados com * são obrigatórios.
          </p>
        </header>

        {error && (
          <p style={{ fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>
            {error}
          </p>
        )}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000 100%)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <label style={labelStyle}>
            <Label text="Título" required />
            <input
              style={inputStyle}
              placeholder="OCSC 5K Group Run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="Esporte" required />
            <input
              style={inputStyle}
              placeholder="Running, Cycling, Triathlon..."
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="Data & hora" required />
            <input
              type="datetime-local"
              style={inputStyle}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="Descrição" />
            <textarea
              style={textareaStyle}
              placeholder="Descreva o evento, ritmo, público-alvo, regras, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="Street (US format)" required />
            <input
              style={inputStyle}
              placeholder="3516 President Barack Obama Pkwy"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="City" required />
            <input
              style={inputStyle}
              placeholder="Orlando"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="State" required />
            <input
              style={{ ...inputStyle, textTransform: "uppercase" }}
              placeholder="FL"
              value={stateUS}
              onChange={(e) => setStateUS(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="Capacity" required />
            <input
              style={inputStyle}
              placeholder="20"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="Waitlist capacity" />
            <input
              style={inputStyle}
              placeholder="0"
              value={waitlistCapacity}
              onChange={(e) => setWaitlistCapacity(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="Price (USD)" />
            <input
              style={inputStyle}
              placeholder="0 (Free)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <Label text="WhatsApp do organizador" required />
            <input
              style={inputStyle}
              placeholder="+1 407 000 0000"
              value={organizerWhatsapp}
              onChange={(e) => setOrganizerWhatsapp(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => submit(false)}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "#1f2937",
                color: "#e5e7eb",
              }}
            >
              Salvar draft
            </button>

            <button
              onClick={() => submit(true)}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Publicar
            </button>
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
