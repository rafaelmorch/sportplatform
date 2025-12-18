// app/events/new/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type FormState = {
  title: string;
  sport: string;
  description: string;
  date: string; // datetime-local
  street: string;
  city: string;
  state: string;
  address_text: string;
  capacity: string; // number as string
  waitlist_capacity: string; // number as string
  price: string; // dollars as string
  organizer_whatsapp: string;
};

function dollarsToCents(v: string): number {
  const n = Number(String(v).replace(",", "."));
  if (!isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

function isValidUsState(state: string): boolean {
  const s = state.trim().toUpperCase();
  // Aceita 2 letras (FL, CA etc). Você pode tornar mais rígido depois.
  return /^[A-Z]{2}$/.test(s);
}

function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 120);
}

export default function NewEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: "",
    sport: "",
    description: "",
    date: "",
    street: "",
    city: "",
    state: "",
    address_text: "",
    capacity: "20",
    waitlist_capacity: "0",
    price: "0",
    organizer_whatsapp: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    color: "#ffffff", // texto branco
    outline: "none",
  };

  const helperStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
  };

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function requiredAsterisk() {
    return <span style={{ color: "#93c5fd" }}> *</span>;
  }

  async function handlePickImage(file: File | null) {
    setImageFile(file);
    setError(null);
    setInfo(null);

    if (!file) {
      setImagePreview(null);
      return;
    }

    // Preview local
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw new Error(userErr.message);
      const user = userRes.user;
      if (!user) throw new Error("Você precisa estar logado para criar eventos.");

      // ===== Validações (todos obrigatórios, exceto imagem) =====
      const title = form.title.trim();
      const sport = form.sport.trim();
      const description = form.description.trim();
      const date = form.date.trim();
      const street = form.street.trim();
      const city = form.city.trim();
      const state = form.state.trim().toUpperCase();
      const address_text = form.address_text.trim();
      const organizer_whatsapp = form.organizer_whatsapp.trim();

      const capacity = Math.max(Number(form.capacity || 0), 0);
      const waitlist_capacity = Math.max(Number(form.waitlist_capacity || 0), 0);

      if (!title) throw new Error("Título é obrigatório.");
      if (!sport) throw new Error("Esporte é obrigatório.");
      if (!date) throw new Error("Data/Hora é obrigatório.");
      if (!street) throw new Error("Street (número + rua) é obrigatório.");
      if (!city) throw new Error("City é obrigatório.");
      if (!state) throw new Error("State é obrigatório.");
      if (!isValidUsState(state)) throw new Error("State deve ter 2 letras (ex: FL).");
      if (!address_text) throw new Error("Address (texto completo) é obrigatório.");
      if (!description) throw new Error("Descrição é obrigatória.");
      if (!organizer_whatsapp) throw new Error("WhatsApp do organizador é obrigatório.");

      if (!Number.isFinite(capacity) || capacity < 0) throw new Error("Capacity inválida.");
      if (!Number.isFinite(waitlist_capacity) || waitlist_capacity < 0)
        throw new Error("Waitlist capacity inválida.");

      const price_cents = dollarsToCents(form.price);

      // ===== Upload da imagem (opcional) =====
      let image_path: string | null = null;

      if (imageFile) {
        const extName = sanitizeFileName(imageFile.name);
        const randomId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now());

        image_path = `${user.id}/${randomId}-${extName}`;

        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(image_path, imageFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: imageFile.type || "image/*",
          });

        if (upErr) {
          throw new Error(`Falha no upload da imagem: ${upErr.message}`);
        }
      }

      // ===== Insert do evento =====
      // date: converter de datetime-local -> ISO
      const dateIso = new Date(date).toISOString();

      const { data: inserted, error: insErr } = await supabase
        .from("events")
        .insert({
          title,
          sport,
          description,
          date: dateIso,
          street,
          city,
          state,
          address_text,
          capacity,
          waitlist_capacity,
          price_cents,
          organizer_whatsapp,
          image_path,
        })
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);
      if (!inserted?.id) throw new Error("Evento criado, mas não retornou ID.");

      setInfo("Evento criado com sucesso!");
      router.push(`/events/${inserted.id}`);
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
        {/* Header igual ao Groups */}
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
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>
                  Imagem do evento (opcional)
                </p>
                <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#9ca3af" }}>
                  PNG/JPG — ideal 1200×630.
                </p>
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
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Sem imagem</span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              style={{ marginTop: 10, ...inputStyle }}
              onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Campos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <label style={labelStyle}>
              Título{requiredAsterisk()}
              <input
                style={inputStyle}
                placeholder="Ex: Treino 5K + Café da Manhã"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              Esporte{requiredAsterisk()}
              <input
                style={inputStyle}
                placeholder="Ex: Running"
                value={form.sport}
                onChange={(e) => set("sport", e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              Data e hora{requiredAsterisk()}
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
              <div style={helperStyle}>Formato local do seu computador.</div>
            </label>

            <label style={labelStyle}>
              Street (número + rua){requiredAsterisk()}
              <input
                style={inputStyle}
                placeholder="Ex: 12639 Langstaff Dr"
                value={form.street}
                onChange={(e) => set("street", e.target.value)}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12 }}>
              <label style={labelStyle}>
                City{requiredAsterisk()}
                <input
                  style={inputStyle}
                  placeholder="Ex: Windermere"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </label>

              <label style={labelStyle}>
                State{requiredAsterisk()}
                <input
                  style={inputStyle}
                  placeholder="Ex: FL"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </label>
            </div>

            <label style={labelStyle}>
              Address (texto completo){requiredAsterisk()}
              <input
                style={inputStyle}
                placeholder="Ex: 12639 Langstaff Dr, Windermere, FL"
                value={form.address_text}
                onChange={(e) => set("address_text", e.target.value)}
              />
              <div style={helperStyle}>
                Esse campo é usado para o mapa e para exibir o endereço formatado.
              </div>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Preço (USD){requiredAsterisk()}
                <input
                  style={inputStyle}
                  placeholder="Ex: 15"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  inputMode="decimal"
                />
                <div style={helperStyle}>Use 0 para “Free”.</div>
              </label>

              <label style={labelStyle}>
                Capacity{requiredAsterisk()}
                <input
                  style={inputStyle}
                  placeholder="Ex: 20"
                  value={form.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                  inputMode="numeric"
                />
              </label>

              <label style={labelStyle}>
                Waitlist cap.{requiredAsterisk()}
                <input
                  style={inputStyle}
                  placeholder="Ex: 10"
                  value={form.waitlist_capacity}
                  onChange={(e) => set("waitlist_capacity", e.target.value)}
                  inputMode="numeric"
                />
              </label>
            </div>

            <label style={labelStyle}>
              WhatsApp do organizador{requiredAsterisk()}
              <input
                style={inputStyle}
                placeholder="Ex: +16892480582"
                value={form.organizer_whatsapp}
                onChange={(e) => set("organizer_whatsapp", e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              Descrição{requiredAsterisk()}
              <textarea
                style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                placeholder="Ex: Treino guiado + café da manhã. Chegue 15 min antes..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
          </div>

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
              Ao criar, o evento já aparece na lista e abre em /events/[id].
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
              {busy ? "Criando..." : "Criar evento"}
            </button>
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
