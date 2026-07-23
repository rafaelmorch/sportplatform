"use client";

import { usePathname } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import Header from "@/components/Header";
import RouteLoading from "@/components/RouteLoading";
import CapacitorAndroidFix from "./CapacitorAndroidFix";

export default function AppShell({
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
    <>
      <RouteLoading />
      <CapacitorAndroidFix />

      {showHeader && <Header />}

      {children}

      {!hideBottomNav && <BottomNavbar />}
    </>
  );
}
