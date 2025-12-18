// app/events/new/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type CreateEventPayload = {
  title: string;
  sport: string;
  description: string | null;
  date: string; // ISO
  address_text: string;
  capacity: number | null;
  waitlist_capacity: number | null;
  price_cents: number | null;
  organizer_whatsapp: string;
  image_path: string | null;

  // compat (não vamos usar)
  street: null;
  city: null;
  state: null;
};

function dollarsToCents(v: string): number {
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function toIsoFromDatetimeLocal(value: string): string {
  // value ex: "2025-12-22T13:50"
  // new Date(...) interpreta no timezone local e converte pra ISO
  const d = new Date(value);
  return d.toISOString();
}

export default function CreateEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [description, setDescription] = useState("");
  const [datetimeLocal, setDatetimeLocal] = useState("");

  const [addressText, setAddressText] = useState("");
  const [capacity, setCapacity] = useState<string>("20");
  const [waitlistCapacity, setWaitlistCapacity] = useState<string>("0");
  const [price, setPrice] = useState<string>("15");
  const [organizerWhatsapp, setOrganizerWhatsapp] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#60a5fa", // azul
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "#374151", // cinza escuro
    color: "#ffffff",
    outline: "none",
  };

  const helperStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
  };

  function onPickImage(file: File | null) {
    setImageFile(file);
    if (!file) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  }

  async function uploadEventImage(file: File, userId: string): Promise<string> {
    // bucket precisa existir: event-images
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "jpg";

    const path = `${userId}/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.${safeExt}`;

    const { error: upErr } = await supabase.storage
      .from("event-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (upErr) {
      // Quando bucket não existe, normalmente vem "Bucket not found"
      throw new Error(`Falha no upload da imagem: ${upErr.message}`);
    }

    return path;
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw new Error(userErr.message);
      const user = userRes.user;
      if (!user) throw new Error("Você precisa estar logado para criar um evento.");

      const t = title.trim();
      const s = sport.trim();
      const a = addressText.trim();
      const w = organizerWhatsapp.trim();

      if (t.length < 2) throw new Error("Título * é obrigatório.");
      if (s.length < 2) throw new Error("Esporte * é obrigatório.");
      if (!datetimeLocal) throw new Error("Data/Hora * é obrigatória.");
      if (a.length < 6) throw new Error("Address (texto completo) * é obrigatório.");
      if (w.length < 6) throw new Error("WhatsApp do organizador * é obrigatório.");

      const capNum = capacity.trim() === "" ? null : Number(capacity);
      const waitNum = waitlistCapacity.trim() === "" ? null : Number(waitlistCapacity);
      const priceCents = dollarsToCents(price);

      if (capNum !== null && (!Number.isFinite(capNum) || capNum < 0)) {
        throw new Error("Capacidade deve ser um número válido.");
      }
      if (waitNum !== null && (!Number.isFinite(waitNum) || waitNum < 0)) {
        throw new Error("Waitlist deve ser um número válido.");
      }

      // 1) upload opcional
      let image_path: string | null = null;
      if (imageFile) {
        image_path = await uploadEventImage(imageFile, user.id);
      }

      // 2) insert do evento
      const payload: CreateEventPayload = {
        title: t,
        sport: s,
        description: description.trim() ? description.trim() : null,
        date: toIsoFromDatetimeLocal(datetimeLocal),
        address_text: a,
        capacity: capNum,
        waitlist_capacity: waitNum,
        price_cents: priceCents,
        organizer_whatsapp: w,
        image_path,

        street: null,
        city: null,
        state: null,
      };

      const { data: inserted, error: insErr } = await supabase
        .from("events")
        .insert(payload)
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);

      setInfo("Evento criado com sucesso!");
      // redireciona pro detalhe
      if (inserted?.id) {
        window.location.href = `/events/${inserted.id}`;
      }
    } catch (e: any) {
      setError(e?.message || "Erro ao criar evento.");
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
        {/* Header */}
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              Criar evento
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
            Preencha os campos obrigatórios (*) e publique seu evento.
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

        {/* Card */}
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
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                Imagem do evento (opcional)
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                PNG/JPG — ideal 1200×630.
              </div>
            </div>

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
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  Sem imagem selecionada
                </span>
              )}
            </div>

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              style={{ marginTop: 10, color: "#9ca3af" }}
            />
          </div>

          {/* Campos */}
          <label style={labelStyle}>
            Título *
            <input
              style={inputStyle}
              placeholder="Ex: Prep Run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Esporte *
            <input
              style={inputStyle}
              placeholder="Ex: Running"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Data e hora *
            <input
              style={inputStyle}
              type="datetime-local"
              value={datetimeLocal}
              onChange={(e) => setDatetimeLocal(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Address (texto completo) *
            <input
              style={inputStyle}
              placeholder="Ex: 123 Main St, Orlando, FL"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Capacidade (vagas)
            <input
              style={inputStyle}
              inputMode="numeric"
              placeholder="Ex: 20"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Waitlist (opcional)
            <input
              style={inputStyle}
              inputMode="numeric"
              placeholder="Ex: 0"
              value={waitlistCapacity}
              onChange={(e) => setWaitlistCapacity(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Preço (USD)
            <input
              style={inputStyle}
              inputMode="decimal"
              placeholder="Ex: 15"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <div style={helperStyle}>
              Dica: coloque 0 para evento grátis.
            </div>
          </label>

          <label style={labelStyle}>
            WhatsApp do organizador *
            <input
              style={inputStyle}
              placeholder="Ex: +1 689 000 0000"
              value={organizerWhatsapp}
              onChange={(e) => setOrganizerWhatsapp(e.target.value)}
            />
            <div style={helperStyle}>
              (Só aparecerá para quem confirmar a inscrição)
            </div>
          </label>

          <label style={labelStyle}>
            Descrição (opcional)
            <textarea
              style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              placeholder="Ex: Treino leve + café da manhã…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 6,
            }}
          >
            <p style={{ fontSize: 12, color: "#60a5fa", margin: 0 }}>
              Publicando, seu evento aparece na lista e já fica pronto para inscrição.
            </p>

            <button
              onClick={handleCreate}
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
              {busy ? "Publicando..." : "Publicar evento"}
            </button>
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
