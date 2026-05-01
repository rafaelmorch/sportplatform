"use client";

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
      <body style={{ background: "#ffffff" }}>
        {showHeader && <Header />}

        {children}

        {!hideBottomNav && <BottomNavbar />}
      </body>
    </html>
  );
}


