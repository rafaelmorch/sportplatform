"use client";

import { usePathname } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideBottomNav =
    pathname === "/" || pathname.startsWith("/register");

  return (
    <html lang="en">
      <body>
        {children}
        {!hideBottomNav && <BottomNavbar />}
      </body>
    </html>
  );
}
