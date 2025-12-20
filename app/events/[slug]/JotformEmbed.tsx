"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";

const EVENTS: Record<string, string> = {
  "futebol-society-2025-12-23": "253529127368161",
  "futebol-society-2025-12-30": "253528622833056",
  "futebol-society-2026-01-08": "253528731884164",
};

export default function JotformEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const slug = useMemo(() => {
    // pathname: /events/futebol-society-2025-12-30
    const parts = (pathname || "").split("/").filter(Boolean);
    return parts[1] || ""; // ["events", "<slug>"]
  }, [pathname]);

  const jotformId = EVENTS[slug];

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = "";

    if (!jotformId) {
      ref.current.innerHTML = `
        <div style="padding:16px;font-family:Arial">
          <h2 style="margin:0 0 8px 0;">Evento não encontrado</h2>
          <div style="color:#374151;font-size:14px;">Slug recebido: <b>${slug || "(vazio)"}</b></div>
        </div>
      `;
      return;
    }

    const script = document.createElement("script");
    script.src = `https://form.jotform.com/jsform/${jotformId}`;
    script.type = "text/javascript";
    script.async = true;

    ref.current.appendChild(script);
  }, [jotformId, slug]);

  return (
    <div
      ref={ref}
      style={{
        marginTop: 16,
        background: "#fff",
        padding: 8,
        borderRadius: 8,
      }}
    />
  );
}
