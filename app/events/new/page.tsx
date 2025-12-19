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
  const [date, setDate] = useState("");

  const [addressText, setAddressText] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");

  const [capacity, setCapacity] = useState("");
  const [waitlist, setWaitlist] = useState("");
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
      if (!date.trim()) throw new Error("Date & Time * é obrigatório.");

      if (ad.length < 5) throw new Error("Address (texto completo) * é obrigatório.");
      if (ci.length < 2) throw new Error("City * é obrigatório.");
      if (st.length < 2) throw new Error("State * é obrigatório.");

      if (!capacity.trim()) throw new Error("Capacity * é obrigatório.");
      const capN = Number(capacity);
      if (!Number.isFinite(capN) || capN <= 0)
        throw new Error("Capacity deve ser um número > 0.");

      let waitN = 0;
      if (waitlist.trim()) {
        const wn = Number(waitlist);
        if (!Number.isFinite(wn) || wn < 0)
          throw new Error("Waitlist deve ser vazio ou número >= 0.");
        waitN = wn;
      }

      if (!priceUsd.trim()) throw new Error("Price (USD) * é obrigatório.");
      const cents = toCents(priceUsd);
      if (cents == null) throw new Error("Price (USD) inválido.");

      if (wa.length < 6)
        throw new Error("WhatsApp do organizador * é obrigatório.");

      let imagePath: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const fileName = `${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(fileName, imageFile, { cacheControl: "3600", upsert: false });

        if (upErr) throw new Error(upErr.message);

        imagePath = fileName;
      }

      const { data, error: insErr } = await supabase
        .from("events")
        .insert({
          organizer_id: user.id,
          title: t,
          sport: sp,
          description: description.trim() || null,
          date: `${date}:00.000Z`,
          address_text: ad,
          city: ci,
          state: st,
          capacity: capN,
          waitlist_capacity: waitN,
          price_cents: cents,
          organizer_whatsapp: wa,
          image_path: imagePath,
        })
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);

      setInfo("Evento publicado!");
      router.push(`/events/${data.id}`);
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
        <header style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.16em", color: "#64748b" }}>
            Eventos
          </p>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Criar evento</h1>
            <Link href="/events" style={{ fontSize: 12, color: "#93c5fd" }}>
              Voltar
            </Link>
          </div>
        </header>

        {error && (
          <p style={{ fontSize: 13, color: "#fca5a5" }}>{error}</p>
        )}
        {info && (
          <p style={{ fontSize: 13, color: "#86efac" }}>{info}</p>
        )}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, #020617, #020617 50%, #000000 100%)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* inputs iguais aos seus */}

          <label style={labelStyle}>
            Price (USD) *
            <input
              style={inputStyle}
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
            />
          </label>

          {/* 🔔 AVISO DE PAGAMENTO */}
          <div
            style={{
              marginTop: 8,
              borderRadius: 14,
              border: "1px solid rgba(56,189,248,0.35)",
              background: "rgba(8,47,73,0.25)",
              padding: 12,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "#e0f2fe", fontWeight: 800 }}>
              Payments & payout (important)
            </p>

            <p
              style={{
                margin: "6px 0 0 0",
                fontSize: 12,
                color: "#9ca3af",
                lineHeight: 1.4,
              }}
            >
              All paid registrations are processed through the{" "}
              <span style={{ color: "#e5e7eb" }}>Sports Platform</span> Stripe
              account. Event revenue will be deposited into the Sports Platform
              account.
              <br />
              <br />
              The organizer may request a payout at any time. Payments are sent
              via <span style={{ color: "#e5e7eb" }}>Zelle</span> within{" "}
              <span style={{ color: "#e5e7eb" }}>24 hours</span> after the
              request.
            </p>
          </div>

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
              fontWeight: 800,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Publicando..." : "Publicar"}
          </button>
        </section>
      </div>

      <BottomNavbar />
    </main>
  );
}
