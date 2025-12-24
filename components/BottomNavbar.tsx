// components/BottomNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  enabled?: boolean; // feature flag
};

// ✅ TABS ATIVAS (como você pediu)
const FEATURES = {
  dashboardTab: true,
  groupsTab: true,
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    enabled: FEATURES.dashboardTab,
  },
  {
    label: "Feed",
    href: "/feed",
    enabled: true,
  },
  {
    label: "Groups",
    href: "/groups",
    enabled: FEATURES.groupsTab,
  },
  {
    label: "Events",
    href: "/events",
    enabled: true,
  },
  {
    label: "Profile",
    href: "/profile",
    enabled: true,
  },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderTop: "1px solid rgba(31,41,55,0.9)",
        background:
          "linear-gradient(to top, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "8px 16px 10px 16px",
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {navItems
          .filter((item) => item.enabled !== false)
          .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  padding: "8px 4px",
                  borderRadius: 999,
                  textDecoration: "none",
                  border: isActive
                    ? "1px solid rgba(59,130,246,0.7)" // azul
                    : "1px solid transparent",
                  background: isActive
                    ? "radial-gradient(circle at top, rgba(59,130,246,0.18), transparent)"
                    : "transparent",
                  color: isActive ? "#bfdbfe" : "#e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.15s ease-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
