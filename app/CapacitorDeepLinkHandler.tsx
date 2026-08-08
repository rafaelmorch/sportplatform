"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CapacitorDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    let removeListener: (() => Promise<void>) | undefined;

    async function configureDeepLinks() {
      const { App } = await import("@capacitor/app");

      const openUrl = (url: string) => {
        console.log("APP URL OPEN:", url);
        try {
          const parsedUrl = new URL(url);

          // Custom scheme usado pelo OAuth no app:
          // platformsports://auth/callback?code=...
          if (
            parsedUrl.protocol === "platformsports:" &&
            parsedUrl.host === "auth" &&
            parsedUrl.pathname === "/callback"
          ) {
            const destination =
              "/mobile/auth/callback" +
              parsedUrl.search +
              parsedUrl.hash;

            router.replace(destination);
            return;
          }

          // Universal Links normais:
          // https://www.sportsplatform.app/...
          if (
            parsedUrl.protocol === "https:" &&
            parsedUrl.host === "www.sportsplatform.app"
          ) {
            const destination =
              parsedUrl.pathname +
              parsedUrl.search +
              parsedUrl.hash;

            router.replace(destination);
          }
        } catch (error) {
          console.error("Erro ao abrir deep link:", error);
        }
      };

      const listener = await App.addListener(
        "appUrlOpen",
        ({ url }) => {
          openUrl(url);
        }
      );

      removeListener = () => listener.remove();

      const launchUrl = await App.getLaunchUrl();

      if (launchUrl?.url) {
        openUrl(launchUrl.url);
      }
    }

    void configureDeepLinks();

    return () => {
      void removeListener?.();
    };
  }, [router]);

  return null;
}

