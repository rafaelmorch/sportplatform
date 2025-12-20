import Link from "next/link";
import JotformEmbed from "./JotformEmbed";

export const dynamic = "force-dynamic";

export default function EventPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: 24,
      }}
    >
      <Link
        href="/events"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "#93c5fd", // azul claro (troque para #9ca3af se quiser mais neutro)
          fontSize: 14,
          textDecoration: "none",
          marginBottom: 12,
        }}
      >
        ← Voltar para eventos
      </Link>

      <JotformEmbed />
    </main>
  );
}
