// components/BottomNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  UsersRound,
  FileText,
  BarChart3,
  UserRound,
} from "lucide-react";

type NavItem = {
  href?: string;
  label: string;
  Icon: LucideIcon;
  matchPrefix?: string;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  {
    href: "/feed",
    label: "Feed",
    Icon: Home,
    matchPrefix: "/feed",
  },
  {
    href: "/groups",
    label: "Grupos",
    Icon: UsersRound,
    matchPrefix: "/groups",
  },
  {
    href: "/plans",
    label: "Planos",
    Icon: FileText,
    matchPrefix: "/plans",
  },
  {
    href: "/public-dashboard",
    label: "Insights",
    Icon: BarChart3,
    matchPrefix: "/public-dashboard",
  },
  {
    label: "Login",
    Icon: UserRound,
    disabled: true, // por enquanto desligado
  },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (!item.href && !item.matchPrefix) return false;

    const href = item.href ?? item.matchPrefix!;
    const prefix = item.matchPrefix ?? href;

    if (pathname === href) return true;
    if (pathname.startsWith(prefix)) return true;

    return false;
  }

  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        width: "100%",
        borderTop: "1px solid #1e293b",
        background: "#020617",
        zIndex: 30,
      }}
    >
      <div
        style={{
          maxWidth: "1024px",
          margin: "0 auto",
          padding: "6px 12px 8px 12px",
          display: "flex",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item);

          // Aba desabilitada (Login)
          if (item.disabled) {
            const DisabledIcon = item.Icon;
            return (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  opacity: 0.45,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  fontSize: "11px",
                  color: "#64748b",
                  padding: "4px 2px",
                }}
              >
                <DisabledIcon
                  style={{
                    width: 20,
                    height: 20,
                    strokeWidth: 2,
                  }}
                />
                <span>{item.label}</span>
              </div>
            );
          }

          const IconComp = item.Icon;

          return (
            <Link
              key={item.label}
              href={item.href!}
              style={{
                flex: 1,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  padding: "4px 2px",
                  borderRadius: "999px",
                  background: active ? "#0f172a" : "transparent",
                  color: active ? "#e5e7eb" : "#9ca3af",
                }}
              >
                <IconComp
                  style={{
                    width: 20,
                    height: 20,
                    strokeWidth: 2.1,
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
