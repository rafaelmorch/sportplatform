// app/feed/page.tsx
"use client";

import { useState } from "react";

type Post = {
  id: number;
  athleteName: string;
  avatarInitials: string;
  timeAgo: string;
  text: string;
  imageUrl?: string;
  likes: number;
  comments: number;
};

const initialPosts: Post[] = [
  {
    id: 1,
    athleteName: "Rafael Morch",
    avatarInitials: "RM",
    timeAgo: "2h",
    text: "Primeiro treino do bloco de maratona concluído. Ritmo controlado e sensação ótima nas pernas.",
    imageUrl:
      "https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=800",
    likes: 28,
    comments: 6,
  },
  {
    id: 2,
    athleteName: "Enzo Maia",
    avatarInitials: "EM",
    timeAgo: "5h",
    text: "Transição de bike para corrida do triathlon muito mais fluida hoje. Ajustando hidratação e cadência.",
    imageUrl:
      "https://images.pexels.com/photos/3996349/pexels-photo-3996349.jpeg?auto=compress&cs=tinysrgb&w=800",
    likes: 42,
    comments: 9,
  },
  {
    id: 3,
    athleteName: "Ana Souza",
    avatarInitials: "AS",
    timeAgo: "1d",
    text: "Sessão leve de recuperação. Foco em manter a consistência diária e respeitar os dias regenerativos.",
    imageUrl:
      "https://images.pexels.com/photos/1552103/pexels-photo-1552103.jpeg?auto=compress&cs=tinysrgb&w=800",
    likes: 19,
    comments: 3,
  },
];

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  function handleLike(postId: number) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  }

  function handleComment(postId: number) {
    // Para apresentação: apenas incrementa o contador de comentários.
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments + 1 }
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
              Compartilhe seus treinos, fotos e conquistas com o grupo.
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

        {/* LISTA DE POSTS */}
        <div
          style={{
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
                  {post.avatarInitials}
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
                    {post.athleteName}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    {post.timeAgo} · Treino publicado
                  </span>
                </div>
              </div>

              {/* Texto */}
              <p
                style={{
                  fontSize: "13px",
                  color: "#e5e7eb",
                  marginBottom: post.imageUrl ? "10px" : "8px",
                  lineHeight: 1.5,
                }}
              >
                {post.text}
              </p>

              {/* Imagem, se existir */}
              {post.imageUrl && (
                <div
                  style={{
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid #1e293b",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src={post.imageUrl}
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
                  <span>{post.comments} comentários</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
