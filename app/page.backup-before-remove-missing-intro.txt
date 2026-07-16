"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const capacitor = (window as any).Capacitor;

    const isApp =
      typeof capacitor?.isNativePlatform === "function"
        ? capacitor.isNativePlatform()
        : Boolean(capacitor);

    let destination = "/activities";

    if (isApp) {
      const lastSeen = localStorage.getItem("intro_last_seen");
      const lastSeenTimestamp = lastSeen ? Number(lastSeen) : 0;

      const oneDay = 24 * 60 * 60 * 1000;
      const introExpired =
        !lastSeenTimestamp || Date.now() - lastSeenTimestamp > oneDay;

      destination = introExpired ? "/intro" : "/activities";
    }

    window.location.replace(destination);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily: "Montserrat, Arial, sans-serif",
        color: "#64748b",
        fontSize: 14,
      }}
    >
      Loading...
    </main>
  );
}
