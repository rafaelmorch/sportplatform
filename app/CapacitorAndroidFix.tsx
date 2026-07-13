"use client";

import { useEffect } from "react";

export default function CapacitorAndroidFix() {
  useEffect(() => {
    (async () => {
      const { Capacitor } = await import("@capacitor/core");

      if (!Capacitor.isNativePlatform()) return;

      const platform = Capacitor.getPlatform();

      const { StatusBar } = await import("@capacitor/status-bar");
      await StatusBar.setOverlaysWebView({ overlay: false });

      if (platform === "android") {
        const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      }
    })();
  }, []);

  return null;
}
