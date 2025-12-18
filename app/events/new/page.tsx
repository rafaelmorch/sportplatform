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
  dateLocal: string;
  address_text: string;
  city: string;
  state: string;
  capacity: string;
  waitlist_capacity: string;
  price: string;
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
    capacity: "",            // 🔧 agora vazio
    waitlist_capacity: "",   // 🔧 agora vazio e NÃO obrigatório
    price: "",               // 🔧 agora vazio
    organizer_whatsapp: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#60a5fa",
    display: "block",
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

  function set<K extends keyof NewEventForm>(key: K, value: NewEventForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function toIsoFromLocal(local: string): string | null {
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
      if (!user) throw new Error("Você precisa estar logado.");

      if (!form.title.trim()) throw new Error("Title * é obrigatório.");
      if (!form.sport.trim()) throw new Error("Sport * é obrigatório.");
      if (!form.dateLocal) throw new Error("Date/Time * é obrigatório.");
      if (!form.address_text.trim()) throw new Error("Address * é obrigatório.");
      if (!form.city.trim()) throw new Error("City * é obrigatório.");
      if (!form.state.trim()) throw new Error("State * é obrigatório.");
      if (!form.capacity.trim()) throw new Error("Capacity * é obrigatório.");
      if (!form.price.trim()) throw new Error("Price * é obrigatório.");
      if (!form.organizer_whatsapp.trim())
        throw new Error("WhatsApp do organizador * é obrigatório.");

      const capacity = parseInt(form.capacity, 10);
      if (capacity <= 0) throw new Error("Capacity deve ser maior que zero.");

      const waitlist = form.waitlist_capacity
        ? Math.max(0, parseInt(form.waitlist_capacity, 10))
        : 0;

      const priceCents = dollarsToCents(form.price);

      const dateIso = toIsoFromLocal(form.dateLocal);
      if (!dateIso) throw new Error("Data inválida.");

      const { data: created, error: insErr } = await supabase
        .from("events")
        .insert({
          title: form.title.trim(),
          sport: form.sport.trim(),
          description: form.description.trim() || null,
          date: dateIso,
          address_text: form.address_text.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          capacity,
          waitlist_capacity: waitlist,
          price_cents: priceCents,
          organizer_whatsapp: form.organizer_whatsapp.trim(),
          image_path: null,
        })
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);
      const eventId = created.id;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `events/${eventId}/${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(path, imageFile, { upsert: true });

        if (!upErr) {
          await supabase
            .from("events")
            .update({ image_path: path })
            .eq("id", eventId);
        }
      }

      setInfo("Evento criado com sucesso!");
      setForm({
        title: "",
        sport: "",
        description: "",
        dateLocal: "",
        address_text: "",
        city: "",
        state: "",
        capacity: "",
        waitlist_capacity: "",
        price: "",
        organizer_whatsapp: "",
      });
      setImageFile(null);
    } catch (e: any) {
      setError(e.message || "Erro ao criar evento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", padding: 16, paddingBottom: 80 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24 }}>Criar evento</h1>

        {error && <p style={{ color: "#fca5a5" }}>{error}</p>}
        {info && <p style={{ color: "#86efac" }}>{info}</p>}

        <label style={labelStyle}>Capacity *</label>
        <input style={inputStyle} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />

        <label style={labelStyle}>Waitlist (opcional)</label>
        <input style={inputStyle} value={form.waitlist_capacity} onChange={(e) => set("waitlist_capacity", e.target.value)} />

        <label style={labelStyle}>Price (USD) *</label>
        <input style={inputStyle} value={form.price} onChange={(e) => set("price", e.target.value)} />

        <button onClick={handleCreate} disabled={busy} style={{ marginTop: 20 }}>
          {busy ? "Publicando..." : "Publicar evento"}
        </button>
      </div>

      <BottomNavbar />
    </main>
  );
}
