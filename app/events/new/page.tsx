"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

function toCents(input: string): number {
  const raw = input.trim();
  if (!raw) return 0;
  // aceita "10", "10.5", "10.50"
  const normalized = raw.replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

function normalizeWhatsApp(input: string): string {
  // validação leve: mantém + e dígitos
  const trimmed = input.trim();
  if (!trimmed) return "";
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/[^\d]/g, "");
  return plus + digits;
}

function isValidWhatsApp(input: string): boolean {
  const norm = normalizeWhatsApp(input);
  const digits = norm.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export default function NewEventPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [date, setDate] = useState(""); // datetime-local
  const [description, setDescription] = useState("");

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [capacity, setCapacity] = useState("20");
  const [waitlistCapacity, setWaitlistCapacity] = useState("0");
  const [price, setPrice] = useState("0");

  const [organizerWhatsapp, setOrganizerWhatsapp] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPickImage(file: File | null) {
    setImageFile(file);
    setError(null);
    if (!file) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  async function uploadEventImage(userId: string): Promise<string | null> {
    if (!imageFile) return null;

    const bucket = "event-images";
    const safeName = imageFile.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, imageFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: imageFile.type || "image/jpeg",
    });

    if (error) throw new Error(error.message);

    // salvar apenas o path dentro do bucket (mais simples)
    return path;
  }

  async function submit(publishNow: boolean) {
    setBusy(true);
    setError(null);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw new Error(userErr.message);
      const user = userRes.user;
      if (!user) throw new Error("You must be logged in to create an event.");

      // validações
      const t = title.trim();
      if (!t) throw new Error("Title is required.");

      const sp = sport.trim();
      if (!sp) throw new Error("Sport is required.");

      if (!date) throw new Error("Date/Time is required.");

      const st = street.trim();
      const ct = city.trim();
      const stUS = stateUS.trim().toUpperCase();

      if (!st || !ct || !stUS) {
        throw new Error("Address is required (Street, City, State).");
      }

      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        throw new Error("Lat/Lng is required (numbers).");
      }

      const cap = Number(capacity);
      if (!Number.isFinite(cap) || cap < 1) throw new Error("Capacity must be at least 1.");

      const wcap = Number(waitlistCapacity);
      if (!Number.isFinite(wcap) || wcap < 0) throw new Error("Waitlist capacity must be 0 or more.");

      if (!organizerWhatsapp.trim()) throw new Error("Organizer WhatsApp is required.");
      if (!isValidWhatsApp(organizerWhatsapp)) {
        throw new Error("Organizer WhatsApp looks invalid. Use digits (and optional +).");
      }

      const priceCents = toCents(price);

      const addressText = `${st}, ${ct}, ${stUS}`;

      // upload imagem primeiro (se tiver)
      const imagePath = await uploadEventImage(user.id);

      const payload: any = {
        title: t,
        sport: sp,
        date: new Date(date).toISOString(),
        description: description.trim(),
        created_by: user.id,

        // legado / compat
        location: addressText,
        location_name: addressText,
        address_text: addressText,

        street: st,
        city: ct,
        state: stUS,

        lat: latNum,
        lng: lngNum,

        capacity: cap,
        waitlist_capacity: wcap,
        price_cents: priceCents,

        organizer_whatsapp: normalizeWhatsApp(organizerWhatsapp),
        published: publishNow,

        image_path: imagePath, // path dentro do bucket
      };

      const { data: inserted, error: insErr } = await supabase
        .from("events")
        .insert(payload)
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);

      router.push(`/events/${inserted.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 16, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Create Event</h1>
        <Link href="/events" style={{ textDecoration: "none", opacity: 0.9 }}>
          ← Back
        </Link>
      </div>

      {error ? <p style={{ opacity: 0.9 }}>Error: {error}</p> : null}

      <div
        style={{
          border: "1px solid rgba(31,41,55,0.9)",
          borderRadius: 16,
          padding: 12,
          background: "linear-gradient(to bottom, rgba(15,23,42,0.92), rgba(15,23,42,0.88))",
          maxWidth: 820,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <label style={{ fontSize: 12, opacity: 0.9 }}>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
              placeholder="OCSC 5K Group Run"
            />
          </label>

          <label style={{ fontSize: 12, opacity: 0.9 }}>
            Sport
            <input
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
              placeholder="Running / Cycling / Triathlon..."
            />
          </label>

          <label style={{ fontSize: 12, opacity: 0.9 }}>
            Date & time
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
            />
          </label>

          <label style={{ fontSize: 12, opacity: 0.9 }}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10, minHeight: 100 }}
              placeholder="What is this event about?"
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.9 }}>
              Capacity
              <input
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                inputMode="numeric"
              />
            </label>

            <label style={{ fontSize: 12, opacity: 0.9 }}>
              Waitlist capacity
              <input
                value={waitlistCapacity}
                onChange={(e) => setWaitlistCapacity(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                inputMode="numeric"
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.9 }}>
              Price (USD) — use 0 for free
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                placeholder="0"
                inputMode="decimal"
              />
            </label>

            <label style={{ fontSize: 12, opacity: 0.9 }}>
              Organizer WhatsApp (visible only after confirmation)
              <input
                value={organizerWhatsapp}
                onChange={(e) => setOrganizerWhatsapp(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                placeholder="+1 407 000 0000"
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.9 }}>
              Street (US format)
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                placeholder="3516 President Barack Obama Pkwy"
              />
            </label>

            <label style={{ fontSize: 12, opacity: 0.9 }}>
              City
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                placeholder="Orlando"
              />
            </label>

            <label style={{ fontSize: 12, opacity: 0.9 }}>
              State
              <input
                value={stateUS}
                onChange={(e) => setStateUS(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                placeholder="FL"
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.9 }}>
              Latitude
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                placeholder="28.5..."
              />
            </label>

            <label style={{ fontSize: 12, opacity: 0.9 }}>
              Longitude
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
                placeholder="-81.3..."
              />
            </label>
          </div>

          <label style={{ fontSize: 12, opacity: 0.9 }}>
            Event image (optional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>

          {imagePreview ? (
            <div
              style={{
                width: "100%",
                height: 180,
                borderRadius: 12,
                border: "1px solid rgba(31,41,55,0.9)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <img
                src={imagePreview}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => submit(false)}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Saving..." : "Save as Draft"}
            </button>

            <button
              onClick={() => submit(true)}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {busy ? "Publishing..." : "Publish"}
            </button>
          </div>

          <p style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Note: Map selection (click-to-pick) can come later. For now, fill lat/lng.
          </p>
        </div>
      </div>
    </main>
  );
}
