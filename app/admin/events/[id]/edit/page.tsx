"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

/* ================= Types ================= */

type AppEventRow = {
  id: string;
  title: string;
  description: string | null;

  date: string; // timestamptz (ISO)
  location: string | null;

  image_url: string | null; // legado
  image_path: string | null;

  sport: string | null;
  capacity: number | null;
  waitlist_capacity: number; // NOT NULL
  price_cents: number; // NOT NULL
  organizer_whatsapp: string | null;
  contact_email: string | null;

  // ✅ NOVO
  registration_url: string | null;

  published: boolean; // NOT NULL
  organizer_id: string | null;

  location_name: string | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;

  street: string | null;
  city: string | null;
  state: string | null;

  series_id: string | null;
  series_index: number | null;

  created_by: string | null;
  created_at: string | null;
  updated_at: string; // NOT NULL
};

/* ================= Utils ================= */

function safeTrim(v: string | null | undefined) {
  return (v ?? "").trim();
}

function toIntOrNull(v: string): number | null {
  const t = safeTrim(v);
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function toNumberOrNull(v: string): number | null {
  const t = safeTrim(v);
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

/** UI: editar em dólares (ex.: 25.00) mas salvar em cents (2500) */
function dollarsToCents(v: string): number {
  const t = safeTrim(v).replace(",", ".");
  if (!t) return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
function centsToDollarsString(cents: number | null | undefined): string {
  const c = Number(cents ?? 0);
  if (!Number.isFinite(c)) return "0.00";
  return (c / 100).toFixed(2);
}

function isValidUrlMaybe(s: string) {
  const t = safeTrim(s);
  if (!t) return true; // opcional
  try {
    // aceita http/https
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/* ================= Page ================= */

export default function AdminEventEditPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params?.id;

  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [eventRow, setEventRow] = useState<AppEventRow | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // datetime-local string: "YYYY-MM-DDTHH:mm"
  const [dateLocal, setDateLocal] = useState("");

  const [published, setPublished] = useState(false);
  const [sport, setSport] = useState("");

  const [locationName, setLocationName] = useState("");
  const [addressText, setAddressText] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [capacity, setCapacity] = useState("");
  const [waitlistCapacity, setWaitlistCapacity] = useState("0");
  const [priceDollars, setPriceDollars] = useState("0.00");
  const [organizerWhatsapp, setOrganizerWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // ✅ NOVO
  const [registrationUrl, setRegistrationUrl] = useState("");

  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageUrlLegacy, setImageUrlLegacy] = useState<string | null>(null);

  function fillFormFromRow(row: AppEventRow) {
    setTitle(row.title ?? "");
    setDescription(row.description ?? "");

    // converter ISO -> datetime-local
    try {
      const d = new Date(row.date);
      const pad = (n: number) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      setDateLocal(`${yyyy}-${mm}-${dd}T${hh}:${mi}`);
    } catch {
      setDateLocal("");
    }

    setPublished(!!row.published);
    setSport(row.sport ?? "");

    setLocationName(row.location_name ?? "");
    setAddressText(row.address_text ?? "");
    setStreet(row.street ?? "");
    setCity(row.city ?? "");
    setStateUS(row.state ?? "");
    setLat(row.lat != null ? String(row.lat) : "");
    setLng(row.lng != null ? String(row.lng) : "");

    setCapacity(row.capacity != null ? String(row.capacity) : "");
    setWaitlistCapacity(String(row.waitlist_capacity ?? 0));
    setPriceDollars(centsToDollarsString(row.price_cents ?? 0));

    setOrganizerWhatsapp(row.organizer_whatsapp ?? "");
    setContactEmail(row.contact_email ?? "");

    // ✅ NOVO
    setRegistrationUrl(row.registration_url ?? "");

    setImagePath(row.image_path ?? null);
    setImageUrlLegacy(row.image_url ?? null);
  }

  // checar admin + carregar evento
  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    async function run() {
      setErrorMsg(null);
      setInfoMsg(null);
      setLoading(true);
      setCheckingAdmin(true);

      // 1) sessão
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      // 2) checar admin
      const { data: adminRow, error: adminErr } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (adminErr) {
        setErrorMsg("Erro ao validar permissões de administrador.");
        setCheckingAdmin(false);
        setLoading(false);
        return;
      }

      if (!adminRow) {
        router.replace("/");
        return;
      }

      setCheckingAdmin(false);

      // 3) carregar evento
      const { data, error } = await supabase
        .from("app_events")
        .select(
          [
            "id",
            "title",
            "description",
            "date",
            "location",
            "image_url",
            "created_by",
            "created_at",
            "sport",
            "capacity",
            "waitlist_capacity",
            "price_cents",
            "organizer_whatsapp",
            "published",
            "updated_at",
            "location_name",
            "address_text",
            "lat",
            "lng",
            "street",
            "city",
            "state",
            "image_path",
            "organizer_id",
            "series_id",
            "series_index",
            "contact_email",
            "registration_url", // ✅ NOVO
          ].join(",")
        )
        .eq("id", eventId)
        .single();

      if (cancelled) return;

      if (error) {
        setEventRow(null);
        setErrorMsg(error.message || "Falha ao carregar o evento.");
        setLoading(false);
        return;
      }

      const row = data as unknown as AppEventRow;

      const safe: AppEventRow = {
        ...row,
        waitlist_capacity: Number.isFinite(row.waitlist_capacity) ? row.waitlist_capacity : 0,
        price_cents: Number.isFinite(row.price_cents) ? row.price_cents : 0,
        published: !!row.published,
        updated_at: row.updated_at ?? new Date().toISOString(),
        date: row.date ?? new Date().toISOString(),
        title: row.title ?? "",
        id: row.id ?? eventId,
        description: row.description ?? null,
        location: row.location ?? null,
        image_url: row.image_url ?? null,
        image_path: row.image_path ?? null,
        created_by: row.created_by ?? null,
        created_at: row.created_at ?? null,
        sport: row.sport ?? null,
        capacity: row.capacity ?? null,
        organizer_whatsapp: row.organizer_whatsapp ?? null,
        location_name: row.location_name ?? null,
        address_text: row.address_text ?? null,
        lat: row.lat ?? null,
        lng: row.lng ?? null,
        street: row.street ?? null,
        city: row.city ?? null,
        state: row.state ?? null,
        organizer_id: row.organizer_id ?? null,
        series_id: row.series_id ?? null,
        series_index: row.series_index ?? null,
        contact_email: row.contact_email ?? null,
        registration_url: row.registration_url ?? null, // ✅ NOVO
      };

      setEventRow(safe);
      fillFormFromRow(safe);
      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [supabase, router, eventId]);

  async function handleSave() {
    if (!eventId) return;

    setSaving(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const titleT = safeTrim(title);
      if (!titleT) throw new Error("Título é obrigatório.");

      if (!dateLocal) throw new Error("Data/Hora é obrigatória.");

      if (!isValidUrlMaybe(registrationUrl)) {
        throw new Error("Registration URL inválida. Use http:// ou https://");
      }

      // datetime-local -> ISO
      const dateISO = new Date(dateLocal).toISOString();

      const payload: Partial<AppEventRow> = {
        title: titleT,
        description: safeTrim(description) ? description : null,

        date: dateISO,
        published: !!published,

        sport: safeTrim(sport) ? sport : null,

        location_name: safeTrim(locationName) ? locationName : null,
        address_text: safeTrim(addressText) ? addressText : null,
        street: safeTrim(street) ? street : null,
        city: safeTrim(city) ? city : null,
        state: safeTrim(stateUS) ? stateUS : null,
        lat: toNumberOrNull(lat),
        lng: toNumberOrNull(lng),

        capacity: toIntOrNull(capacity),
        waitlist_capacity: Math.max(0, toIntOrNull(waitlistCapacity) ?? 0),

        price_cents: Math.max(0, dollarsToCents(priceDollars)),
        organizer_whatsapp: safeTrim(organizerWhatsapp) ? organizerWhatsapp : null,
        contact_email: safeTrim(contactEmail) ? contactEmail : null,

        // ✅ NOVO
        registration_url: safeTrim(registrationUrl) ? registrationUrl.trim() : null,

        image_path: imagePath ?? null,
        image_url: imageUrlLegacy ?? null,

        updated_at: new Date().toISOString(),
      };

      const { data: updatedRows, error: upErr } = await supabase
        .from("app_events")
        .update(payload)
        .eq("id", eventId)
        .select("id");

      if (upErr) throw new Error(upErr.message);

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("Update não aplicado (0 linhas). Provável RLS/policy bloqueando.");
      }

      setInfoMsg("Salvo com sucesso.");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const headerTitle = loading ? "Carregando..." : `Editar evento`;

  const inputBase: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    borderRadius: 12,
    padding: "10px 12px",
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(2,6,23,0.65)",
    color: "#e5e7eb",
    outline: "none",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: 16,
        paddingBottom: 90,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/admin/events"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(2,6,23,0.65)",
                color: "#e5e7eb",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                fontSize: 18,
                fontWeight: 900,
              }}
              aria-label="Voltar"
              title="Voltar"
            >
              ←
            </Link>

            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
                Admin • Events
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: "6px 0 0 0" }}>{headerTitle}</h1>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0 0" }}>
                ID: <span style={{ color: "#e5e7eb" }}>{eventId ?? "—"}</span>
              </p>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Link href="/admin" style={{ fontSize: 12, color: "#93c5fd", textDecoration: "underline" }}>
                Admin home
              </Link>
            </div>
          </div>
        </header>

        {checkingAdmin ? (
          <div style={{ borderRadius: 18, border: "1px solid rgba(148,163,184,0.35)", background: "rgba(2,6,23,0.5)", padding: 14 }}>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Verificando permissões…</p>
          </div>
        ) : null}

        {errorMsg ? (
          <div style={{ borderRadius: 18, border: "1px solid rgba(248,113,113,0.45)", background: "rgba(127,29,29,0.22)", padding: 12, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#fecaca", whiteSpace: "pre-wrap" }}>{errorMsg}</p>
          </div>
        ) : null}

        {infoMsg ? (
          <div style={{ borderRadius: 18, border: "1px solid rgba(34,197,94,0.35)", background: "rgba(3,52,22,0.25)", padding: 12, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#86efac", whiteSpace: "pre-wrap" }}>{infoMsg}</p>
          </div>
        ) : null}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Top actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                borderRadius: 999,
                padding: "10px 16px",
                border: "none",
                fontSize: 13,
                fontWeight: 900,
                background: saving ? "rgba(56,189,248,0.35)" : "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
                color: "#0b1120",
                cursor: saving || loading ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#e5e7eb" }}>
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ transform: "scale(1.1)" }} />
              Published
            </label>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link
                href="/admin/events"
                style={{
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(2,6,23,0.6)",
                  color: "#e5e7eb",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                Voltar
              </Link>
            </div>
          </div>

          {/* Basic */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Title *</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: 5K Training + Coffee" style={inputBase} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Description</p>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do evento…" rows={4} style={{ ...inputBase, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Date/Time *</p>
                <input type="datetime-local" value={dateLocal} onChange={(e) => setDateLocal(e.target.value)} style={inputBase} />
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Sport</p>
                <input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Running, Soccer, Tennis…" style={inputBase} />
              </div>
            </div>

            {/* ✅ NOVO: Registration URL */}
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Registration URL (opcional)</p>
              <input
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
                placeholder="https://..."
                style={inputBase}
              />
              <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#9ca3af" }}>
                Se vazio, o evento pode usar o link padrão do site/app.
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 900, margin: "6px 0 8px 0" }}>Location</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Location name</p>
                <input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="OCSC - Millenia" style={inputBase} />
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Address text</p>
                <input value={addressText} onChange={(e) => setAddressText(e.target.value)} placeholder="3516 President Barack Obama Pkwy, Orlando, FL 32811" style={inputBase} />
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Street</p>
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="3516 President Barack Obama Pkwy" style={inputBase} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 0.7fr", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>City</p>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Orlando" style={inputBase} />
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>State</p>
                  <input value={stateUS} onChange={(e) => setStateUS(e.target.value)} placeholder="FL" style={inputBase} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Lat</p>
                  <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="28.50..." style={inputBase} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Lng</p>
                  <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-81.3..." style={inputBase} />
                </div>
              </div>
            </div>
          </div>

          {/* Capacity & price */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 900, margin: "6px 0 8px 0" }}>Capacity & Price</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Capacity</p>
                <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Ex: 50" style={inputBase} />
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Waitlist capacity</p>
                <input value={waitlistCapacity} onChange={(e) => setWaitlistCapacity(e.target.value)} placeholder="0" style={inputBase} />
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Price (USD)</p>
                <input value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} placeholder="0.00" style={inputBase} />
                <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#9ca3af" }}>
                  Salva em <b>price_cents</b> (ex.: {dollarsToCents(priceDollars)}).
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 900, margin: "6px 0 8px 0" }}>Contact</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Organizer WhatsApp</p>
                <input value={organizerWhatsapp} onChange={(e) => setOrganizerWhatsapp(e.target.value)} placeholder="+1 407..." style={inputBase} />
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Contact email</p>
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@sportsplatform.app" style={inputBase} />
              </div>
            </div>
          </div>

          {/* Debug / legacy */}
          <div style={{ borderRadius: 14, border: "1px solid rgba(148,163,184,0.25)", background: "rgba(2,6,23,0.35)", padding: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
              <b>Debug</b> • image_path: <span style={{ color: "#e5e7eb" }}>{imagePath ?? "—"}</span> • image_url (legado):{" "}
              <span style={{ color: "#e5e7eb" }}>{imageUrlLegacy ?? "—"}</span>
            </p>
            <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#9ca3af" }}>
              (Upload/editar imagem a gente faz no próximo passo — aqui é só pra não perder a referência.)
            </p>
          </div>
        </section>

        <div style={{ height: 20 }} />
      </div>
    </main>
  );
}
