"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FitbitAutoImport() {
  useEffect(() => {
    (async () => {
      // evita rodar toda hora (1 vez a cada 12h por exemplo)
      const key = "fitbit_last_import";
      const last = Number(localStorage.getItem(key) || "0");
      const twelveHours = 12 * 60 * 60 * 1000;
      if (Date.now() - last < twelveHours) return;

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const r = await fetch("/api/fitbit/import?days=30", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // se der erro, não quebra a tela
      if (r.ok) localStorage.setItem(key, String(Date.now()));
    })();
  }, []);

  return null;
}
