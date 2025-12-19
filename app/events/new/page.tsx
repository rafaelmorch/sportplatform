"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

function toCents(usdText: string): number | null {
  const v = (usdText ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export default function NewEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");

  // ✅ Agora suporta várias datas
  const [dates, setDates] = useState<string[]>([""]);

  const [addressText, setAddressText] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");

  const [capacity, setCapacity] = useState("");
  const [waitlist, setWaitlist] = useState(""); // opcional
  const [priceUsd, setPriceUsd] = useState("");

  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#60a5fa",
    margin: 0,
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

  function addDateField() {
    setDates((prev) => [...prev, ""]);
  }

  function removeDateField(index: number) {
    setDates((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDateField(index: number, value: string) {
    setDates((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Você precisa estar logado para criar evento.");

      const t = title.trim();
      const sp = sport.trim();
      const ad = addressText.trim();
      const ci = city.trim();
      const st = stateUS.trim();
      const wa = whatsapp.trim();

      if (t.length < 3) throw new Error("Title * é obrigatório.");
      if (sp.length < 2) throw new Error("Sport * é obrigatório.");

      // ✅ validação das datas (múltiplas)
      const cleanDates = dates.map((d) => (d ?? "").trim()).filter(Boolean);
      if (cleanDates.length === 0) throw new Error("Adicione pelo menos uma Date & Time *.");

      // evitar datas duplicadas iguais
      const uniqueDates = Array.from(new Set(cleanDates));
      if (uniqueDates.length !== cleanDates.length) {
        throw new Error("Você adicionou datas repetidas. Remova as duplicadas.");
      }

      if (ad.length < 5) throw new Error("Address (texto completo) * é obrigatório.");
      if (ci.length < 2) throw new Error("City * é obrigatório.");
      if (st.length < 2) throw new Error("State * é obrigatório.");

      if (!capacity.trim()) throw new Error("Capacity * é obrigatório.");
      const capN = Number(capacity);
      if (!Number.isFinite(capN) || capN <= 0) throw new Error("Capacity deve ser um número > 0.");

      // ✅ WAITLIST opcional, mas o DB está NOT NULL -> manda 0 quando vazio
      let waitN = 0;
      if (waitlist.trim()) {
        const wn = Number(waitlist);
        if (!Number.isFinite(wn) || wn < 0) throw new Error("Waitlist deve ser vazio ou número >= 0.");
        waitN = wn;
      }

      if (!priceUsd.trim()) throw new Error("Price (USD) * é obrigatório.");
      const cents = toCents(priceUsd);
      if (cents == null) throw new Error("Price (USD) inválido.");

      if (wa.length < 6) throw new Error("WhatsApp do organizador * é obrigatório.");

      // Upload opcional (1 imagem para toda a série)
      let imagePath: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const fileName = `${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(fileName, imageFile, { cacheControl: "3600", upsert: false });

        if (upErr) throw new Error(upErr.message || "Falha no upload da imagem.");

        imagePath = fileName;
      }

      // ✅ série: cria um id único que conecta todos os eventos
      const seriesId = crypto.randomUUID();

      // ordena as datas para ficar bonitinho (do mais cedo pro mais tarde)
      const sortedDates = uniqueDates
        .slice()
        .sort((a, b) => new Date(`${a}:00.000Z`).getTime() - new Date(`${b}:00.000Z`).getTime());

      const rows = sortedDates.map((d, idx) => ({
        organizer_id: user.id,
        title: t,
        sport: sp,
        description: description.trim() || null,
        date: `${d}:00.000Z`,
        address_text: ad,
        city: ci,
        state: st,
        capacity: capN,
        waitlist_capacity: waitN,
        price_cents: cents,
        organizer_whatsapp: wa,
        image_path: imagePath,

        // ✅ novos campos (garanta que existem no DB)
        series_id: seriesId,
        series_index: idx + 1,
      }));

      const { data, error: insErr } = await supabase.from("events").insert(rows).select("id,date");

      if (insErr) throw new Error(insErr.message);

      if (!data || data.length === 0) throw new Error("Evento criado, mas não consegui obter o ID.");

      setInfo(
        rows.length > 1
          ? `Eventos publicados! (${rows.length} datas)`
          : "Evento publicado!"
      );

      // abre o primeiro evento criado (mais cedo)
      const first = data
        .slice()
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      router.push(`/events/${first.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao criar evento.");
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
              flexWrap: "wrap",
            }}
          >
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
            Campos com <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span> são obrigatórios.
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
            background: "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: "14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <label style={labelStyle}>
            Title <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>
            <input
              style={inputStyle}
              placeholder="Ex: Long Run de Domingo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Sport <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>
            <input
              style={inputStyle}
              placeholder="Ex: Running, Cycling, Functional..."
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            />
          </label>

          {/* ✅ Múltiplas datas */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={labelStyle}>
              Dates & Times <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (adicione várias datas se for repetitivo)
              </span>
            </p>

            {dates.map((d, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  style={inputStyle}
                  type="datetime-local"
                  value={d}
                  onChange={(e) => updateDateField(idx, e.target.value)}
                />

                {dates.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeDateField(idx)}
                    style={{
                      height: 42,
                      padding: "0 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(248,113,113,0.55)",
                      background: "rgba(127,29,29,0.35)",
                      color: "#fecaca",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                    title="Remover esta data"
                  >
                    Remover
                  </button>
                ) : null}
              </div>
            ))}

            <button
              type="button"
              onClick={addDateField}
              style={{
                alignSelf: "flex-start",
                fontSize: 12,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(2,6,23,0.65)",
                color: "#e5e7eb",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              + Adicionar data
            </button>
          </div>

          <label style={labelStyle}>
            Address (texto completo) <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>
            <input
              style={inputStyle}
              placeholder="Ex: 123 Main St"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <label style={{ ...labelStyle, flex: "1 1 220px" }}>
              City <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>
              <input
                style={inputStyle}
                placeholder="Ex: Orlando"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>

            <label style={{ ...labelStyle, flex: "1 1 140px" }}>
              State <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>
              <input
                style={inputStyle}
                placeholder="Ex: FL"
                value={stateUS}
                onChange={(e) => setStateUS(e.target.value)}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <label style={{ ...labelStyle, flex: "1 1 180px" }}>
              Capacity <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>
              <input
                style={inputStyle}
                inputMode="numeric"
                placeholder="Ex: 20"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </label>

            <label style={{ ...labelStyle, flex: "1 1 180px" }}>
              Waitlist (opcional)
              <input
                style={inputStyle}
                inputMode="numeric"
                placeholder="Ex: 10"
                value={waitlist}
                onChange={(e) => setWaitlist(e.target.value)}
              />
            </label>

            <label style={{ ...labelStyle, flex: "1 1 180px" }}>
              Price (USD) <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>
              <input
                style={inputStyle}
                inputMode="decimal"
                placeholder="Ex: 15.00 (0 = Free)"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
              />
            </label>
          </div>

          <label style={labelStyle}>
            WhatsApp do organizador <span style={{ color: "#93c5fd", fontWeight: 700 }}>*</span>{" "}
            <span style={{ color: "#9ca3af", fontWeight: 400 }}>
              (Só aparecerá para quem confirmar a inscrição)
            </span>
            <input
              style={inputStyle}
              placeholder="Ex: +1 407 555 1234"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Description (opcional)
            <textarea
              style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              placeholder="Descreva o evento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            Imagem do evento (opcional)
            <input
              style={inputStyle}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
              Dica: use uma imagem horizontal. (a mesma imagem será usada para todas as datas)
            </span>
          </label>

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
              Ao publicar, será criado 1 evento por data.
            </p>

            <button
              onClick={handleCreate}
              disabled={busy}
              style={{
                fontSize: 12,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.55)",
                background: "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                color: "#e0f2fe",
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 800,
              }}
            >
              {busy ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
