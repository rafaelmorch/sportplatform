// components/BottomNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabItem = {
  href: string;
  label: string;
  coach?: boolean;
};

const tabs: TabItem[] = [
  { href: "/feed", label: "Feed" },
  { href: "/groups", label: "Groups" },
  { href: "/activities", label: "Group\nActivities" },
  {
    href: "/performance-ai/coach",
    label: "Coach IA",
    coach: true,
  },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: 64,
        paddingLeft: 6,
        paddingRight: 6,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        boxShadow: "0 -6px 20px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        gap: 2,
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(pathname || "", tab.href);
        const isCoach = tab.coach === true;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: isCoach ? "0 0 auto" : "1 1 0",
              maxWidth: isCoach ? 82 : 90,
              minWidth: 0,
              textDecoration: "none",

              color: isCoach
                ? "#FFF1A8"
                : active
                  ? "#1e3a8a"
                  : "#6b7280",

              background: isCoach
                ? "#111111"
                : active
                  ? "rgba(30,58,138,0.10)"
                  : "transparent",

              fontFamily: "Montserrat, Arial, sans-serif",
              fontSize: isCoach ? 10 : 11,
              fontWeight: isCoach ? 800 : active ? 700 : 500,
              padding: isCoach ? "8px 11px" : "6px 4px",
              borderRadius: isCoach ? 999 : 12,

              border: isCoach
                ? "1px solid #FFF1A8"
                : "1px solid transparent",

              boxShadow: isCoach
                ? "0 5px 14px rgba(0,0,0,0.22)"
                : "none",

              textAlign: "center",
              whiteSpace: "pre-line",
              lineHeight: "13px",
              transition:
                "background 180ms ease, color 180ms ease, transform 180ms ease",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
