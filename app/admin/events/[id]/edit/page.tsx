// app/admin/events/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type AppEventRow = {
  id: string;

  title: string;
  description: string | null;

  date: string; // timestamp
  location: string | null;

  image_url: string | null;
  image_path: string | null;

  created_by: string | null;
  organizer_id: string | null;

  sport: string | null;

  capacity: number | null;
  waitlist_capacity: number; // NOT NULL
  price_cents: number; // NOT NULL

  organizer_whatsapp: string | null;

  published: boolean;

  created_at: string | null;
  updated_at: string;

  location_name: string | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;

  street: string | null;
  city: string | null;
  state: string | null;

  series_id: string | null;
  series_index: number | null;

  contact_email: string | null;
};

function isAppEventRow(x: unknown): x is AppEventRow {
  if (!x || typeof x !== "object") return false;
  const o = x as any;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.date === "string" &&
    typeof o.waitlist_capacity !== "undefined" &&
    typeof o.price_cents !== "undefined" &&
    typeof o.published !== "undefined"
  );
}

function toIsoLocalInput(iso: string): string {
  // transforma ISO em "YYYY-MM-DDTHH:MM" (para input datetime-local)
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromIsoLocalInput(v: string): string {
  // input datetime-local -> ISO (com timezone local convertido)
  const d = new Date(v);
  return d.toISOString();
}

export default function AdminEventEditPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("");
  const [dateLocal, setDateLocal] = useState(""); // datetime-local
  const [locationName, setLocationName] = useState("");
  const [addressText, setAddressText] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");
  const [waitlistCapacity, setWaitlistCapacity] = useState<string>("0");

  const [priceDollars, setPriceDollars] = useState<string>("0"); // UI em dólares
  const [organizerWhatsapp, setOrganizerWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [published, setPublished] = useState(false);

  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  function getPublicImageUrl(path: string | null): string | null {
    if (!path) return null;
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  async function requireAdminOrRedirect(): Promise<{ userId: string } | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return null;
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao validar admin:", error);
      setErrorMsg("Erro ao validar permissões de administrador.");
      return null;
    }

    if (!data) {
      router.replace("/");
      return null;
    }

    setIsAdmin(true);
    return { userId };
  }

  async function loadEvent() {
    if (!eventId) return;

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const okAdmin = await requireAdminOrRedirect();
    if (!okAdmin) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("app_events")
      .select(
        "id,title,description,date,location,image_url,image_path,created_by,created_at,sport,capacity,waitlist_capacity,price_cents,organizer_whatsapp,published,updated_at,location_name,address_text,lat,lng,street,city,state,organizer_id,series_id,series_index,contact_email"
      )
      .eq("id", eventId)
      .maybeSingle();

    if (error) {
      console.error("Erro load event:", error);
      setErrorMsg(error.message || "Erro ao carregar evento.");
      setLoading(false);
      return;
    }

    // ✅ AQUI está a correção do deploy:
    if (!isAppEventRow(data)) {
      console.error("Evento retornou formato inesperado:", data);
      setErrorMsg("Evento não encontrado ou retorno inválido do banco.");
      setLoading(false);
      return;
    }

    const row = data;

    setTitle(row.title ?? "");
    setDescription(row.description ?? "");
    setSport(row.sport ?? "");
    setDateLocal(row.date ? toIsoLocalInput(row.date) : "");
    setLocationName(row.location_name ?? "");
    setAddressText(row.address_text ?? "");
    setStreet(row.street ?? "");
    setCity(row.city ?? "");
    setStateUS(row.state ?? "");
    setLocation(row.location ?? "");
    setLat(row.lat != null ? String(row.lat) : "");
    setLng(row.lng != null ? String(row.lng) : "");
    setCapacity(row.capacity != null ? String(row.capacity) : "");
    setWaitlistCapacity(String(row.waitlist_capacity ?? 0));

    // UI em dólares (sem cents na tela)
    const dollars = (row.price_cents ?? 0) / 100;
    setPriceDollars(String(dollars));

    setOrganizerWhatsapp(row.organizer_whatsapp ?? "");
    setContactEmail(row.contact_email ?? "");
    setPublished(!!row.published);

    setExistingImagePath(row.image_path ?? null);
    setExistingImageUrl(row.image_url ?? null);

    setLoading(false);
  }

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function uploadNewImageIfAny(userId: string): Promise<{ image_path: string | null; image_url: string | null }> {
    if (!newImageFile) {
      // mantém o que já existe
      const publicUrl = getPublicImageUrl(existingImagePath) || existingImageUrl || null;
      return { image_path: existingImagePath, image_url: publicUrl };
    }

    const safeName = newImageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `events/${userId}/${Date.now()}_${safeName}`;

    const up = await supabase.storage.from("event-images").upload(path, newImageFile, {
      cacheControl: "3600",
      upsert: false,
    });

    if (up.error) throw new Error(up.error.message);

    const publicUrl = getPublicImageUrl(path);
    return { image_path: path, image_url: publicUrl };
  }

  async function handleSave() {
    if (!eventId) return;
    if (!isAdmin) return;

    setSaving(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const okAdmin = await requireAdminOrRedirect();
      if (!okAdmin) throw new Error("Sem permissão.");
      const userId = okAdmin.userId;

      if (!title.trim()) throw new Error("Título é obrigatório.");
      if (!dateLocal.trim()) throw new Error("Data/hora é obrigatório.");

      const priceNum = Number(priceDollars);
      if (!Number.isFinite(priceNum) || priceNum < 0) throw new Error("Preço inválido.");
      const priceCents = Math.round(priceNum * 100);

      const waitNum = Number(waitlistCapacity);
      if (!Number.isFinite(waitNum) || waitNum < 0) throw new Error("Waitlist inválida.");

      const capNum = capacity.trim() ? Number(capacity) : null;
      if (capacity.trim() && (!Number.isFinite(capNum as number) || (capNum as number) < 0)) {
        throw new Error("Capacidade inválida.");
      }

      const latNum = lat.trim() ? Number(lat) : null;
      const lngNum = lng.trim() ? Number(lng) : null;
      if (lat.trim() && !Number.isFinite(latNum as number)) throw new Error("Lat inválida.");
      if (lng.trim() && !Number.isFinite(lngNum as number)) throw new Error("Lng inválida.");

      const img = await uploadNewImageIfAny(userId);

      const payload: Partial<AppEventRow> = {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        sport: sport.trim() ? sport.trim() : null,

        date: fromIsoLocalInput(dateLocal),
        location: location.trim() ? location.trim() : null,

        location_name: locationName.trim() ? locationName.trim() : null,
        address_text: addressText.trim() ? addressText.trim() : null,
        street: street.trim() ? street.trim() : null,
        city: city.trim() ? city.trim() : null,
        state: stateUS.trim() ? stateUS.trim() : null,
        lat: latNum as any,
        lng: lngNum as any,

        capacity: capNum as any,
        waitlist_capacity: waitNum,
        price_cents: priceCents,

        organizer_whatsapp: organizerWhatsapp.trim() ? organizerWhatsapp.trim() : null,
        contact_email: contactEmail.trim() ? contactEmail.trim() : null,

        published: !!published,

        image_path: img.image_path,
        image_url: img.image_url,

        updated_at: new Date().toISOString(),
      };

      const { error: upErr } = await supabase.from("app_events").update(payload).eq("id", eventId);
      if (upErr) throw new Error(upErr.message);

      // se trocou imagem, remove a antiga
      if (newImageFile && existingImagePath && existingImagePath !== img.image_path) {
        await supabase.storage.from("event-images").remove([existingImagePath]);
      }

      setExistingImagePath(img.image_path);
      setExistingImageUrl(img.image_url);
      setNewImageFile(null);

      setInfoMsg("Evento atualizado com sucesso.");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Carregando…</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Editar Evento</h1>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0 0" }}>{eventId}</p>
          </div>

          <button
            onClick={() => router.push("/admin/events")}
            style={{
              borderRadius: 999,
              padding: "10px 16px",
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(2,6,23,0.65)",
              color: "#e5e7eb",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            ← Voltar
          </button>
        </header>

        {errorMsg ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#fca5a5" }}>{errorMsg}</p> : null}
        {infoMsg ? <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#86efac" }}>{infoMsg}</p> : null}

        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "radial-gradient(circle at top, #0f172a, #020617 60%)",
            padding: 14,
          }}
        >
          {/* imagem */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Imagem</p>
            <div
              style={{
                marginTop: 8,
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
              {getPublicImageUrl(existingImagePath) || existingImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getPublicImageUrl(existingImagePath) || existingImageUrl || ""}
                  alt="event image"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Sem imagem</span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)}
              style={{ marginTop: 10, fontSize: 12 }}
            />
          </div>

          {/* campos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Title *</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Sport</p>
              <input value={sport} onChange={(e) => setSport(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Date/Time *</p>
              <input type="datetime-local" value={dateLocal} onChange={(e) => setDateLocal(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Published</p>
              <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{published ? "Publicado" : "Rascunho"}</span>
              </label>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Description</p>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, height: 90, resize: "vertical" }} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Price (USD)</p>
              <input value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} style={inputStyle} placeholder="ex: 25" />
              <p style={{ margin: "6px 0 0 0", fontSize: 11, color: "#64748b" }}>Salvo em cents no banco (price_cents).</p>
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Capacity</p>
              <input value={capacity} onChange={(e) => setCapacity(e.target.value)} style={inputStyle} placeholder="ex: 60" />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Waitlist capacity</p>
              <input value={waitlistCapacity} onChange={(e) => setWaitlistCapacity(e.target.value)} style={inputStyle} placeholder="ex: 0" />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Organizer WhatsApp</p>
              <input value={organizerWhatsapp} onChange={(e) => setOrganizerWhatsapp(e.target.value)} style={inputStyle} placeholder="+1..." />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Contact email</p>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={inputStyle} placeholder="email@..." />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Location name</p>
              <input value={locationName} onChange={(e) => setLocationName(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Address text</p>
              <input value={addressText} onChange={(e) => setAddressText(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Street</p>
              <input value={street} onChange={(e) => setStreet(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>City</p>
              <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>State</p>
              <input value={stateUS} onChange={(e) => setStateUS(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Location (free text)</p>
              <input value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Lat</p>
              <input value={lat} onChange={(e) => setLat(e.target.value)} style={inputStyle} placeholder="28.5383" />
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#60a5fa" }}>Lng</p>
              <input value={lng} onChange={(e) => setLng(e.target.value)} style={inputStyle} placeholder="-81.3792" />
            </div>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                borderRadius: 999,
                padding: "10px 18px",
                border: "none",
                fontSize: 13,
                fontWeight: 900,
                background: "linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)",
                color: "#0b1120",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.25)",
  background: "rgba(2,6,23,0.45)",
  color: "#e5e7eb",
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
};
