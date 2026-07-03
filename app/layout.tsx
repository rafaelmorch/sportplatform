"use client";
import RouteLoading from "@/components/RouteLoading";

import { Rowdies } from "next/font/google";
import { usePathname } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import Header from "@/components/Header";

const rowdies = Rowdies({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const showHeader =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms");

  const hideBottomNav =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/beachtennis") ||
    pathname.startsWith("/groups/") ||
    pathname.startsWith("/activities/") ||
    pathname.startsWith("/events/");

  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body style={{ background: "#ffffff", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}><RouteLoading />
        {showHeader && <Header />}

        {children}

        {!hideBottomNav && <BottomNavbar />}
      </body>
    </html>
  );
}








