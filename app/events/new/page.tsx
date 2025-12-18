// app/events/new/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type NewEventForm = {
  title: string;
  sport: string;
  description: string;
  dateLocal: string; // datetime-local
  address_text: string; // Address (full text)
  city: string;
  state: string;
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

export default function NewEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);

  const [form, setForm] = useState<NewEventForm>({
    title: "",
    sport: "",
    description: "",
    dateLocal: "",
    address_text: "",
    city: "",
    state: "",
    capacity: "20",
    waitlist_capacity: "0",
    price: "15",
    organizer_whatsapp: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#60a5fa", // azul
    display: "block",
  };

  const hintStyle: React.CSSProperties = {
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
    color: "#ffffff", // texto digitado branco
    outline: "none",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 110,
    resize: "vertical",
  };

  function set<K extends keyof NewEventForm>(key: K, value: NewEventForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function toIsoFromLocal(local: string): string | null {
    // local: "2025-12-22T13:50"
    if (!local) return null;
    const d = new Date(local);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Você precisa estar logado para criar evento.");

      // validações mínimas
      const title = form.title.trim();
      const sport = form.sport.trim();
      const address = form.address_text.trim();
      const city = form.city.trim();
      const state = form.state.trim();
      const organizerWhatsapp = form.organizer_whatsapp.trim();

      if (title.length < 2) throw new Error("Title * é obrigatório.");
      if (sport.length < 2) throw new Error("Sport * é obrigatório.");
      if (address.length < 5) throw new Error("Address (texto completo) * é obrigatório.");
      if (city.length < 2) throw new Error("City * é obrigatório.");
      if (state.length < 2) throw new Error("State * é obrigatório.");
      if (organizerWhatsapp.length < 6) throw new Error("WhatsApp do organizador * é obrigatório.");

      const dateIso = toIsoFromLocal(form.dateLocal);
      if (!dateIso) throw new Error("Date/Time * é obrigatório.");

      const capacity = Math.max(0, parseInt(form.capacity || "0", 10) || 0);
      const waitCap = Math.max(0, parseInt(form.waitlist_capacity || "0", 10) || 0);
      const priceCents = dollarsToCents(form.price);

      // 1) cria evento primeiro (pra ter id)
      const { data: created, error: insErr } = await supabase
        .from("events")
        .insert({
          title,
          sport,
          description: form.description.trim() || null,
          date: dateIso,

          address_text: address,
          city,
          state,

          // se sua tabela ainda tiver street/city/state, ok manter city/state.
          // street NÃO usamos mais (você pediu address_text completo).
          street: null,

          capacity: capacity || null,
          waitlist_capacity: waitCap || null,
          price_cents: priceCents || 0,

          organizer_whatsapp: organizerWhatsapp,
          image_path: null,
        })
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);
      const eventId = created?.id as string;
      if (!eventId) throw new Error("Falha ao criar evento (sem ID).");

      // 2) upload opcional
      if (imageFile) {
        const ext = (imageFile.name.split(".").pop() || "jpg").toLowerCase();
        const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
        const path = `events/${eventId}/${Date.now()}.${safeExt}`;

        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(path, imageFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: imageFile.type || undefined,
          });

        if (upErr) {
          // cria o evento mesmo assim, mas avisa do upload
          setInfo("Evento criado, mas falha no upload da imagem: " + upErr.message);
        } else {
          const { error: updErr } = await supabase
            .from("events")
            .update({ image_path: path })
            .eq("id", eventId);

          if (updErr) {
            setInfo("Evento criado e imagem enviada, mas falha ao salvar referência: " + updErr.message);
          } else {
            setInfo("Evento criado com sucesso (com imagem)!");
          }
        }
      } else {
        setInfo("Evento criado com sucesso!");
      }

      // opcional: reset form
      setForm({
        title: "",
        sport: "",
        description: "",
        dateLocal: "",
        address_text: "",
        city: "",
        state: "",
        capacity: "20",
        waitlist_capacity: "0",
        price: "15",
        organizer_whatsapp: "",
      });
      setImageFile(null);
    } catch (e: any) {
      setError(e?.message || "Falha ao criar evento.");
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
        {/* Header simples, mesmo estilo */}
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
            gap: 14,
          }}
        >
          {/* Upload de imagem */}
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Imagem do evento (opcional)
            </p>
            <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#9ca3af" }}>
              PNG/JPG — ideal 1200×630.
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ marginTop: 10 }}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setImageFile(f);
              }}
            />
          </div>

          {/* Campos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <label style={labelStyle}>
              Title *
              <input
                style={inputStyle}
                placeholder="Ex: Prep Run"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              Sport *
              <input
                style={inputStyle}
                placeholder="Ex: Running"
                value={form.sport}
                onChange={(e) => set("sport", e.target.value)}
              />
              <div style={hintStyle}>Sem dropdown. Texto livre.</div>
            </label>

            <label style={labelStyle}>
              Date/Time *
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.dateLocal}
                onChange={(e) => set("dateLocal", e.target.value)}
              />
            </label>

            <label style={labelStyle}>
              Address (texto completo) *
              <input
                style={inputStyle}
                placeholder="Ex: 12639 Langstaff Dr"
                value={form.address_text}
                onChange={(e) => set("address_text", e.target.value)}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label style={labelStyle}>
                City *
                <input
                  style={inputStyle}
                  placeholder="Ex: Windermere"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </label>

              <label style={labelStyle}>
                State *
                <input
                  style={inputStyle}
                  placeholder="Ex: FL"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                />
              </label>
            </div>

            <label style={labelStyle}>
              Description
              <textarea
                style={textareaStyle}
                placeholder="Detalhes do evento, regras, etc..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <label style={labelStyle}>
                Capacity
                <input
                  style={inputStyle}
                  inputMode="numeric"
                  placeholder="Ex: 20"
                  value={form.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Waitlist
                <input
                  style={inputStyle}
                  inputMode="numeric"
                  placeholder="Ex: 0"
                  value={form.waitlist_capacity}
                  onChange={(e) => set("waitlist_capacity", e.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Price (USD)
                <input
                  style={inputStyle}
                  inputMode="decimal"
                  placeholder="Ex: 15"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </label>
            </div>

            <label style={labelStyle}>
              WhatsApp do organizador *{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (Só aparecerá para quem confirmar a inscrição)
              </span>
              <input
                style={inputStyle}
                placeholder="Ex: +16892480582"
                value={form.organizer_whatsapp}
                onChange={(e) => set("organizer_whatsapp", e.target.value)}
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
              marginTop: 4,
            }}
          >
            <p style={{ fontSize: 12, color: "#60a5fa", margin: 0 }}>
              Publicando o evento, ele já aparece na lista para outros usuários.
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
