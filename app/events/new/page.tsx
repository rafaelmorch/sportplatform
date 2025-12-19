"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

export default function NewEventPage() {
  const supabase = supabaseBrowser;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [capacity, setCapacity] = useState("");
  const [waitlist, setWaitlist] = useState("");
  const [price, setPrice] = useState("");

  const [whatsapp, setWhatsapp] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Você precisa estar logado.");

      if (
        !title ||
        !sport ||
        !date ||
        !address ||
        !city ||
        !state ||
        !capacity ||
        !price ||
        !whatsapp
      ) {
        throw new Error("Preencha todos os campos obrigatórios.");
      }

      let imagePath: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from("event-images")
          .upload(fileName, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) {
          throw new Error("Falha no upload da imagem.");
        }

        imagePath = fileName;
      }

      const { data, error: insErr } = await supabase
        .from("events")
        .insert({
          organizer_id: user.id, // ✅ FUNDAMENTAL
          title: title.trim(),
          sport: sport.trim(),
          description: description.trim() || null,
          date: new Date(date).toISOString(),

          address_text: address.trim(),
          city: city.trim(),
          state: state.trim(),

          capacity: Number(capacity),
          waitlist_capacity: waitlist ? Number(waitlist) : null,
          price_cents: Math.round(Number(price) * 100),

          organizer_whatsapp: whatsapp.trim(),
          image_path: imagePath,
        })
        .select("id")
        .single();

      if (insErr) throw insErr;

      router.push(`/events/${data.id}`);
    } catch (e: any) {
      setError(e.message || "Erro ao criar evento.");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = {
    fontSize: 12,
    color: "#60a5fa",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#374151",
    color: "#ffffff",
    border: "1px solid rgba(148,163,184,0.25)",
    outline: "none",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: 16,
        paddingBottom: 80,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Criar evento
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
          Preencha os campos obrigatórios (*) e publique seu evento.
        </p>

        {error && (
          <p style={{ fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>
            {error}
          </p>
        )}

        {/* Básico */}
        <label style={labelStyle}>Título *</label>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />

        <label style={labelStyle}>Esporte *</label>
        <input style={inputStyle} value={sport} onChange={(e) => setSport(e.target.value)} />

        <label style={labelStyle}>Data e horário *</label>
        <input type="datetime-local" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} />

        {/* Local */}
        <label style={labelStyle}>Address (texto completo) *</label>
        <input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} />

        <label style={labelStyle}>City *</label>
        <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} />

        <label style={labelStyle}>State *</label>
        <input style={inputStyle} value={state} onChange={(e) => setState(e.target.value)} />

        {/* Capacidade */}
        <label style={labelStyle}>Capacity *</label>
        <input type="number" style={inputStyle} value={capacity} onChange={(e) => setCapacity(e.target.value)} />

        <label style={labelStyle}>Waitlist (opcional)</label>
        <input type="number" style={inputStyle} value={waitlist} onChange={(e) => setWaitlist(e.target.value)} />

        {/* Preço */}
        <label style={labelStyle}>Price (USD) *</label>
        <input type="number" step="0.01" style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} />

        {/* WhatsApp */}
        <label style={labelStyle}>
          WhatsApp do organizador *{" "}
          <span style={{ color: "#9ca3af" }}>
            (Só aparecerá para quem confirmar a inscrição)
          </span>
        </label>
        <input style={inputStyle} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

        {/* Descrição */}
        <label style={labelStyle}>Descrição</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Imagem */}
        <label style={labelStyle}>Imagem do evento (opcional)</label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            marginTop: 20,
            padding: "12px 20px",
            borderRadius: 999,
            fontWeight: 700,
            background:
              "linear-gradient(135deg, rgba(8,47,73,0.95), rgba(12,74,110,0.95))",
            border: "1px solid rgba(56,189,248,0.6)",
            color: "#e0f2fe",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Publicando..." : "Publicar evento"}
        </button>
      </div>

      <BottomNavbar />
    </main>
  );
}
