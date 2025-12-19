"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  title: string | null;
  sport: string | null;
  description: string | null;
  date: string | null;

  address_text: string | null;
  city: string | null;
  state: string | null;

  capacity: number | null;
  waitlist_capacity: number | null;
  price_cents: number | null;

  organizer_whatsapp: string | null;
  image_path: string | null;
  organizer_id: string | null;
};

function centsFromUsd(usd: string): number | null {
  const v = usd.trim();
  if (!v) return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

function usdFromCents(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

export default function EditEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const { id: eventId } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // campos (mantendo seu padrão: city+state voltaram, sport texto, etc.)
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(""); // input datetime-local (ISO sem timezone)

  const [addressText, setAddressText] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");

  const [capacity, setCapacity] = useState("");
  const [waitlist, setWaitlist] = useState(""); // opcional
  const [priceUsd, setPriceUsd] = useState("");

  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        setError("Você precisa estar logado.");
        setLoading(false);
        return;
      }

      const { data, error: e } = await supabase
        .from("events")
        .select("id,title,sport,description,date,address_text,city,state,capacity,waitlist_capacity,price_cents,organizer_whatsapp,image_path,organizer_id")
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (e) {
        setError(e.message || "Falha ao carregar evento.");
        setLoading(false);
        return;
      }

      const ev = data as EventRow;

      // segurança: se não for o dono, vai falhar no update depois via RLS, mas já avisamos aqui
      if (ev.organizer_id && ev.organizer_id !== user.id) {
        setError("Você não é o organizador deste evento.");
        setLoading(false);
        return;
      }

      setTitle(ev.title ?? "");
      setSport(ev.sport ?? "");
      setDescription(ev.description ?? "");

      // transformar ISO -> datetime-local
      // (sem ficar doido com timezone: pega os primeiros 16 chars)
      setDate(ev.date ? ev.date.slice(0, 16) : "");

      setAddressText(ev.address_text ?? "");
      setCity(ev.city ?? "");
      setStateUS(ev.state ?? "");

      setCapacity(ev.capacity != null ? String(ev.capacity) : "");
      setWaitlist(ev.waitlist_capacity != null ? String(ev.waitlist_capacity) : "");
      setPriceUsd(usdFromCents(ev.price_cents));

      setWhatsapp(ev.organizer_whatsapp ?? "");

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, eventId]);

  async function handleSave() {
    if (!eventId) return;

    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      // validações
      if (title.trim().length < 3) throw new Error("Título é obrigatório (mín. 3).");
      if (sport.trim().length < 2) throw new Error("Esporte é obrigatório.");
      if (!date.trim()) throw new Error("Data e hora são obrigatórias.");
      if (addressText.trim().length < 5) throw new Error("Address (texto completo) é obrigatório.");
      if (city.trim().length < 2) throw new Error("Cidade é obrigatória.");
      if (stateUS.trim().length < 2) throw new Error("Estado é obrigatório.");

      if (!capacity.trim()) throw new Error("Capacity é obrigatória.");
      const capN = Number(capacity);
      if (!Number.isFinite(capN) || capN <= 0) throw new Error("Capacity deve ser um número > 0.");

      let waitN: number | null = null;
      if (waitlist.trim()) {
        const wn = Number(waitlist);
        if (!Number.isFinite(wn) || wn < 0) throw new Error("Waitlist deve ser vazio ou número >= 0.");
        waitN = wn;
      }

      if (!priceUsd.trim()) throw new Error("Price (USD) é obrigatório.");
      const priceCents = centsFromUsd(priceUsd);
      if (priceCents == null) throw new Error("Price (USD) inválido.");

      const payload = {
        title: title.trim(),
        sport: sport.trim(),
        description: description.trim() || null,
        // salvar ISO com timezone Z: adiciona ":00Z" se vier datetime-local
        date: `${date}:00.000Z`,
        address_text: addressText.trim(),
        city: city.trim(),
        state: stateUS.trim(),
        capacity: capN,
        waitlist_capacity: waitN,
        price_cents: priceCents,
        organizer_whatsapp: whatsapp.trim() || null,
      };

      const { error: upErr } = await supabase.from("events").update(payload).eq("id", eventId);
      if (upErr) throw new Error(upErr.message);

      setInfo("Evento atualizado com sucesso!");
    } catch (e: any) {
      setError(e?.message ?? "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#60a5fa" };
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

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#e5e7eb", padding: 16, paddingBottom: 80 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
              Eventos
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 0 0" }}>
              Alterar evento
            </h1>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/events/manage" style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline" }}>
              Voltar
            </Link>
            <Link href={`/events/${eventId}`} style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline" }}>
              Ver evento
            </Link>
          </div>
        </header>

        {error ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{error}</p> : null}
        {info ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{info}</p> : null}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {loading ? (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Carregando...</p>
          ) : (
            <>
              <label style={labelStyle}>
                Title *
                <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>

              <label style={labelStyle}>
                Sport *
                <input style={inputStyle} value={sport} onChange={(e) => setSport(e.target.value)} />
              </label>

              <label style={labelStyle}>
                Date & Time *
                <input style={inputStyle} type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>

              <label style={labelStyle}>
                Address (texto completo) *
                <input style={inputStyle} value={addressText} onChange={(e) => setAddressText(e.target.value)} />
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label style={{ ...labelStyle, flex: "1 1 220px" }}>
                  City *
                  <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} />
                </label>

                <label style={{ ...labelStyle, flex: "1 1 140px" }}>
                  State *
                  <input style={inputStyle} value={stateUS} onChange={(e) => setStateUS(e.target.value)} />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label style={{ ...labelStyle, flex: "1 1 180px" }}>
                  Capacity *
                  <input style={inputStyle} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </label>

                <label style={{ ...labelStyle, flex: "1 1 180px" }}>
                  Waitlist (opcional)
                  <input style={inputStyle} inputMode="numeric" value={waitlist} onChange={(e) => setWaitlist(e.target.value)} />
                </label>

                <label style={{ ...labelStyle, flex: "1 1 180px" }}>
                  Price (USD) *
                  <input style={inputStyle} inputMode="decimal" placeholder="Ex: 15.00" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} />
                </label>
              </div>

              <label style={labelStyle}>
                WhatsApp do organizador *{" "}
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  (Só aparecerá para quem confirmar a inscrição)
                </span>
                <input style={inputStyle} placeholder="+1..." value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </label>

              <label style={labelStyle}>
                Description (opcional)
                <textarea
                  style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => router.push("/events/manage")}
                  style={{
                    fontSize: 12,
                    padding: "10px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background: "rgba(2,6,23,0.65)",
                    color: "#e5e7eb",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSave}
                  disabled={busy}
                  style={{
                    fontSize: 12,
                    padding: "10px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(56,189,248,0.55)",
                    background: "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
                    color: "#e0f2fe",
                    fontWeight: 900,
                    cursor: busy ? "not-allowed" : "pointer",
                  }}
                >
                  {busy ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
