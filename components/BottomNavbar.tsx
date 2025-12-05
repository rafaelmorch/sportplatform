// components/BottomNavbar.tsx 
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Performance", href: "/dashboard" },
  { label: "Feed", href: "/feed" },

  // O botão "+" entra AQUI no meio
  // colocaremos ele manualmente no JSX

  { label: "Grupos", href: "/groups" },
  { label: "Planos", href: "/plans" },
  { label: "Perfil", href: "/profile" },
];

// NOVO MENU EXTRA
const extraMenu = [
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/garmin-privacy" },
  { label: "Terms", href: "/terms" },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* MENU SUSPENSO */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 70,
            left: 0,
            right: 0,
            zIndex: 60,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(15,23,42,0.95)",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 180,
            }}
          >
            {extraMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  color: "#e5e7eb",
                  fontSize: 14,
                  padding: "8px 10px",
                  borderRadius: 8,
                  textDecoration: "none",
                  backgro
