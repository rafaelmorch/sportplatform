"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MobileStripeSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const destination =
      searchParams.get("destination") || "/performance-ai/health";

    const params = new URLSearchParams(searchParams.toString());
    params.delete("destination");

    const query = params.toString();
    const finalUrl = query
      ? `${destination}?${query}`
      : destination;

    const timer = window.setTimeout(() => {
      router.replace(finalUrl);
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
          Pagamento concluído
        </h1>
        <p style={{ margin: 0 }}>
          Voltando para o aplicativo...
        </p>
      </div>
    </main>
  );
}
