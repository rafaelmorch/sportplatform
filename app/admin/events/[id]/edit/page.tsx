// app/admin/events/[id]/edit/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

/* ================= Types ================= */

type AppEventRow = {
  id: string;

  title: string;
  description: string | null;

  date: string; // timestamptz ISO
  location: string | null;

  image_url: string | null; // legado
  image_path: string | null;

  sport: string | null;

  capacity: number | null;
  waitlist_capacity: number; // NOT NULL
  price_cents: number; // NOT NULL

  organizer_whatsapp: string | null;
  contact_email: string | null;

  published: boolean; // NOT NULL

  location_name: string | null;
  address_text: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;

  series_id: string | null;
  series_index: number | null;

  organizer_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string;
};

/* ================= Utils ================= */

function fieldValue(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length ? t : "";
}

function toIntOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function toIntOrZero(v: string): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function toFloatOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatDateTime(dt: string | null): string {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dt;
  }
}

// ISO (UTC) -> yyyy-MM-ddTHH:mm no horário local
function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}-${mi}`;
}

// yyyy-MM-ddTHH:mm (local) -> ISO UTC
function fromDatetimeLocalToIso(localValue: string) {
  const d = new Date(localValue);
  return d.toISOString();
}

// ✅ usar bucket de imagens (mesmo que você usou em outras telas)
function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabaseBrowser.storage.from("event-images").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function makeFileName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const rand = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${rand}.${safeExt}`;
}

/* ================= Page ================= */

