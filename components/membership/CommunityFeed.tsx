"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type FeedPost = {
  id: string;
  created_at: string;
  community_id: string;
  user_id: string;
  author_name: string | null;
  content: string;
  image_url: string | null;
  likes: number;
  comments_count: number;
};

type FeedComment = {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
};

type CommunityFeedProps = {
  communityId?: string;
  userId: string | null;
  userName: string | null;
  mode?: "community" | "app";
};

function getInitials(name: string | null): string {
  if (!name) return "AT";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getAvatarBackground(seed: string): string {
  const palettes = [
    "radial-gradient(circle at 30% 30%, #38bdf8, #0f172a)",
    "radial-gradient(circle at 30% 30%, #22c55e, #0f172a)",
    "radial-gradient(circle at 30% 30%, #f59e0b, #0f172a)",
    "radial-gradient(circle at 30% 30%, #a78bfa, #0f172a)",
    "radial-gradient(circle at 30% 30%, #fb7185, #0f172a)",
  ];

  let sum = 0;

  for (let i = 0; i < seed.length; i += 1) {
    sum += seed.charCodeAt(i);
  }

  return palettes[sum % palettes.length];
}

function getDisplayName(name: string | null): string {
  return name?.trim() ? name.trim() : "Athlete";
}

function getRecencyBonus(createdAt: string): number {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) return 0;

  const ageInMs = Date.now() - createdTime;
  const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

  if (ageInDays <= 1) return 30;
  if (ageInDays <= 3) return 20;
  if (ageInDays <= 7) return 10;
  if (ageInDays <= 14) return 4;

  return 0;
}

function getFeedScore(
  post: Pick<FeedPost, "likes" | "comments_count" | "created_at">
): number {
  return post.likes + post.comments_count * 4 + getRecencyBonus(post.created_at);
}

