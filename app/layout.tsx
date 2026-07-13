import type { Viewport } from "next";
import AppShell from "./AppShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ background: "#ffffff" }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
