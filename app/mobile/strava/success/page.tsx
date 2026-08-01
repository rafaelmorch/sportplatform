"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MobileStravaSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const timer = window.setTimeout(() => {
      router.replace(`/integrations?${params.toString()}`);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        background: "#ffffff",
        color: "#111111",
      }}
    >
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>
          Strava conectado
        </h1>

        <p style={{ margin: 0 }}>
          Voltando para o aplicativo...
        </p>
      </div>
    </main>
  );
}
