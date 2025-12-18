// app/events/new/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type FormState = {
  title: string;
  sport: string;
  description: string;
  dateLocal: string; // input datetime-local
  street: string; // Address (número + rua)
  city: string;
  state: string;
  capacity: string;
  waitlist_capacity: string;
  price_dollars: string;
  organizer_whatsapp: string;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI",
  "MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

function dollarsToCents(input: string): number {
  const cleaned = (input || "").replace(/[^\d.]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export default function CreateEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);

  const [form, setForm] = useState<FormState>({
    title: "",
    sport: "Running",
    description: "",
    dateLocal: "",
    street: "",
    city: "",
    state: "FL",
    capacity: "20",
    waitlist_capacity: "0",
    price_dollars: "15",
    organizer_whatsapp: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#60a5fa", // azul
    display: "block",
  };

  const helpStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "#374151", // cinza escuro
    color: "#ffffff", // texto branco digitado
    outline: "none",
  };

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function isRequiredOk(): string | null {
    if (!form.title.trim()) return "Title is required.";
    if (!form.sport.trim()) return "Sport is required.";
    if (!form.dateLocal.trim()) return "Date/Time is required.";
    if (!form.street.trim()) return "Address (número + rua) is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.state.trim()) return "State is required.";
    if (!form.organizer_whatsapp.trim()) return "WhatsApp do organizador is required.";
    return null;
  }

  async function handlePickImage(file: File | null) {
    setImageFile(file);
    setError(null);
    setInfo(null);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const requiredMsg = isRequiredOk();
      if (requiredMsg) throw new Error(requiredMsg);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("You must be logged in to create an event.");

      // Converte datetime-local -> ISO
      // (o browser cria em timezone local; aqui mandamos ISO)
      const dateIso = new Date(form.dateLocal).toISOString();

      const capacity = Number(form.capacity || "0");
      const waitlist = Number(form.waitlist_capacity || "0");
      const priceCents = dollarsToCents(form.price_dollars);

      const street = form.street.trim();
      const city = form.city.trim();
      const state = form.state.trim().toUpperCase();

      // ✅ mantém city/state e também grava address_text para compatibilidade
      const addressText = `${street}, ${city}, ${state}`;

      // 1) cria evento (sem imagem primeiro)
      const { data: created, error: createErr } = await supabase
        .from("events")
        .insert({
          title: form.title.trim(),
          sport: form.sport.trim(),
          description: (form.description || "").trim() || null,
          date: dateIso,

          street,
          city,
          state,
          address_text: addressText,

          capacity: Number.isFinite(capacity) ? capacity : 0,
          waitlist_capacity: Number.isFinite(waitlist) ? waitlist : 0,
          price_cents: Number.isFinite(priceCents) ? priceCents : 0,

          organizer_whatsapp: form.organizer_whatsapp.trim(),
          image_path: null,
        })
        .select("id")
        .single();

      if (createErr) throw new Error(createErr.message || "Failed to create event.");
      const eventId = created?.id as string;
      if (!eventId) throw new Error("Event created but missing ID.");

      // 2) upload opcional da imagem
      if (imageFile) {
        const ext = (imageFile.name.split(".").pop() || "jpg").toLowerCase();
        const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
        const path = `${eventId}/${Date.now()}.${safeExt}`;

        const { error: upErr } = await supabase.storage
          .from("event-images") // ✅ tem que existir esse bucket
          .upload(path, imageFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: imageFile.type || undefined,
          });

        if (upErr) {
          // Dá um erro muito claro se o bucket não existir
          if ((upErr.message || "").toLowerCase().includes("bucket")) {
            throw new Error(
              `Falha no upload da imagem: Bucket not found. Crie o bucket "event-images" no Supabase Storage (nome exato).`
            );
          }
          throw new Error(`Falha no upload da imagem: ${upErr.message}`);
        }

        // 3) salva image_path no evento
        const { error: updErr } = await supabase
          .from("events")
          .update({ image_path: path })
          .eq("id", eventId);

        if (updErr) throw new Error(`Event created but failed to save image: ${updErr.message}`);
      }

      setInfo("Evento publicado com sucesso!");
      // opcional: redirecionar
      window.location.href = "/events";
    } catch (e: any) {
      setError(e?.message || "Failed to publish event.");
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
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(148,163,184,0.35)",
                padding: 14,
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>Imagem do evento (opcional)</p>
              <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
                PNG/JPG — ideal 1200×630.
              </p>

              <div style={{ marginTop: 12 }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
                  style={{ ...inputStyle, padding: 10 }}
                />
              </div>

              <div
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.25)",
                  overflow: "hidden",
                  height: 220,
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
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    Nenhuma imagem selecionada
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Campos */}
          <label style={labelStyle}>
            Título *
            <input
              style={inputStyle}
              placeholder="Ex: Treino 5K + Café"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Esporte *
            <select
              style={inputStyle}
              value={form.sport}
              onChange={(e) => setField("sport", e.target.value)}
            >
              <option value="Running">Running</option>
              <option value="Soccer">Soccer</option>
              <option value="Cycling">Cycling</option>
              <option value="Triathlon">Triathlon</option>
              <option value="Gym">Gym</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label style={labelStyle}>
            Data e hora *
            <input
              style={inputStyle}
              type="datetime-local"
              value={form.dateLocal}
              onChange={(e) => setField("dateLocal", e.target.value)}
            />
          </label>

          {/* ✅ VOLTOU: Address + City + State (não mexer mais) */}
          <label style={labelStyle}>
            Address (número + rua) *
            <input
              style={inputStyle}
              placeholder="Ex: 12639 Langstaff Dr"
              value={form.street}
              onChange={(e) => setField("street", e.target.value)}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
            <label style={labelStyle}>
              City *
              <input
                style={inputStyle}
                placeholder="Ex: Windermere"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              State *
              <select
                style={inputStyle}
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
              >
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Capacidade
              <input
                style={inputStyle}
                placeholder="Ex: 20"
                value={form.capacity}
                onChange={(e) => setField("capacity", e.target.value)}
                inputMode="numeric"
              />
            </label>

            <label style={labelStyle}>
              Waitlist
              <input
                style={inputStyle}
                placeholder="Ex: 0"
                value={form.waitlist_capacity}
                onChange={(e) => setField("waitlist_capacity", e.target.value)}
                inputMode="numeric"
              />
            </label>

            <label style={labelStyle}>
              Preço (USD)
              <input
                style={inputStyle}
                placeholder="Ex: 15"
                value={form.price_dollars}
                onChange={(e) => setField("price_dollars", e.target.value)}
                inputMode="decimal"
              />
            </label>
          </div>

          <label style={labelStyle}>
            WhatsApp do organizador *{" "}
            <span style={{ color: "#9ca3af" }}>
              (Só aparecerá para quem confirmar a inscrição)
            </span>
            <input
              style={inputStyle}
              placeholder="Ex: +16892480582"
              value={form.organizer_whatsapp}
              onChange={(e) => setField("organizer_whatsapp", e.target.value)}
            />
            <div style={helpStyle}>
              Dica: use com DDI (ex: +1...).
            </div>
          </label>

          <label style={labelStyle}>
            Descrição
            <textarea
              style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              placeholder="Ex: Treino leve + coffee meetup depois."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
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
              Ao publicar, o evento fica visível no app.
            </p>

            <button
              onClick={handleSubmit}
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
