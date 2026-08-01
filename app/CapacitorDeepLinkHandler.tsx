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
        try {
          const parsedUrl = new URL(url);

          if (parsedUrl.host !== "www.sportsplatform.app") {
            return;
          }

          const destination =
            parsedUrl.pathname +
            parsedUrl.search +
            parsedUrl.hash;

          router.replace(destination);
        } catch (error) {
          console.error("Erro ao abrir deep link:", error);
        }
      };

      const listener = await App.addListener("appUrlOpen", ({ url }) => {
        openUrl(url);
      });

      removeListener = () => listener.remove();

      const launchUrl = await App.getLaunchUrl();

      if (launchUrl?.url) {
        openUrl(launchUrl.url);
      }
    }

    configureDeepLinks();

    return () => {
      removeListener?.();
    };
  }, [router]);

  return null;
}