export default function AdminEventEditPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const { id: eventId } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [event, setEvent] = useState<AppEventRow | null>(null);

  const img =
    getPublicImageUrl(event?.image_path ?? null) ||
    (event?.image_url ? event.image_url : null) ||
    null;

  // -------- Admin gate + Load event --------
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setInfo(null);

      // 1) precisa estar logado
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      // 2) checar se é admin na tabela app_admins
      const { data: adminRow, error: adminErr } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (adminErr) {
        console.error("Erro ao validar admin:", adminErr);
        setError("Erro ao validar permissões de administrador.");
        setLoading(false);
        return;
      }

      if (!adminRow) {
        router.replace("/");
        return;
      }

      // 3) carregar evento
      const { data, error: evErr } = await supabase
        .from("app_events")
        .select(
          [
            "id",
            "title",
            "description",
            "date",
            "location",
            "image_url",
            "image_path",
            "sport",
            "capacity",
            "waitlist_capacity",
            "price_cents",
            "organizer_whatsapp",
            "contact_email",
            "published",
            "updated_at",
            "location_name",
            "address_text",
            "lat",
            "lng",
            "street",
            "city",
            "state",
            "organizer_id",
            "created_by",
            "created_at",
            "series_id",
            "series_index",
          ].join(",")
        )
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (evErr) {
        setError(evErr.message || "Failed to load event.");
        setEvent(null);
        setLoading(false);
        return;
      }

      const row = data as AppEventRow;

      // garantir defaults de NOT NULL
      const safe: AppEventRow = {
        ...row,
        waitlist_capacity: row.waitlist_capacity ?? 0,
        price_cents: row.price_cents ?? 0,
        published: !!row.published,
        updated_at: row.updated_at ?? new Date().toISOString(),
        date: row.date ?? new Date().toISOString(),
      };

      setEvent(safe);
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, eventId]);

  async function handleSave() {
    if (!event) return;

    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      // montar payload (SEM currency — sua tabela não tem essa coluna)
      const payload = {
        title: event.title.trim(),
        description: event.description?.trim() || null,

        date: event.date, // ISO

        location: event.location?.trim() || null,

        sport: event.sport?.trim() || null,

        capacity: event.capacity,
        waitlist_capacity: event.waitlist_capacity ?? 0,
        price_cents: event.price_cents ?? 0,

        organizer_whatsapp: event.organizer_whatsapp?.trim() || null,
        contact_email: event.contact_email?.trim() || null,

        published: !!event.published,

        location_name: event.location_name?.trim() || null,
        address_text: event.address_text?.trim() || null,
        street: event.street?.trim() || null,
        city: event.city?.trim() || null,
        state: event.state?.trim() || null,
        lat: event.lat,
        lng: event.lng,

        series_id: event.series_id || null,
        series_index: event.series_index ?? null,

        // manter legado image_url se quiser (opcional)
        image_url: event.image_url?.trim() || null,
        image_path: event.image_path || null,

        updated_at: new Date().toISOString(),
      };

      if (!payload.title) {
        throw new Error("Title é obrigatório.");
      }
      if (!payload.date) {
        throw new Error("Date é obrigatório.");
      }
      if (!Number.isFinite(payload.waitlist_capacity)) payload.waitlist_capacity = 0;
      if (!Number.isFinite(payload.price_cents)) payload.price_cents = 0;

      const { error: upErr } = await supabase
        .from("app_events")
        .update(payload)
        .eq("id", event.id);

      if (upErr) throw new Error(upErr.message);

      setInfo("Evento salvo com sucesso.");
    } catch (e: any) {
      setError(e?.message ?? "Falha ao salvar o evento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage(file: File) {
    if (!event) return;

    setUploading(true);
    setError(null);
    setInfo(null);

    try {
      const path = `events/${event.id}/${makeFileName(file)}`;

      const { error: upErr } = await supabase.storage
        .from("event-images")
        .upload(path, file, { upsert: true });

      if (upErr) throw new Error(upErr.message);

      // salvar image_path no evento
      const { error: dbErr } = await supabase
        .from("app_events")
        .update({
          image_path: path,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      if (dbErr) throw new Error(dbErr.message);

      setEvent({ ...event, image_path: path });
      setInfo("Imagem enviada e salva.");
    } catch (e: any) {
      setError(e?.message ?? "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (!event) return;
    if (!event.image_path) {
      setInfo("Sem imagem para remover.");
      return;
    }

    setUploading(true);
    setError(null);
    setInfo(null);

    try {
      const pathToRemove = event.image_path;

      // remove do bucket
      await supabase.storage.from("event-images").remove([pathToRemove]);

      // limpa no DB
      const { error: dbErr } = await supabase
        .from("app_events")
        .update({
          image_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      if (dbErr) throw new Error(dbErr.message);

      setEvent({ ...event, image_path: null });
      setInfo("Imagem removida.");
    } catch (e: any) {
      setError(e?.message ?? "Falha ao remover imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteEvent() {
    if (!event) return;

    const ok = window.confirm(
      "Tem certeza que deseja apagar este evento? Isso não pode ser desfeito."
    );
    if (!ok) return;

    setDeleteBusy(true);
    setError(null);
    setInfo(null);

    try {
      const imageToRemove = event.image_path ?? null;

      const { error: delErr } = await supabase.from("app_events").delete().eq("id", event.id);
      if (delErr) throw new Error(delErr.message);

      if (imageToRemove) {
        await supabase.storage.from("event-images").remove([imageToRemove]);
      }

      router.push("/admin/events");
    } catch (e: any) {
      setError(e?.message ?? "Falha ao apagar evento.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const pageTitle = loading ? "Carregando..." : "Editar Evento";

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#e5e7eb", padding: 16 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/admin/events"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#93c5fd",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ← Voltar
            </Link>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, margin: "10px 0 0 0" }}>
            {pageTitle}
          </h1>

          <p style={{ fontSize: 13, color: "#94a3b8", margin: "8px 0 0 0" }}>
            Event ID: <span style={{ color: "#e5e7eb" }}>{eventId}</span>
          </p>

          {loading ? (
            <p style={{ margin: "10px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
              Carregando dados…
            </p>
          ) : null}
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

        {!loading && !event ? (
          <section
            style={{
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
              padding: 16,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
              Evento não encontrado.
            </p>
          </section>
        ) : null}

        {!loading && event ? (
          <section
            style={{
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Image */}
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.25)",
                background: "rgba(2,6,23,0.35)",
                padding: 14,
              }}
            >
              <p style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800 }}>
                Imagem do evento
              </p>

              <div
                style={{
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
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={event.title}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>Sem imagem</span>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12,
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(56,189,248,0.45)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e0f2fe",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontWeight: 800,
                  }}
                >
                  {uploading ? "Enviando…" : "Escolher imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadImage(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploading || !event.image_path}
                  style={{
                    fontSize: 12,
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.35)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e5e7eb",
                    cursor: uploading || !event.image_path ? "not-allowed" : "pointer",
                    fontWeight: 800,
                  }}
                >
                  Remover imagem
                </button>
              </div>
            </div>

            {/* Form */}
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.25)",
                background: "rgba(2,6,23,0.35)",
                padding: 14,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Título *</label>
                  <input
                    value={event.title}
                    onChange={(e) => setEvent({ ...event, title: e.target.value })}
                    style={inputStyle}
                    placeholder="Ex: 5K Run + Coffee"
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Descrição</label>
                  <textarea
                    value={event.description ?? ""}
                    onChange={(e) => setEvent({ ...event, description: e.target.value })}
                    style={{ ...inputStyle, minHeight: 90, borderRadius: 14 }}
                    placeholder="Detalhes do evento..."
                  />
                </div>

                <div style={grid2}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Data/Hora *</label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(event.date)}
                      onChange={(e) =>
                        setEvent({ ...event, date: fromDatetimeLocalToIso(e.target.value) })
                      }
                      style={inputStyle}
                    />
                    <p style={helperStyle}>Atual: {formatDateTime(event.date)}</p>
                  </div>

                  <div style={fieldWrap}>
                    <label style={labelStyle}>Esporte</label>
                    <input
                      value={event.sport ?? ""}
                      onChange={(e) => setEvent({ ...event, sport: e.target.value })}
                      style={inputStyle}
                      placeholder="Running, Soccer, Tennis..."
                    />
                  </div>
                </div>

                <div style={grid2}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Location (resumo)</label>
                    <input
                      value={event.location ?? ""}
                      onChange={(e) => setEvent({ ...event, location: e.target.value })}
                      style={inputStyle}
                      placeholder="Ex: OCSC - Millenia"
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={labelStyle}>Location name</label>
                    <input
                      value={event.location_name ?? ""}
                      onChange={(e) => setEvent({ ...event, location_name: e.target.value })}
                      style={inputStyle}
                      placeholder="Ex: Showalter Field"
                    />
                  </div>
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Endereço</label>
                  <input
                    value={event.address_text ?? ""}
                    onChange={(e) => setEvent({ ...event, address_text: e.target.value })}
                    style={inputStyle}
                    placeholder="Ex: 3516 President Barack Obama Pkwy, Orlando, FL 32811"
                  />
                </div>

                <div style={grid3}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Street</label>
                    <input
                      value={event.street ?? ""}
                      onChange={(e) => setEvent({ ...event, street: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>City</label>
                    <input
                      value={event.city ?? ""}
                      onChange={(e) => setEvent({ ...event, city: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>State</label>
                    <input
                      value={event.state ?? ""}
                      onChange={(e) => setEvent({ ...event, state: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={grid3}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Lat</label>
                    <input
                      value={event.lat ?? ""}
                      onChange={(e) => setEvent({ ...event, lat: toFloatOrNull(e.target.value) })}
                      style={inputStyle}
                      placeholder="28.5383"
                    />
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Lng</label>
                    <input
                      value={event.lng ?? ""}
                      onChange={(e) => setEvent({ ...event, lng: toFloatOrNull(e.target.value) })}
                      style={inputStyle}
                      placeholder="-81.3792"
                    />
                  </div>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Published</label>
                    <select
                      value={event.published ? "yes" : "no"}
                      onChange={(e) => setEvent({ ...event, published: e.target.value === "yes" })}
                      style={inputStyle}
                    >
                      <option value="no">Não</option>
                      <option value="yes">Sim</option>
                    </select>
                  </div>
                </div>

                <div style={grid3}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Capacity</label>
                    <input
                      value={event.capacity ?? ""}
                      onChange={(e) => setEvent({ ...event, capacity: toIntOrNull(e.target.value) })}
                      style={inputStyle}
                      placeholder="Ex: 60"
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={labelStyle}>Waitlist capacity *</label>
                    <input
                      value={String(event.waitlist_capacity ?? 0)}
                      onChange={(e) =>
                        setEvent({ ...event, waitlist_capacity: toIntOrZero(e.target.value) })
                      }
                      style={inputStyle}
                      placeholder="Ex: 0"
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={labelStyle}>Price (USD) *</label>
                    <input
                      value={String((event.price_cents ?? 0) / 100)}
                      onChange={(e) => {
                        const dollars = Number(e.target.value);
                        const cents =
                          Number.isFinite(dollars) ? Math.max(0, Math.round(dollars * 100)) : 0;
                        setEvent({ ...event, price_cents: cents });
                      }}
                      style={inputStyle}
                      placeholder="Ex: 25"
                    />
                    <p style={helperStyle}>Salvo como cents: {event.price_cents}</p>
                  </div>
                </div>

                <div style={grid2}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Organizer WhatsApp</label>
                    <input
                      value={event.organizer_whatsapp ?? ""}
                      onChange={(e) => setEvent({ ...event, organizer_whatsapp: e.target.value })}
                      style={inputStyle}
                      placeholder="+1 407..."
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={labelStyle}>Contact email</label>
                    <input
                      value={event.contact_email ?? ""}
                      onChange={(e) => setEvent({ ...event, contact_email: e.target.value })}
                      style={inputStyle}
                      placeholder="contact@sportsplatform.app"
                    />
                  </div>
                </div>

                <div style={grid2}>
                  <div style={fieldWrap}>
                    <label style={labelStyle}>Series ID</label>
                    <input
                      value={event.series_id ?? ""}
                      onChange={(e) => setEvent({ ...event, series_id: fieldValue(e.target.value) || null })}
                      style={inputStyle}
                      placeholder="uuid"
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label style={labelStyle}>Series index</label>
                    <input
                      value={event.series_index ?? ""}
                      onChange={(e) => setEvent({ ...event, series_index: toIntOrNull(e.target.value) })}
                      style={inputStyle}
                      placeholder="0,1,2..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    ...primaryBtn,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.75 : 1,
                  }}
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>

                <Link
                  href="/admin/events"
                  style={{
                    ...secondaryBtn,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  Voltar
                </Link>
              </div>

              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={deleteBusy}
                style={{
                  ...dangerBtn,
                  cursor: deleteBusy ? "not-allowed" : "pointer",
                  opacity: deleteBusy ? 0.75 : 1,
                }}
              >
                {deleteBusy ? "Apagando…" : "Apagar evento"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

/* ================= Styles ================= */

const fieldWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#93c5fd",
  fontWeight: 800,
};

const helperStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#9ca3af",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  padding: "10px 12px",
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(2,6,23,0.65)",
  color: "#e5e7eb",
  fontSize: 13,
  outline: "none",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

const primaryBtn: React.CSSProperties = {
  borderRadius: 999,
  padding: "10px 18px",
  border: "none",
  fontSize: 13,
  fontWeight: 900,
  background: "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
  color: "#0b1120",
};

const secondaryBtn: React.CSSProperties = {
  borderRadius: 999,
  padding: "10px 18px",
  border: "1px solid rgba(148,163,184,0.35)",
  fontSize: 13,
  fontWeight: 900,
  background: "rgba(2,6,23,0.65)",
  color: "#e5e7eb",
};

const dangerBtn: React.CSSProperties = {
  borderRadius: 999,
  padding: "10px 18px",
  border: "1px solid rgba(248,113,113,0.55)",
  fontSize: 13,
  fontWeight: 900,
  background: "rgba(127,29,29,0.35)",
  color: "#fecaca",
};
