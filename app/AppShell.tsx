"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import BottomNavbar from "@/components/BottomNavbar";
import Header from "@/components/Header";
import RouteLoading from "@/components/RouteLoading";
import CapacitorAndroidFix from "./CapacitorAndroidFix";
import CapacitorDeepLinkHandler from "./CapacitorDeepLinkHandler";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPerformanceAI =
    pathname === "/performance-ai" ||
    pathname.startsWith("/performance-ai/");

  useEffect(() => {
    const background = isPerformanceAI
      ? "#050506"
      : "#ffffff";

    document.documentElement.style.background = background;
    document.body.style.background = background;
  }, [isPerformanceAI]);

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
      <CapacitorDeepLinkHandler />

      {showHeader && <Header />}

      {children}

      {!hideBottomNav && <BottomNavbar />}
    </>
  );
}

