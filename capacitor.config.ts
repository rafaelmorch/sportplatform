import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.platformsports.app",
  appName: "Platform Sports",
  webDir: "capacitor-www",
  server: {
    url: "https://sportsplatform.app",
    cleartext: false
  }
};

export default config;