export default function CommunityFeed({
  communityId,
  userId,
  userName,
  mode = "community",
}: CommunityFeedProps) {
  const supabase = useMemo(() => supabaseBrowser, []);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [likeLoadingPostId, setLikeLoadingPostId] = useState<string | null>(null);
  const [commentLoadingPostId, setCommentLoadingPostId] = useState<string | null>(null);

  const [postComments, setPostComments] =
    useState<Record<string, FeedComment[]>>({});

  const [openComments, setOpenComments] =
    useState<Set<string>>(new Set());

  const [loadingCommentsPostId, setLoadingCommentsPostId] =
    useState<string | null>(null);

  const [activePostId, setActivePostId] =
    useState<string | null>(null);

  const [expandedPosts, setExpandedPosts] =
    useState<Set<string>>(new Set());

  const [deletingPostId, setDeletingPostId] =
    useState<string | null>(null);

  const [deletingCommentId, setDeletingCommentId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setFeedLoading(true);

      let postsQuery = supabase
        .from("app_membership_feed_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (mode === "community" && communityId) {
        postsQuery = postsQuery.eq("community_id", communityId);
      }

      const { data: postsData, error: postsError } = await postsQuery;

      if (cancelled) return;

      if (postsError || !postsData) {
        console.error("Error loading membership feed posts:", postsError);
        setPosts([]);
        setLikedPosts(new Set());
        setActivePostId(null);
        setFeedLoading(false);
        return;
      }

      const rawPosts = (postsData as FeedPost[]) ?? [];
      const postIds = rawPosts.map((post) => post.id);

      const likeCountMap: Record<string, number> = {};
      const commentCountMap: Record<string, number> = {};
      const likedByCurrentUser = new Set<string>();

      if (postIds.length > 0) {
        const { data: likesData } = await supabase
          .from("app_membership_feed_likes")
          .select("post_id, user_id")
          .in("post_id", postIds);

        if (cancelled) return;

        if (likesData) {
          (
            likesData as Array<{
              post_id: string;
              user_id: string;
            }>
          ).forEach((row) => {
            likeCountMap[row.post_id] =
              (likeCountMap[row.post_id] ?? 0) + 1;

            if (userId && row.user_id === userId) {
              likedByCurrentUser.add(row.post_id);
            }
          });
        }

        const { data: commentsData } = await supabase
          .from("app_membership_feed_comments")
          .select("post_id")
          .in("post_id", postIds);

        if (cancelled) return;

        if (commentsData) {
          (
            commentsData as Array<{
              post_id: string;
            }>
          ).forEach((row) => {
            commentCountMap[row.post_id] =
              (commentCountMap[row.post_id] ?? 0) + 1;
          });
        }
      }

      const postsWithCounters = rawPosts.map((post) => ({
        ...post,
        likes: likeCountMap[post.id] ?? 0,
        comments_count: commentCountMap[post.id] ?? 0,
      }));

      const sortedPosts = [...postsWithCounters].sort((a, b) => {
        const scoreA = getFeedScore(a);
        const scoreB = getFeedScore(b);

        if (scoreB !== scoreA) return scoreB - scoreA;

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });

      setPosts(sortedPosts);
      setLikedPosts(likedByCurrentUser);
      setActivePostId(sortedPosts[0]?.id ?? null);
      setFeedLoading(false);
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [communityId, mode, userId, supabase]);

  useEffect(() => {
    const container = carouselRef.current;

    if (!container || posts.length === 0) return;

    const updateActiveCard = () => {
      const cards = Array.from(
        container.querySelectorAll<HTMLElement>("[data-feed-card='true']")
      );

      if (cards.length === 0) return;

      const containerCenter =
        container.scrollLeft + container.clientWidth / 2;

      let nearestId: string | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card) => {
        const cardCenter =
          card.offsetLeft + card.offsetWidth / 2;

        const distance = Math.abs(
          containerCenter - cardCenter
        );

        const postId = card.dataset.postId || null;

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = postId;
        }
      });

      setActivePostId(nearestId);
    };

    updateActiveCard();

    container.addEventListener("scroll", updateActiveCard, {
      passive: true,
    });

    window.addEventListener("resize", updateActiveCard);

    return () => {
      container.removeEventListener("scroll", updateActiveCard);
      window.removeEventListener("resize", updateActiveCard);
    };
  }, [posts]);

  async function handleLike(postId: string) {
    if (!userId) return;

    const alreadyLiked = likedPosts.has(postId);
    setLikeLoadingPostId(postId);

    if (alreadyLiked) {
      const { error } = await supabase
        .from("app_membership_feed_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing like:", error);
      } else {
        setLikedPosts((previous) => {
          const copy = new Set(previous);
          copy.delete(postId);
          return copy;
        });

        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likes: Math.max(0, post.likes - 1),
                }
              : post
          )
        );
      }
    } else {
      const { error } = await supabase
        .from("app_membership_feed_likes")
        .insert({
          post_id: postId,
          user_id: userId,
        });

      if (error) {
        console.error("Error saving like:", error);
      } else {
        setLikedPosts((previous) => {
          const copy = new Set(previous);
          copy.add(postId);
          return copy;
        });

        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? { ...post, likes: post.likes + 1 }
              : post
          )
        );
      }
    }

    setLikeLoadingPostId(null);
  }

  async function toggleComments(postId: string) {
    if (openComments.has(postId)) {
      setOpenComments((previous) => {
        const copy = new Set(previous);
        copy.delete(postId);
        return copy;
      });

      return;
    }

    if (postComments[postId]) {
      setOpenComments((previous) => {
        const copy = new Set(previous);
        copy.add(postId);
        return copy;
      });

      return;
    }

    setLoadingCommentsPostId(postId);

    const { data, error } = await supabase
      .from("app_membership_feed_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading comments:", error);
    } else if (data) {
      setPostComments((previous) => ({
        ...previous,
        [postId]: data as FeedComment[],
      }));

      setOpenComments((previous) => {
        const copy = new Set(previous);
        copy.add(postId);
        return copy;
      });
    }

    setLoadingCommentsPostId(null);
  }

  async function handleSubmitComment(postId: string) {
    const text = (commentText[postId] || "").trim();

    if (!text || !userId) return;

    setCommentLoadingPostId(postId);

    const { data, error } = await supabase
      .from("app_membership_feed_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        author_name: userName,
        content: text,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving comment:", error);
    } else if (data) {
      const newComment = data as FeedComment;

      setCommentText((previous) => ({
        ...previous,
        [postId]: "",
      }));

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments_count:
                  post.comments_count + 1,
              }
            : post
        )
      );

      setPostComments((previous) => ({
        ...previous,
        [postId]: [
          ...(previous[postId] ?? []),
          newComment,
        ],
      }));

      setOpenComments((previous) => {
        const copy = new Set(previous);
        copy.add(postId);
        return copy;
      });
    }

    setCommentLoadingPostId(null);
  }

  async function handleDeletePost(postId: string) {
    if (!userId) return;

    const confirmed = window.confirm("Delete this post?");

    if (!confirmed) return;

    setDeletingPostId(postId);

    const { error } = await supabase
      .from("app_membership_feed_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting post:", error);
      setDeletingPostId(null);
      return;
    }

    setPosts((current) =>
      current.filter((post) => post.id !== postId)
    );

    setLikedPosts((previous) => {
      const copy = new Set(previous);
      copy.delete(postId);
      return copy;
    });

    setOpenComments((previous) => {
      const copy = new Set(previous);
      copy.delete(postId);
      return copy;
    });

    setPostComments((previous) => {
      const copy = { ...previous };
      delete copy[postId];
      return copy;
    });

    setExpandedPosts((previous) => {
      const copy = new Set(previous);
      copy.delete(postId);
      return copy;
    });

    setDeletingPostId(null);
  }

  async function handleDeleteComment(
    postId: string,
    commentId: string
  ) {
    if (!userId) return;

    const confirmed =
      window.confirm("Delete this comment?");

    if (!confirmed) return;

    setDeletingCommentId(commentId);

    const { error } = await supabase
      .from("app_membership_feed_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting comment:", error);
      setDeletingCommentId(null);
      return;
    }

    setPostComments((previous) => {
      const currentComments =
        previous[postId] ?? [];

      return {
        ...previous,
        [postId]: currentComments.filter(
          (comment) => comment.id !== commentId
        ),
      };
    });

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments_count: Math.max(
                0,
                post.comments_count - 1
              ),
            }
          : post
      )
    );

    setDeletingCommentId(null);
  }

  function toggleExpandedPost(postId: string) {
    setExpandedPosts((previous) => {
      const copy = new Set(previous);

      if (copy.has(postId)) {
        copy.delete(postId);
      } else {
        copy.add(postId);
      }

      return copy;
    });
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <style>{`
        .community-feed-shell {
          width: 100%;
        }

        .community-feed-shell::before,
        .community-feed-shell::after {
          display: none;
        }

        .community-feed-carousel {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
          overflow: visible;
          padding: 0;
          margin: 0;
          scroll-snap-type: none;
        }

        .community-feed-carousel::before,
        .community-feed-carousel::after {
          display: none;
        }

        .community-feed-card {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          transform: none;
          opacity: 1;
          scroll-snap-align: none;
        }

        .community-feed-card.is-active {
          transform: none;
          opacity: 1;
        }

        @media (max-width: 640px) {
          .community-feed-carousel {
            width: 100%;
          }
        }
`}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: "0 0 4px 0",
              color: "#0f172a",
            }}
          >
            Feed do Grupo
          </h2>

          <div
            style={{
              color: "#64748b",
              fontSize: 13,
            }}
          >
            Converse, compartilhe treinos e acompanhe a comunidade.
          </div>
        </div>

        <Link
          href={mode === "app" ? "/feed/new" : `/groups/${communityId}/inside/feed/new`}
          style={{
            textDecoration: "none",
            borderRadius: 999,
            padding: "10px 16px",
            background: "#22c55e",
            color: "#052e16",
            fontWeight: 700,
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          Nova publicação
        </Link>
      </div>

      {feedLoading ? (
        <div
          style={{
            color: "#64748b",
            fontSize: 14,
          }}
        >
          Carregando feed...
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            padding: 18,
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          Ainda não há publicações neste grupo. Seja o primeiro a compartilhar.
        </div>
      ) : (
        <div className="community-feed-shell">
          <div
            ref={carouselRef}
            className="community-feed-carousel"
          >
            {posts.map((post) => {
              const isLiked =
                likedPosts.has(post.id);

              const isCommentsOpen =
                openComments.has(post.id);

              const comments =
                postComments[post.id] ?? [];

              const authorLabel =
                getDisplayName(post.author_name);

              const isActive =
                activePostId === post.id;

              const isExpanded =
                expandedPosts.has(post.id);

              const canDeletePost =
                userId === post.user_id;

              return (
                <article
                  key={post.id}
                  data-feed-card="true"
                  data-post-id={post.id}
                  className="community-feed-card"
                  style={{
                    borderRadius: 0,
                    border: "none",
                    borderBottom: "10px solid #f1f5f9",
                    background: "#ffffff",
                    padding: "18px 4px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          background:
                            getAvatarBackground(
                              authorLabel
                            ),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#f8fafc",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(authorLabel)}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {authorLabel}
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            color: "#64748b",
                          }}
                        >
                          {new Date(
                            post.created_at
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {canDeletePost && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeletePost(post.id)
                        }
                        disabled={
                          deletingPostId === post.id
                        }
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fff1f2",
                          color: "#be123c",
                          borderRadius: 999,
                          padding: "3px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                          opacity:
                            deletingPostId === post.id
                              ? 0.7
                              : 1,
                        }}
                      >
                        {deletingPostId === post.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      marginBottom:
                        post.image_url ? 12 : 10,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: !post.image_url && !isExpanded ? 700 : 400,
                        color: "#0f172a",
                        margin: 0,
                        lineHeight: 1.6,
                        display: isExpanded
                          ? "block"
                          : "-webkit-box",
                        WebkitLineClamp:
                          isExpanded ? "unset" : 2,
                        WebkitBoxOrient:
                          "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word",
                      }}
                    >
                      {post.content}
                    </p>

                    {post.content.length > 90 && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleExpandedPost(post.id)
                        }
                        style={{
                          marginTop: 6,
                          border: "none",
                          background: "transparent",
                          color: "#2563eb",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {isExpanded
                          ? "Ver menos"
                          : "Ver mais"}
                      </button>
                    )}
                  </div>

                  {post.image_url && (
                    <div
                      style={{
                        borderRadius: 0,
                        overflow: "hidden",
                        border: "none",
                        marginBottom: 8,
                        background: "#f8fafc",
                        padding: 0,
                      }}
                    >
                      <img
                        src={post.image_url}
                        alt="Community post"
                        style={{
                          width: "100%",
                          maxHeight: 520,
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      fontSize: 12,
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: "1px solid #e2e8f0",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          void handleLike(post.id)
                        }
                        disabled={
                          likeLoadingPostId ===
                          post.id
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          color: isLiked
                            ? "#16a34a"
                            : "#334155",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          padding: "8px 10px",
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          {isLiked ? "💚" : "🤍"}
                        </span>

                        <span>
                          {isLiked
                            ? "Liked"
                            : "Like"}
                        </span>
                      </button>

                      <span
                        style={{
                          color: "#64748b",
                        }}
                      >
                        {post.likes} curtida
                        {post.likes === 1
                          ? ""
                          : "s"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleComments(post.id)
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#64748b",
                        fontSize: 12,
                        cursor: "pointer",
                        padding: "4px 6px",
                      }}
                    >
                      {loadingCommentsPostId ===
                      post.id
                        ? "Carregando comentários..."
                        : isCommentsOpen
                          ? `Ocultar comentários (${post.comments_count})`
                          : `Comentários (${post.comments_count})`}
                    </button>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSubmitComment(
                          post.id
                        );
                      }}
                      style={{
                        display: "flex",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Escreva um comentário..."
                        value={
                          commentText[post.id] ?? ""
                        }
                        onChange={(event) =>
                          setCommentText(
                            (previous) => ({
                              ...previous,
                              [post.id]:
                                event.target.value,
                            })
                          )
                        }
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 12,
                          padding: "8px 10px",
                          borderRadius: 999,
                          border:
                            "1px solid #d6dbe4",
                          backgroundColor:
                            "#ffffff",
                          color: "#0f172a",
                        }}
                      />

                      <button
                        type="submit"
                        disabled={
                          commentLoadingPostId ===
                          post.id
                        }
                        style={{
                          fontSize: 12,
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "none",
                          background: "#0f172a",
                          color: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        {commentLoadingPostId ===
                        post.id
                          ? "Enviando..."
                          : "Enviar"}
                      </button>
                    </form>
                  </div>

                  {isCommentsOpen && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop:
                          "1px solid #e2e8f0",
                        maxHeight: 220,
                        overflowY: "auto",
                      }}
                    >
                      {comments.length === 0 ? (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            margin: 0,
                          }}
                        >
                          Ainda não há comentários nesta publicação.
                        </p>
                      ) : (
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                            display: "flex",
                            flexDirection:
                              "column",
                            gap: 6,
                          }}
                        >
                          {comments.map(
                            (comment) => {
                              const commentAuthor =
                                getDisplayName(
                                  comment.author_name
                                );

                              const canDeleteComment =
                                userId ===
                                comment.user_id;

                              return (
                                <li
                                  key={comment.id}
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 999,
                                      background:
                                        getAvatarBackground(
                                          commentAuthor
                                        ),
                                      display: "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "#f8fafc",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {getInitials(
                                      commentAuthor
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    <div
                                      style={{
                                        background: "#f1f5f9",
                                        borderRadius: 14,
                                        padding: "8px 11px 9px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent:
                                            "space-between",
                                          alignItems: "center",
                                          gap: 8,
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: "#0f172a",
                                          }}
                                        >
                                          {commentAuthor}
                                        </span>

                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#94a3b8",
                                            flexShrink: 0,
                                          }}
                                        >
                                          {new Date(
                                            comment.created_at
                                          ).toLocaleDateString(
                                            "pt-BR",
                                            {
                                              day: "2-digit",
                                              month: "2-digit",
                                            }
                                          )}
                                        </span>
                                      </div>

                                      <p
                                        style={{
                                          margin: "3px 0 0",
                                          color: "#334155",
                                          fontSize: 12,
                                          lineHeight: 1.5,
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {comment.content}
                                      </p>
                                    </div>

                                    {canDeleteComment && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleDeleteComment(
                                            post.id,
                                            comment.id
                                          )
                                        }
                                        disabled={
                                          deletingCommentId ===
                                          comment.id
                                        }
                                        style={{
                                          marginTop: 3,
                                          marginLeft: 10,
                                          border: "none",
                                          background:
                                            "transparent",
                                          color: "#64748b",
                                          fontSize: 10,
                                          fontWeight: 600,
                                          cursor:
                                            "pointer",
                                          padding: 0,
                                        }}
                                      >
                                        {deletingCommentId ===
                                        comment.id
                                          ? "Excluindo..."
                                          : "Excluir"}
                                      </button>
                                    )}
                                  </div>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}












