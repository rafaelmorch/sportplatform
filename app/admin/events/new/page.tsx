"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type FormState = {
  title: string;
  description: string;
  dateLocal: string;
  sport: string;

  location_name: string;
  address_text: string;
  city: string;
  state: string;

  contact_email: string;

  capacity: string;
  waitlist_capacity: string;
  price_cents: string;
  organizer_whatsapp: string;

  published: boolean;
};

export default function AdminNewEventPage() {
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    dateLocal: "",
    sport: "",

    location_name: "",
    address_text: "",
    city: "",
    state: "",

    contact_email: "",

    capacity: "",
    waitlist_capacity: "0",
    price_cents: "0",
    organizer_whatsapp: "",

    published: false,
  });

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    const run = async () => {
      setErrorMsg(null);
      setCheckingAdmin(true);

      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: adminRow, error: adminErr } = await supabaseBrowser
        .from("app_admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (adminErr) {
        console.error("Erro ao validar admin:", adminErr);
        setErrorMsg("Erro ao validar permissões de administrador.");
        setCheckingAdmin(false);
        return;
      }

      if (!adminRow) {
        router.replace("/");
        return;
      }

      setCheckingAdmin(false);
    };

    run();
  }, [router]);

  const setField = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // datetime-local -> ISO
  const toISOFromLocal = (local: string) => {
    const d = new Date(local);
    return d.toISOString();
  };

  const pageWrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#020617",
    color: "#e5e7eb",
    padding: 16,
  };

  const card: React.CSSProperties = {
    borderRadius: 18,
    padding: 14,
    background: "radial-gradient(circle at top, rgba(15,23,42,0.95), rgba(2,6,23,1) 60%)",
    border: "1px solid rgba(148,163,184,0.35)",
    display: "grid",
    gap: 12,
  };

  const box: React.CSSProperties = {
    borderRadius: 16,
    padding: 12,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2,6,23,0.35)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    borderRadius: 12,
    padding: "10px 10px",
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.65)",
    color: "#e5e7eb",
    fontSize: 13,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#d1d5db",
    fontWeight: 800,
  };

  const sectionTitle: React.CSSProperties = {
    margin: 0,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 900,
    color: "#e5e7eb",
  };

  const requireField = (label: string, value: string) => {
    if (!value || !value.trim()) {
      setErrorMsg(`${label} é obrigatório.`);
      return false;
    }
    return true;
  };

  const isValidEmail = (s: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  };

  const toIntOrNull = (s: string) => {
    const t = (s ?? "").trim();
    if (!t.length) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  };

  const toIntOrZero = (s: string) => {
    const t = (s ?? "").trim();
    if (!t.length) return 0;
    const n = Number(t);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.trunc(n));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // ✅ obrigatórios mínimos
    if (!requireField("Título", form.title)) return;
    if (!form.dateLocal) return setErrorMsg("Data/hora é obrigatória.");
    if (!requireField("Endereço (texto)", form.address_text)) return;
    if (!requireField("Cidade", form.city)) return;
    if (!requireField("Estado", form.state)) return;
    if (!requireField("Email de contato", form.contact_email)) return;

    if (!isValidEmail(form.contact_email)) {
      setErrorMsg("Email de contato inválido.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      // ✅ imagem é opcional (só faz upload se existir)
      let imagePath: string | null = null;

      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        imagePath = `events/${userId}/${Date.now()}_${safeName}`;

        const { error: uploadErr } = await supabaseBrowser.storage.from("event-images").upload(imagePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type || "image/jpeg",
        });

        if (uploadErr) {
          console.error("Erro upload image:", uploadErr);
          setErrorMsg("Erro ao enviar imagem. Verifique as permissões do bucket.");
          return;
        }
      }

      const payload: any = {
        // obrigatórios
        title: form.title.trim(),
        date: toISOFromLocal(form.dateLocal),
        address_text: form.address_text.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        contact_email: form.contact_email.trim(),

        // opcionais
        description: form.description.trim() || null,
        sport: form.sport.trim() || null,
        location_name: form.location_name.trim() || null,

        capacity: toIntOrNull(form.capacity),
        waitlist_capacity: toIntOrZero(form.waitlist_capacity),
        price_cents: toIntOrZero(form.price_cents),
        organizer_whatsapp: form.organizer_whatsapp.trim() || null,

        image_path: imagePath,
        image_url: null,

        created_by: userId,
        published: !!form.published,
        updated_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabaseBrowser.from("app_events").insert(payload);

      if (insertErr) {
        console.error("Erro insert app_events:", insertErr);
        // rollback da imagem se foi enviada
        if (imagePath) {
          await supabaseBrowser.storage.from("event-images").remove([imagePath]);
        }
        setErrorMsg("Erro ao criar evento. Verifique RLS/permissões no app_events.");
        return;
      }

      router.replace("/admin/events");
      router.refresh();
    } catch (err) {
      console.error("Erro inesperado:", err);
      setErrorMsg("Erro inesperado ao criar evento.");
    } finally {
      setSaving(false);
    }
  };

  if (checkingAdmin) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Verificando permissões…</p>
      </main>
    );
  }

  return (
    <main style={pageWrap}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 14 }}>
          <button
            onClick={() => router.push("/admin/events")}
            style={{
              borderRadius: 999,
              padding: "8px 14px",
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(2,6,23,0.6)",
              color: "#e5e7eb",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            ← Voltar
          </button>

          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Novo evento</h1>
          <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
            Obrigatórios: Título, Data/hora, Endereço (texto), Cidade, Estado, Email. (WhatsApp é opcional.)
          </p>
        </header>

        {errorMsg && (
          <div
            style={{
              borderRadius: 14,
              padding: 12,
              marginBottom: 12,
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(127,29,29,0.18)",
              color: "#fecaca",
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} style={card}>
          {/* Básico */}
          <div style={box}>
            <p style={sectionTitle}>Básico</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Título *</label>
                <input value={form.title} onChange={(e) => setField("title", e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Data e hora *</label>
                <input
                  type="datetime-local"
                  value={form.dateLocal}
                  onChange={(e) => setField("dateLocal", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Esporte (opcional)</label>
                  <input value={form.sport} onChange={(e) => setField("sport", e.target.value)} style={inputStyle} placeholder="Soccer, Run..." />
                </div>

                <div>
                  <label style={labelStyle}>Local (nome) (opcional)</label>
                  <input value={form.location_name} onChange={(e) => setField("location_name", e.target.value)} style={inputStyle} placeholder="OCSC - Millenia" />
                </div>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div style={box}>
            <p style={sectionTitle}>Endereço (usado no mapa)</p>

            <div>
              <label style={labelStyle}>Endereço (texto) *</label>
              <input
                value={form.address_text}
                onChange={(e) => setField("address_text", e.target.value)}
                style={inputStyle}
                placeholder="3516 President Barack Obama Pkwy"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label style={labelStyle}>Cidade *</label>
                <input value={form.city} onChange={(e) => setField("city", e.target.value)} style={inputStyle} placeholder="Orlando" />
              </div>
              <div>
                <label style={labelStyle}>Estado *</label>
                <input value={form.state} onChange={(e) => setField("state", e.target.value)} style={inputStyle} placeholder="FL" />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div style={box}>
            <p style={sectionTitle}>Contato</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Email de contato *</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setField("contact_email", e.target.value)}
                  style={inputStyle}
                  placeholder="contato@..."
                />
              </div>

              <div>
                <label style={labelStyle}>WhatsApp (opcional)</label>
                <input
                  value={form.organizer_whatsapp}
                  onChange={(e) => setField("organizer_whatsapp", e.target.value)}
                  style={inputStyle}
                  placeholder="+1 (407) ..."
                />
              </div>
            </div>
          </div>

          {/* Detalhes opcionais */}
          <div style={box}>
            <p style={sectionTitle}>Detalhes (opcional)</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Capacidade</label>
                <input type="number" value={form.capacity} onChange={(e) => setField("capacity", e.target.value)} style={inputStyle} placeholder="ex: 32" />
              </div>

              <div>
                <label style={labelStyle}>Lista de espera</label>
                <input
                  type="number"
                  value={form.waitlist_capacity}
                  onChange={(e) => setField("waitlist_capacity", e.target.value)}
                  style={inputStyle}
                  placeholder="0"
                />
              </div>

              <div>
                <label style={labelStyle}>Preço (cents)</label>
                <input type="number" value={form.price_cents} onChange={(e) => setField("price_cents", e.target.value)} style={inputStyle} placeholder="0" />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>Descrição (opcional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Detalhes do evento…"
              />
            </div>
          </div>

          {/* Imagem (opcional) */}
          <div style={box}>
            <p style={sectionTitle}>Imagem (opcional)</p>

            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} style={{ color: "#e5e7eb", fontSize: 13 }} />
            {imagePreviewUrl && (
              <div style={{ marginTop: 10, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(148,163,184,0.25)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreviewUrl} alt="Preview" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="published"
              type="checkbox"
              checked={form.published}
              onChange={(e) => setField("published", e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="published" style={{ fontSize: 13, fontWeight: 900 }}>
              Publicar agora
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 4,
              borderRadius: 999,
              padding: "12px 18px",
              border: "none",
              fontSize: 13,
              fontWeight: 900,
              background: "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
              color: "#0b1120",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.75 : 1,
            }}
          >
            {saving ? "Criando…" : "Criar evento"}
          </button>
        </form>
      </div>
    </main>
  );
}
