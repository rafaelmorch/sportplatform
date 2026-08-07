"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabItem = {
  href: string;
  label: string;
  icon: "feed" | "groups" | "activities" | "coach" | "profile";
  coach?: boolean;
};

const tabs: TabItem[] = [
  {
    href: "/feed",
    label: "Feed",
    icon: "feed",
  },
  {
    href: "/groups",
    label: "Groups",
    icon: "groups",
  },
  {
    href: "/activities",
    label: "Activities",
    icon: "activities",
  },
  {
    href: "/performance-ai",
    label: "Coach IA",
    icon: "coach",
    coach: true,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: "profile",
  },
];

function isActive(
  pathname: string,
  href: string
) {
  return (
    pathname === href ||
    pathname.startsWith(href + "/")
  );
}

function TabIcon({
  type,
}: {
  type: TabItem["icon"];
}) {
  const commonProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "feed") {
    return (
      <svg {...commonProps}>
        <path d="M3.5 10.5 12 3.8l8.5 6.7" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    );
  }

  if (type === "groups") {
    return (
      <svg {...commonProps}>
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.5" />
        <path d="M3.5 19c.6-3.2 2.5-5 5.5-5s4.9 1.8 5.5 5" />
        <path d="M14.5 15c2.9 0 4.8 1.3 5.5 4" />
      </svg>
    );
  }

  if (type === "activities") {
    return (
      <svg {...commonProps}>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M7.5 3v4" />
        <path d="M16.5 3v4" />
        <path d="M3.5 9.5h17" />
        <path d="m8 14 2.2 2.2 5-5" />
      </svg>
    );
  }

  if (type === "coach") {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 3.5c.5 3.2 2.3 5 5.5 5.5-3.2.5-5 2.3-5.5 5.5-.5-3.2-2.3-5-5.5-5.5 3.2-.5 5-2.3 5.5-5.5Z"
          fill="currentColor"
        />
        <path
          d="M18.3 14.3c.25 1.65 1.15 2.55 2.8 2.8-1.65.25-2.55 1.15-2.8 2.8-.25-1.65-1.15-2.55-2.8-2.8 1.65-.25 2.55-1.15 2.8-2.8Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="8" r="3.5" />
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 18.5c1.4-3.2 3.6-4.8 6.5-4.8s5.1 1.6 6.5 4.8" />
    </svg>
  );
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

        minHeight: 62,
        boxSizing: "border-box",

        padding:
          "5px 6px max(5px, env(safe-area-inset-bottom))",

        display: "grid",
        gridTemplateColumns:
          "repeat(5, minmax(0, 1fr))",
        alignItems: "center",

        background:
          "rgba(255,255,255,0.98)",
        borderTop:
          "1px solid rgba(15,23,42,0.08)",
        boxShadow:
          "0 -5px 18px rgba(0,0,0,0.07)",

        fontFamily:
          "Montserrat, Arial, sans-serif",
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(
          pathname || "",
          tab.href
        );

        const isCoach =
          tab.coach === true;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={
              active ? "page" : undefined
            }
            style={{
              position: "relative",

              minWidth: 0,
              height: 51,

              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,

              margin: isCoach
                ? "0 3px"
                : 0,

              padding: isCoach
                ? "3px 4px"
                : "3px 1px",

              boxSizing: "border-box",

              border: isCoach
                ? "1px solid rgba(212,175,55,0.38)"
                : "1px solid transparent",

              borderRadius: isCoach
                ? 12
                : 10,

              background: isCoach
                ? active
                  ? "linear-gradient(180deg, rgba(255,247,217,0.95), rgba(255,255,255,0.96))"
                  : "rgba(212,175,55,0.045)"
                : active
                  ? "rgba(15,23,42,0.045)"
                  : "transparent",

              color: isCoach
                ? active
                  ? "#B18418"
                  : "#C69A27"
                : active
                  ? "#111827"
                  : "#6B7280",

              textDecoration: "none",
              textAlign: "center",

              boxShadow: isCoach
                ? active
                  ? "0 3px 12px rgba(181,140,32,0.16)"
                  : "none"
                : "none",

              transition:
                "background 160ms ease, color 160ms ease, border-color 160ms ease",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <TabIcon type={tab.icon} />
            </span>

            <span
              style={{
                maxWidth: "100%",
                fontSize: isCoach
                  ? 9.5
                  : 9,
                fontWeight: isCoach
                  ? 700
                  : active
                    ? 600
                    : 500,

                lineHeight: 1.05,
                whiteSpace: "pre-line",
                overflow: "hidden",
              }}
            >
              {tab.label}
            </span>

            {active ? (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: 1,

                  width: 3.5,
                  height: 3.5,
                  borderRadius: "50%",

                  background: isCoach
                    ? "#D4AF37"
                    : "#111827",
                }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}


