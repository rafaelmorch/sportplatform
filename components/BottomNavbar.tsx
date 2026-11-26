"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  UsersRound,
  CalendarDays,
  CircleUserRound,
} from "lucide-react";

type TabItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  coach?: boolean;
};

const tabs: TabItem[] = [
  {
    href: "/feed",
    label: "Feed",
    icon: House,
  },
  {
    href: "/groups",
    label: "Groups",
    icon: UsersRound,
  },
  {
    href: "/activities",
    label: "Activities",
    icon: CalendarDays,
  },

  {
    href: "/profile",
    label: "Profile",
    icon: CircleUserRound,
  },
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
        zIndex: 50,

        minHeight: 66,
        boxSizing: "border-box",

        padding:
          "6px 8px max(6px, env(safe-area-inset-bottom))",

        display: "grid",
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        alignItems: "center",

        background: "rgba(255,255,255,0.98)",
        borderTop: "1px solid #e5e7eb",
        boxShadow: "0 -2px 12px rgba(15,23,42,0.05)",

        fontFamily: "Montserrat, Arial, sans-serif",
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(pathname || "", tab.href);
        const isCoach = tab.coach === true;
        const Icon = tab.icon;

        const activeColor = isCoach ? "#B18418" : "#94A3B8";
        const inactiveColor = isCoach ? "#C69A27" : "#94A3B8";

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            style={{
              position: "relative",

              minWidth: 0,
              height: 52,

              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,

              padding: "4px 2px",
              boxSizing: "border-box",

              margin: isCoach ? "0 3px" : 0,

              border: isCoach
                ? "1px solid rgba(212,175,55,0.38)"
                : "1px solid transparent",

              borderRadius: isCoach ? 12 : 0,

              background: isCoach
                ? "rgba(212,175,55,0.045)"
                : "transparent",

              color: active ? activeColor : inactiveColor,

              textDecoration: "none",
              textAlign: "center",

              transition:
                "color 160ms ease, transform 160ms ease",
            }}
          >
            <span
              style={{
                width: 27,
                height: 27,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon
                size={23}
                strokeWidth={active ? 2.2 : 1.8}
              />
            </span>

            <span
              style={{
                maxWidth: "100%",
                fontSize: 10.5,
                fontWeight: 500,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </span>

            {active && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -6,
                  left: "50%",
                  transform: "translateX(-50%)",

                  width: 24,
                  height: 2.5,
                  borderRadius: 999,

                  background: activeColor,
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
