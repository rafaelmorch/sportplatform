// app/feed/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPostPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const isValid = text.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Para a apresentação, só redireciona de volta para o feed
    router.push("/feed");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            marginBottom: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              Nova postagem
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Publique um registro do seu treino com foto e mensagem.
            </p>
          </div>

          <a
            href="/feed"
            style={{
              fontSize: "12px",
              color: "#e5e7eb",
              textDecoration: "none",
            }}
          >
            Voltar para o feed
          </a>
        </header>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          style={{
            borderRadius: "16px",
            border: "1px solid #1e293b",
            background: "#020617",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}
            >
              Nome (opcional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como o seu nome aparecerá no feed"
              style={{
                padding: "9px 10px",
                borderRadius: "10px",
                border: "1px solid #1e293b",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}
            >
              Mensagem do treino
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Descreva como foi o treino, sensações, ritmo, distância…"
              rows={4}
              style={{
                padding: "9px 10px",
                borderRadius: "10px",
                border: "1px solid #1e293b",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "13px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}
            >
              URL da imagem (opcional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Cole aqui o link de uma foto do treino"
              style={{
                padding: "9px 10px",
                borderRadius: "10px",
                border: "1px solid #1e293b",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "13px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!isValid}
            style={{
              marginTop: "4px",
              padding: "10px 14px",
              borderRadius: "999px",
              border: "none",
              background: isValid ? "#22c55e" : "#1f2937",
              color: isValid ? "#020617" : "#6b7280",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isValid ? "pointer" : "not-allowed",
            }}
          >
            Publicar no feed
          </button>
        </form>

        {/* PRÉVIA RÁPIDA */}
        {text.trim().length > 0 && (
          <div
            style={{
              marginTop: "18px",
              borderRadius: "16px",
              border: "1px solid #1e293b",
              background: "#020617",
              padding: "14px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#64748b",
                marginBottom: "6px",
              }}
            >
              Prévia da postagem
            </p>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              {name || "Atleta"}
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#e5e7eb",
                marginBottom: imageUrl ? "8px" : 0,
              }}
            >
              {text}
            </p>
            {imageUrl && (
              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #1e293b",
                }}
              >
                <img
                  src={imageUrl}
                  alt="Prévia do treino"
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
