// app/feed/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import BottomNavbar from "@/components/BottomNavbar";

export default function NewPostPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = text.trim().length > 0;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);

    let imageUrl: string | null = null;

    try {
      // 1) Upload da imagem, se existir
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from("feed-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Erro ao fazer upload:", uploadError.message);
        } else {
          const { data: publicData } = supabaseBrowser.storage
            .from("feed-images")
            .getPublicUrl(filePath);

          imageUrl = publicData.publicUrl;
        }
      }

      // 2) Inserir o post no feed
      const { error: insertError } = await supabaseBrowser
        .from("feed_posts")
        .insert({
          author_name: name || null,
          content: text,
          image_url: imageUrl,
        });

      if (insertError) {
        console.error("Erro ao salvar post:", insertError.message);
      } else {
        router.push("/feed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "72px", // espaço para a bottom navbar
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
          }}
        >
          {/* TÍTULO */}
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "20px",
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
              Voltar ao feed
            </a>
          </div>

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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  fontWeight: 500,
                }}
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  fontWeight: 500,
                }}
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

            {/* UPLOAD DE IMAGEM */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  fontWeight: 500,
                }}
              >
                Foto do treino (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  fontSize: "13px",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              style={{
                marginTop: "4px",
                padding: "10px 14px",
                borderRadius: "999px",
                border: "none",
                background: isValid && !loading ? "#22c55e" : "#1f2937",
                color: isValid && !loading ? "#020617" : "#6b7280",
                fontSize: "14px",
                fontWeight: 700,
                cursor: isValid && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Publicando..." : "Publicar no feed"}
            </button>
          </form>

          {/* PRÉVIA */}
          {(text.trim().length > 0 || previewUrl) && (
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
              {text.trim().length > 0 && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#e5e7eb",
                    marginBottom: previewUrl ? "8px" : 0,
                  }}
                >
                  {text}
                </p>
              )}
              {previewUrl && (
                <div
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #1e293b",
                  }}
                >
                  <img
                    src={previewUrl}
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
      </main>

      {/* NAV INFERIOR */}
      <BottomNavbar />
    </div>
  );
}
