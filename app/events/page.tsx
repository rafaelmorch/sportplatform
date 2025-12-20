"use client";

import Link from "next/link";
import Image from "next/image";
import BottomNavbar from "@/components/BottomNavbar";

export const dynamic = "force-dynamic";

type EventItem = {
  title: string;
  city: string;
  state: string;
  dateLabel: string;
  slug: string;
};

const EVENTS: EventItem[] = [
  {
    title: "Futebol Society",
    city: "Windermere",
    state: "FL",
    dateLabel: "Dec 23, 2025 — 9:00 AM",
    slug: "futebol-society-2025-12-23",
  },
  {
    title: "Futebol Society",
    city: "Windermere",
    state: "FL",
    dateLabel: "Dec 30, 2025 — 9:00 AM",
    slug: "futebol-society-2025-12-30",
  },
  {
    title: "Futebol Society",
    city: "Windermere",
    state: "FL",
    dateLabel: "Jan 08, 2026 — 7:00 PM",
    slug: "futebol-society-2026-01-08",
  },
];

export default function EventsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: 16,
        paddingBottom: 80,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.16em", color: "#64748b" }}>
            EVENTOS
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Eventos</h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Escolha uma data para se inscrever (Windermere, FL)
          </p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {EVENTS.map((ev) => (
            <Link
              key={ev.slug}
              href={`/events/${ev.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                borderRadius: 14,
                border: "1px solid rgba(148,163,184,0.18)",
                background:
                  "linear-gradient(180deg, rgba(2,6,23,0.65), rgba(2,6,23,0.35))",
                padding: 12,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 86,
                    height: 56,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid rgba(148,163,184,0.18)",
                  }}
                >
                  <Image
                    src="/events/soccer-field.jpg"
                    alt="Futebol Society"
                    width={172}
                    height={112}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {ev.city}, {ev.state}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    {ev.dateLabel}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(56,189,248,0.45)",
                    color: "#e0f2fe",
                    fontWeight: 800,
                  }}
                >
                  Inscrever
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNavbar />
    </main>
  );
}
