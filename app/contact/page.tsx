"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = encodeURIComponent("Contato - SportsPlatform");
    const body = encodeURIComponent(
      `Nome: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`
    );

    window.location.href = `mailto:contact@sportsplatform.app?subject=${subject}&body=${body}`;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          borderRadius: 18,
          background: "rgba(0,0,0,0.85)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          padding: "28px 22px",
          color: "#fff",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 42, marginBottom: 6 }}>📩</div>
          <h1 style={{ margin: 0, fontSize: 42, letterSpacing: 1 }}>
            Entre em Contato
          </h1>
        </div>

        <p
          style={{
            textAlign: "center",
            marginBottom: 20,
            opacity: 0.95,
          }}
        >
          Se você tiver alguma dúvida ou precisar de ajuda, entre em contato
          conosco. Retornaremos o mais rápido possível!
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            required
            style={inputStyle}
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu e-mail"
            type="email"
            required
            style={inputStyle}
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Sua mensagem"
            required
            rows={6}
            style={{ ...inputStyle, paddingTop: 14, resize: "vertical" }}
          />

          {/* Botão */}
          <button
            type="submit"
            style={{
              height: 56,
              border: 0,
              borderRadius: 10,
              cursor: "pointer",
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1,
              background:
                "linear-gradient(90deg, #ff2d55 0%, #ff9500 50%, #ffd60a 100%)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
            }}
          >
            Enviar Mensagem
          </button>
        </form>

        {/* Informações */}
        <div style={{ marginTop: 20, textAlign: "center", lineHeight: 1.7 }}>
          <div>
            <b>Email:</b> contact@sportsplatform.app
          </div>
          <div>
            <b>Telefone (WhatsApp):</b>{" "}
            <a
              href="https://wa.me/16897992080"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#8bff9d", textDecoration: "none", fontWeight: 700 }}
            >
              (689) 799-2080
            </a>
          </div>
          <div>
            <b>Localização:</b> Estados Unidos
          </div>
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 52,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "#fff",
  color: "#111",
  padding: "0 14px",
  fontSize: 18,
  outline: "none",
};
