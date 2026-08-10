"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabaseBrowser } from "@/lib/supabase-browser";
import UserAvatar from "@/components/UserAvatar";

type BadgeChallenge = {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  goal_criteria: string | null;
  badge_image_url: string | null;
  is_active: boolean;
  created_at: string;
};

type BadgePost = {
  id: string;
  community_id: string;
  challenge_id: string;
  user_id: string;
  author_name: string | null;
  image_url: string | null;
  image_path: string | null;
  comment: string | null;
  did_challenge: boolean;
  created_at: string;
};

type Props = {
  communityId: string;
  userId: string | null;
  userName: string | null;
};

function getInitials(name: string | null) {
  const safe = name?.trim() || "Athlete";
  const parts = safe.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function BadgesChallenges({
  communityId,
  userId,
  userName,
}: Props) {
  const supabase = useMemo(() => supabaseBrowser, []);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [challenges, setChallenges] = useState<BadgeChallenge[]>([]);
  const [posts, setPosts] = useState<BadgePost[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeChallengeId, setActiveChallengeId] =
    useState<string | null>(null);

  const [expandedChallengeId, setExpandedChallengeId] =
    useState<string | null>(null);

  const [comment, setComment] = useState("");
  const [didChallenge, setDidChallenge] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [posting, setPosting] = useState(false);
  const [deletingPostId, setDeletingPostId] =
    useState<string | null>(null);

  const [showCompleted, setShowCompleted] =
    useState(false);

  const [errorText, setErrorText] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [challengeResult, postResult] = await Promise.all([
        supabase
          .from("app_membership_challenges")
          .select(
            "id,community_id,title,description,goal_criteria,badge_image_url,is_active,created_at"
          )
          .eq("community_id", communityId)
          .eq("is_active", true)
          .eq("is_badge", true)
          .order("created_at", { ascending: false }),

        supabase
          .from("app_membership_badge_posts")
          .select("*")
          .eq("community_id", communityId)
          .order("created_at", { ascending: false }),
      ]);

      if (challengeResult.error) {
        console.error(
          "Error loading badges:",
          challengeResult.error
        );
        setChallenges([]);
      } else {
        const rows =
          (challengeResult.data || []) as BadgeChallenge[];

        setChallenges(rows);
        setActiveChallengeId(rows[0]?.id ?? null);
      }

      if (postResult.error) {
        console.error(
          "Error loading badge posts:",
          postResult.error
        );
        setPosts([]);
      } else {
        setPosts((postResult.data || []) as BadgePost[]);
      }

      setLoading(false);
    }

    void loadData();
  }, [communityId, supabase]);

  useEffect(() => {
    const container = carouselRef.current;

    if (!container || challenges.length === 0) return;

    const updateActive = () => {
      const cards = Array.from(
        container.querySelectorAll<HTMLElement>(
          "[data-badge-card='true']"
        )
      );

      const center =
        container.scrollLeft + container.clientWidth / 2;

      let nearestId: string | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card) => {
        const cardCenter =
          card.offsetLeft + card.offsetWidth / 2;

        const distance = Math.abs(center - cardCenter);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = card.dataset.challengeId || null;
        }
      });

      setActiveChallengeId(nearestId);
    };

    updateActive();

    container.addEventListener("scroll", updateActive, {
      passive: true,
    });

    window.addEventListener("resize", updateActive);

    return () => {
      container.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [challenges]);

  function toggleBadge(challengeId: string) {
    setExpandedChallengeId((current) =>
      current === challengeId ? null : challengeId
    );

    setComment("");
    setDidChallenge(false);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview(null);
    setErrorText(null);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      event.target.files?.[0] || null;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selected);

    setPreview(
      selected
        ? URL.createObjectURL(selected)
        : null
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!expandedChallengeId || !userId) {
      setErrorText("You must be logged in to post.");
      return;
    }

    const cleanComment = comment.trim();

    if (!cleanComment && !file) {
      setErrorText(
        "Add a comment or photo before posting."
      );
      return;
    }

    setPosting(true);
    setErrorText(null);

    let imageUrl: string | null = null;
    let imagePath: string | null = null;

    try {
      if (file) {
        const extension =
          file.name.split(".").pop() || "jpg";

        imagePath =
          `${userId}/${communityId}/${expandedChallengeId}/${Date.now()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("badge-posts")
            .upload(imagePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("badge-posts")
          .getPublicUrl(imagePath);

        imageUrl = data.publicUrl;
      }

      const { data, error } = await supabase
        .from("app_membership_badge_posts")
        .insert({
          community_id: communityId,
          challenge_id: expandedChallengeId,
          user_id: userId,
          author_name:
            userName?.trim() || "Athlete",
          image_url: imageUrl,
          image_path: imagePath,
          comment: cleanComment || null,
          did_challenge: didChallenge,
        })
        .select()
        .single();

      if (error) {
        if (imagePath) {
          await supabase.storage
            .from("badge-posts")
            .remove([imagePath]);
        }

        throw error;
      }

      setPosts((current) => [
        data as BadgePost,
        ...current,
      ]);

      setComment("");
      setDidChallenge(false);
      setFile(null);

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setPreview(null);
    } catch (error) {
      console.error(
        "Error creating badge post:",
        error
      );

      setErrorText(
        error instanceof Error
          ? error.message
          : "We could not publish your post."
      );
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(post: BadgePost) {
    if (!userId || post.user_id !== userId) return;

    if (!window.confirm("Delete this post?")) return;

    setDeletingPostId(post.id);

    const { error } = await supabase
      .from("app_membership_badge_posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", userId);

    if (error) {
      setErrorText(error.message);
      setDeletingPostId(null);
      return;
    }

    if (post.image_path) {
      await supabase.storage
        .from("badge-posts")
        .remove([post.image_path]);
    }

    setPosts((current) =>
      current.filter(
        (item) => item.id !== post.id
      )
    );

    setDeletingPostId(null);
  }

  if (loading) {
    return (
      <section
        style={{
          padding: "12px 16px",
          fontFamily: "Montserrat, sans-serif",
        }}
      >
        <div
          style={{
            color: "#64748b",
            fontSize: 12,
          }}
        >
          Loading badges...
        </div>
      </section>
    );
  }

  if (challenges.length === 0) {
    return null;
  }

  const expandedChallenge =
    challenges.find(
      (challenge) =>
        challenge.id === expandedChallengeId
    ) || null;

  const expandedPosts = expandedChallengeId
    ? posts.filter(
        (post) =>
          post.challenge_id === expandedChallengeId
      )
    : [];

  return (
    <section
      style={{
        marginBottom: 0,
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <style>{`
        .badges-carousel-shell {
          position: relative;
        }

        .badges-carousel {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 0 22px 2px;
          margin: 0 -22px;
          scroll-snap-type: x mandatory;
          scroll-padding-left: calc(50% - 54px);
          scroll-padding-right: calc(50% - 54px);
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .badges-carousel::-webkit-scrollbar {
          display: none;
        }

        .badges-carousel::before,
        .badges-carousel::after {
          content: "";
          flex: 0 0 max(4px, calc(50% - 54px));
        }

        .badge-carousel-card {
          flex: 0 0 109px;
          width: 109px;
          max-width: 109px;
          scroll-snap-align: center;
          transition:
            transform 0.25s ease,
            opacity 0.25s ease;
          transform: scale(0.92);
          opacity: 0.62;
        }

        .badge-carousel-card.is-active {
          transform: scale(1);
          opacity: 1;
        }

        @media (max-width: 640px) {
          .badges-carousel {
            scroll-padding-left: calc(50% - 46px);
            scroll-padding-right: calc(50% - 46px);
          }

          .badges-carousel::before,
          .badges-carousel::after {
            flex-basis: max(4px, calc(50% - 46px));
          }

          .badge-carousel-card {
            flex-basis: 93px;
            width: 93px;
            max-width: 93px;
          }
        }
      `}</style>

      <div
        style={{
          padding: "0 16px",
          marginBottom: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Badges & Challenges
        </h2>
      </div>

      <div className="badges-carousel-shell">
        <div
          ref={carouselRef}
          className="badges-carousel"
        >
          {challenges.map((challenge) => {
            const isActive =
              activeChallengeId === challenge.id;

            return (
              <button
                type="button"
                key={challenge.id}
                onClick={() =>
                  toggleBadge(challenge.id)
                }
                data-badge-card="true"
                data-challenge-id={challenge.id}
                className={`badge-carousel-card${
                  isActive ? " is-active" : ""
                }`}
                style={{
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontFamily:
                    "Montserrat, sans-serif",
                }}
              >
                <div
                  style={{
                    aspectRatio: "1 / 1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {challenge.badge_image_url ? (
                    <img
                      src={
                        challenge.badge_image_url
                      }
                      alt={challenge.title}

                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "70%",
                        height: "70%",
                        borderRadius: "50%",
                        border:
                          "1px solid #cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontSize: 22,
                      }}
                    >
                      ★
                    </div>
                  )}
                </div>

                <div
                  style={{
                    height: 52,
                    padding: "3px 2px 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    textAlign: "center",
                    color: "#0f172a",
                  }}
                >
                  <div
                    style={{
                      minHeight: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.25,
                    }}
                  >
                    {challenge.title}
                  </div>

                  {(() => {
                    const completedCount = new Set(
                      posts
                        .filter(
                          (post) =>
                            post.challenge_id === challenge.id &&
                            post.did_challenge
                        )
                        .map((post) => post.user_id)
                    ).size;

                    return (
                      <div
                        style={{
                          height: 18,
                          marginTop: 6,
                          fontSize: 9,
                          fontWeight: 500,
                          color: "#64748b",
                          lineHeight: "18px",
                        }}
                      >
                        {completedCount > 0 ? `${completedCount} completed` : ""}
                      </div>
                    );
                  })()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {expandedChallenge && (
        <div
          style={{
            marginTop: 12,
            padding: "16px",
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              maxWidth: 680,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {expandedChallenge.title}
                </h3>

                {expandedChallenge.description && (
                  <p
                    style={{
                      margin: "7px 0 0",
                      fontSize: 13,
                      color: "#64748b",
                      lineHeight: 1.55,
                    }}
                  >
                    {
                      expandedChallenge.description
                    }
                  </p>
                )}

                {expandedChallenge.goal_criteria && (
                  <div
                    style={{
                      marginTop: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#334155",
                    }}
                  >
                    {
                      expandedChallenge.goal_criteria
                    }
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setExpandedChallengeId(null)
                }
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#64748b",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: 16,
              }}
            >
              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                placeholder="Write something about this challenge..."
                rows={2}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: 12,
                  padding: 11,
                  fontFamily:
                    "Montserrat, sans-serif",
                  fontSize: 12,
                }}
              />

              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxHeight: 320,
                    marginTop: 10,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              )}

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={didChallenge}
                    onChange={(event) =>
                      setDidChallenge(
                        event.target.checked
                      )
                    }
                  />
                  I did the challenge
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <label
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border:
                        "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleFileChange
                      }
                      style={{
                        display: "none",
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={posting}
                    style={{
                      border: 0,
                      borderRadius: 999,
                      padding: "8px 14px",
                      background: "#0f172a",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: posting
                        ? "default"
                        : "pointer",
                      opacity: posting
                        ? 0.65
                        : 1,
                    }}
                  >
                    {posting
                      ? "Posting..."
                      : "Post"}
                  </button>
                </div>
              </div>
            </form>

            {errorText && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#be123c",
                }}
              >
                {errorText}
              </div>
            )}

            <div
              style={{
                marginTop: 14,
                borderTop: "1px solid #e2e8f0",
                paddingTop: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#64748b",
                }}
              >
                <span>
                  {expandedPosts.filter((post) => post.did_challenge).length} completed
                </span>

                <span>·</span>

                <button
                  type="button"
                  onClick={() => setShowCompleted((current) => !current)}
                  style={{
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    color: "#2563eb",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {showCompleted
                    ? "Hide who completed"
                    : "View who completed"}
                </button>
              </div>

              {showCompleted && (
                <div
                  style={{
                    marginTop: 10,
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  {expandedPosts.filter((post) => post.did_challenge).length === 0 ? (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                      }}
                    >
                      No one has completed this challenge yet.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {expandedPosts
                        .filter((post) => post.did_challenge)
                        .map((post) => (
                          <div
                            key={post.id}
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "flex-start",
                            }}
                          >
                            <UserAvatar
                              name={post.author_name || "Athlete"}
                              userId={post.user_id}
                              size={28}
                            />

                            <div
                              style={{
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#0f172a",
                                  }}
                                >
                                  {post.author_name || "Athlete"}
                                </span>

                                <span
                                  style={{
                                    fontSize: 9,
                                    color: "#94a3b8",
                                  }}
                                >
                                  {formatDate(post.created_at)}
                                </span>
                              </div>

                              {post.comment && (
                                <div
                                  style={{
                                    marginTop: 2,
                                    fontSize: 11,
                                    lineHeight: 1.45,
                                    color: "#475569",
                                  }}
                                >
                                  {post.comment}
                                </div>
                              )}

                              {post.image_url && (
                                <img
                                  src={post.image_url}
                                  alt="Challenge completion"
                                  style={{
                                    width: 92,
                                    height: 70,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    marginTop: 6,
                                    display: "block",
                                  }}
                                />
                              )}

                              {post.user_id === userId && (
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(post)}
                                  disabled={deletingPostId === post.id}
                                  style={{
                                    marginTop: 4,
                                    padding: 0,
                                    border: 0,
                                    background: "transparent",
                                    color: "#94a3b8",
                                    fontSize: 9,
                                    cursor: "pointer",
                                  }}
                                >
                                  {deletingPostId === post.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



