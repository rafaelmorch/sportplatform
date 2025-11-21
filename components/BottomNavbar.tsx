"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UsersRound,
  FileText,
  BarChart3,
  UserRound,
} from "lucide-react";

export default function BottomNavbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Início", icon: <Home size={22} /> },
    { href: "/groups", label: "Grupos", icon: <UsersRound size={22} /> },
    { href: "/plans", label: "Planos", icon: <FileText size={22} /> },
    { href: "/feed", label: "Feed", icon: <BarChart3 size={22} /> },
    { href: "/profile", label: "Perfil", icon: <UserRound size={22} /> },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#0F172A", // dark azul sportplatform
        borderTop: "1px solid #1e293b",
        padding: "10px 0",
        display: "flex",
        justifyContent: "space-around",
        zIndex: 999, // garantir que sempre fica acima
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: isActive ? "#22c55e" : "#94a3b8",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: isActive ? 700 : 500,
              gap: "4px",
              width: "20%",
            }}
          >
            <div>{item.icon}</div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
