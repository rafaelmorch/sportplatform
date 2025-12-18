// app/events/new/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

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

export default function NewEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [date, setDate] = useState(""); // datetime-local
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

  function onPickImage(file: File | null) {
    setImageFile(file);
    setError(null);
    if (!file) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  async function uploadEventImage(userId: string): Promise<string | null> {
    if (!imageFile) return null;

    const bucket = "event-images";
    const safeName = imageFile.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, imageFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: imageFile.type || "image/jpeg",
    });

    if (error) throw new Error(error.message);
    return path; // path dentro do bucket
  }

  async function submit(publishNow: boolean) {
    setBusy(true);
    setError(null);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw new Error(userErr.message);
      const user = userRes.user;
      if (!user) throw new Error("You must be logged in to create an event.");

      const t = title.trim();
      if (!t) throw new Error("Title is required.");

      const sp = sport.trim();
      if (!sp) throw new Error("Sport is required.");

      if (!date) throw new Error("Date/Time is required.");

      const st = street.trim();
      const ct = city.trim();
      const stUS = stateUS.trim().toUpperCase();
      if (!st || !ct || !stUS) throw new Error("Address is required (Street, City, State).");

      const cap = Number(capacity);
      if (!Number.isFinite(cap) || cap < 1) throw new Error("Capacity must be at least 1.");

      const wcap = Number(waitlistCapacity);
      if (!Number.isFinite(wcap) || wcap < 0) throw new Error("Waitlist capacity must be 0 or more.");

      if (!organizerWhatsapp.trim()) throw new Error("Organizer WhatsApp is required.");
      if (!isValidWhatsApp(organizerWhatsapp)) {
        throw new Error("Organizer WhatsApp looks invalid. Use digits (and optional +).");
      }

      const priceCents = toCents(price);
      const addressText = `${st}, ${ct}, ${stUS}`;

      const imagePath = await uploadEventImage(user.id);

      const payload: any = {
        title: t,
        sport: sp,
        date: new Date(date).toISOString(),
        description: description.trim(),
        created_by: user.id,

        // endereço (padrão EUA)
        street: st,
        city: ct,
        state: stUS,
        address_text: addressText,

        // legado/compat
        location: addressText,
        location_name: addressText,

        capacity: cap,
        waitlist_capacity: wcap,
        price_cents: priceCents,

        organizer_whatsapp: normalizeWhatsApp(organizerWhatsapp),
        published: publishNow,

        image_path: imagePath,

        // mapa vem depois -> lat/lng ficam null
        lat: null,
        lng: null,
      };

      const { data: inserted, error: insErr } = await supabase
        .from("events")
        .insert(payload)
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);

      router.push(`/events/${inserted.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create event.");
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
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header no estilo de Grupos */}
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
            Eventos
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Criar evento</h1>

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
            Crie uma atividade para a comunidade. Depois a gente adiciona seleção de local no mapa (clique no mapa).
          </p>
        </header>

        {error ? (
          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>
            {error}
          </p>
        ) : null}

        {/* Card no mesmo estilo */}
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
          {/* Imagem */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 4 }}>
                Informações do evento
              </h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Imagem se ajusta automaticamente (não corta).
              </p>
            </div>

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
              Draft / Publish
            </span>
          </div>

          <label style={{ fontSize: 12, color: "#9ca3af" }}>
            Imagem (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>

          {imagePreview ? (
            <div
              style={{
                width: "100%",
                height: 180,
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.25)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <img
                src={imagePreview}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          ) : null}

          {/* Campos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <label style={{ fontSize: 12, color: "#9ca3af" }}>
              Título
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="OCSC 5K Group Run"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "rgba(2,6,23,0.65)",
                  color: "#e5e7eb",
                  outline: "none",
                }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                Esporte
                <input
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  placeholder="Running / Cycling / Triathlon..."
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                Data & hora
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>
            </div>

            <label style={{ fontSize: 12, color: "#9ca3af" }}>
              Descrição
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que vai acontecer? Ritmo, público, regras, etc."
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "rgba(2,6,23,0.65)",
                  color: "#e5e7eb",
                  outline: "none",
                  minHeight: 110,
                  resize: "vertical",
                }}
              />
            </label>

            {/* Endereço padrão EUA */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 10 }}>
              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                Street (US format)
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="3516 President Barack Obama Pkwy"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                City
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Orlando"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                State
                <input
                  value={stateUS}
                  onChange={(e) => setStateUS(e.target.value)}
                  placeholder="FL"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                    textTransform: "uppercase",
                  }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                Capacidade
                <input
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  inputMode="numeric"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                Waitlist capacity
                <input
                  value={waitlistCapacity}
                  onChange={(e) => setWaitlistCapacity(e.target.value)}
                  inputMode="numeric"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                Preço (USD) — 0 = Free
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ fontSize: 12, color: "#9ca3af" }}>
                WhatsApp do organizador
                <input
                  value={organizerWhatsapp}
                  onChange={(e) => setOrganizerWhatsapp(e.target.value)}
                  placeholder="+1 407 000 0000"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>
            </div>

            {/* Ações */}
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
                Você pode salvar como draft e publicar depois.
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => submit(false)}
                  disabled={busy}
                  style={{
                    fontSize: 12,
                    padding: "10px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    cursor: busy ? "not-allowed" : "pointer",
                  }}
                >
                  {busy ? "Salvando..." : "Salvar draft"}
                </button>

                <button
                  onClick={() => submit(true)}
                  disabled={busy}
                  style={{
                    fontSize: 12,
                    padding: "10px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(56,189,248,0.55)",
                    background:
                      "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                    color: "#e0f2fe",
                    cursor: busy ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {busy ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
