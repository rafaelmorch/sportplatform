// app/feed/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Post = {
  id: string;
  created_at: string;
  author_name: string | null;
  content: string;
  image_url: string | null;
  likes: number;
  comments_count: number;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    setLoading(true);

    const { data, error } = await supabaseBrowser
      .from("feed_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as Post[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleLike(postId: string) {
    // Para demo: incrementa apenas no front e não grava no Supabase
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  }

  async function handleComment(postId: string) {
    // Para demo: incrementa apenas no front
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      )
    );
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
                fontSize: "24px",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              Feed de Treinos
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Registros em tempo real das sessões de treino dos atletas.
            </p>
          </div>

          <a
            href="/feed/new"
            style={{
              padding: "9px 14px",
              borderRadius: "999px",
              background: "#22c55e",
              color: "#020617",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Nova postagem
          </a>
        </header>

        {/* ESTADO DE CARREGAMENTO */}
        {loading && (
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginTop: "8px",
            }}
          >
            Carregando postagens…
          </p>
        )}

        {/* LISTA DE POSTS */}
        {!loading && posts.length === 0 && (
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginTop: "8px",
            }}
          >
            Nenhuma postagem ainda. Seja o primeiro a registrar seu treino.
          </p>
        )}

        <div
          style={{
            marginTop: posts.length > 0 ? "4px" : "0",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                borderRadius: "16px",
                border: "1px solid #1e293b",
                background: "#020617",
                padding: "14px 14px 12px 14px",
              }}
            >
              {/* Header do post */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "999px",
                    background:
                      "radial-gradient(circle at 30% 30%, #22c55e, #0f172a)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0b1120",
                  }}
                >
                  {(post.author_name || "AT")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {post.author_name || "Atleta"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Texto */}
              <p
                style={{
                  fontSize: "13px",
                  color: "#e5e7eb",
                  marginBottom: post.image_url ? "10px" : "8px",
                  lineHeight: 1.5,
                }}
              >
                {post.content}
              </p>

              {/* Imagem, se existir */}
              {post.image_url && (
                <div
                  style={{
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid #1e293b",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src={post.image_url}
                    alt="Foto do treino"
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              )}

              {/* Ações */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      padding: "4px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        lineHeight: 1,
                      }}
                    >
                      ❤️
                    </span>
                    <span>Curtir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleComment(post.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      padding: "4px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        lineHeight: 1,
                      }}
                    >
                      💬
                    </span>
                    <span>Comentar</span>
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    color: "#64748b",
                  }}
                >
                  <span>{post.likes} curtidas</span>
                  <span>{post.comments_count} comentários</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
