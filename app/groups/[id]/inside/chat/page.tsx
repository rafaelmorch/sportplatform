"use client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import UserAvatar from "@/components/UserAvatar";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackArrow from "@/components/BackArrow";
import { supabaseBrowser } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type CommunityRow = {
  id: string;
  name: string | null;
  created_by: string | null;
};

type ChatRow = {
  id: string;
  community_id: string;
  user_id: string;
  message: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type ChatReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
};

function getDisplayName(name: string | null | undefined): string {
  return name?.trim() || "Athlete";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatMessageTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const sameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== today.getFullYear()
        ? "numeric"
        : undefined,
  });
}

export default function MembershipChatPage() {
  const supabase = useMemo(() => supabaseBrowser, []);
  const router = useRouter();
  const params = useParams();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const communityId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [communityName, setCommunityName] = useState("Community");
  const [userId, setUserId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  const [text, setText] = useState("");
  const [openReactionMessageId, setOpenReactionMessageId] = useState<
    string | null
  >(null);

  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [sending, setSending] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });
    });
  }, []);

  const fetchReactions = useCallback(
    async (messageIds: string[]) => {
      if (messageIds.length === 0) {
        setReactions([]);
        return;
      }

      const { data, error } = await supabase
        .from("app_membership_chat_reactions")
        .select("id, message_id, user_id, emoji")
        .in("message_id", messageIds);

      if (error) {
        console.error("Error loading chat reactions:", error);
        return;
      }

      setReactions((data as ChatReaction[]) ?? []);
    },
    [supabase]
  );
  const fetchMessages = useCallback(
    async (currentCommunityId: string, behavior: ScrollBehavior = "smooth") => {
      const { data: rows, error } = await supabase
        .from("app_membership_chat_messages")
        .select("id, community_id, user_id, message, created_at")
        .eq("community_id", currentCommunityId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading membership chat:", error);
        setErrorMessage("We could not load the messages.");
        return;
      }

      const typedRows = (rows as ChatRow[]) ?? [];

      setMessages(typedRows);
      setErrorMessage(null);

      await fetchReactions(
        typedRows.map((message) => message.id)
      );

      const userIds = Array.from(
        new Set(
          typedRows
            .map((message) => message.user_id)
            .filter(Boolean)
        )
      );

      if (userIds.length === 0) {
        setProfilesMap({});
        scrollToBottom(behavior);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error loading chat profiles:", profilesError);
      }

      const nextProfilesMap: Record<string, string> = {};

      ((profiles as ProfileRow[]) ?? []).forEach((profile) => {
        nextProfilesMap[profile.id] = getDisplayName(profile.full_name);
      });

      setProfilesMap(nextProfilesMap);
      scrollToBottom(behavior);
    },
    [fetchReactions, scrollToBottom, supabase]
  );

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setErrorMessage(null);

        if (!communityId || typeof communityId !== "string") {
          router.replace("/groups");
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error loading chat user:", userError);
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: community, error: communityError } = await supabase
          .from("app_membership_communities")
          .select("id, name, created_by")
          .eq("id", communityId)
          .single();

        if (communityError || !community) {
          console.error("Error loading chat community:", communityError);
          router.replace("/groups");
          return;
        }

        const typedCommunity = community as CommunityRow;
        const isCreator = typedCommunity.created_by === user.id;

        if (!isCreator) {
          const { data: request, error: requestError } = await supabase
            .from("app_membership_requests")
            .select("status, subscription_status")
            .eq("community_id", communityId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (requestError) {
            console.error("Error validating chat membership:", requestError);
          }

          const membershipAllowed =
            request &&
            ["approved", "active"].includes(request.status) &&
            (
              !request.subscription_status ||
              ["active", "trialing"].includes(request.subscription_status)
            );

          if (!membershipAllowed) {
            router.replace(`/groups/${communityId}`);
            return;
          }
        }

        if (!active) return;

        setUserId(user.id);
        setCommunityName(typedCommunity.name?.trim() || "Community");
        setAllowed(true);

        await fetchMessages(communityId, "auto");
      } catch (error) {
        console.error("Unexpected chat loading error:", error);

        if (active) {
          setErrorMessage("We could not open the community chat.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [communityId, fetchMessages, router, supabase]);

  useEffect(() => {
    if (
      !allowed ||
      !communityId ||
      typeof communityId !== "string"
    ) {
      return;
    }

    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_membership_chat_messages",
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          fetchMessages(communityId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_membership_chat_reactions",
        },
        (payload) => {
          console.log("REACTION REALTIME EVENT:", payload);

          if (payload.eventType === "DELETE") {
            const deletedReaction =
              payload.old as Partial<ChatReaction>;

            if (deletedReaction.id) {
              setReactions((current) =>
                current.filter(
                  (reaction) =>
                    reaction.id !== deletedReaction.id
                )
              );
            }

            return;
          }

          const incomingReaction =
            payload.new as ChatReaction;

          setReactions((current) => {
            const existingIndex = current.findIndex(
              (reaction) =>
                reaction.message_id === incomingReaction.message_id &&
                reaction.user_id === incomingReaction.user_id
            );

            if (existingIndex === -1) {
              return [...current, incomingReaction];
            }

            return current.map((reaction) =>
              reaction.message_id === incomingReaction.message_id &&
              reaction.user_id === incomingReaction.user_id
                ? incomingReaction
                : reaction
            );
          });
        }
      )
      .subscribe((status) => {
        console.log("CHAT REALTIME STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [allowed, communityId, fetchMessages, supabase]);

  async function sendMessage() {
    const message = text.trim();

    if (
      !message ||
      !communityId ||
      typeof communityId !== "string" ||
      !userId ||
      sending
    ) {
      return;
    }

    setSending(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("app_membership_chat_messages")
      .insert({
        community_id: communityId,
        user_id: userId,
        message,
      });

    if (error) {
      console.error("Error sending chat message:", error);
      setErrorMessage("Your message could not be sent.");
      setSending(false);
      return;
    }

    setText("");
    setSending(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "46px";
      textareaRef.current.focus();
    }

    await fetchMessages(communityId);
  }

  async function toggleReaction(
    messageId: string,
    emoji: string
  ) {
    if (!userId) {
      return;
    }

    const existingReaction = reactions.find(
      (reaction) =>
        reaction.message_id === messageId &&
        reaction.user_id === userId
    );

    if (existingReaction?.emoji === emoji) {
      const { error } = await supabase
        .from("app_membership_chat_reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (error) {
        console.error("Error removing chat reaction:", error);
        return;
      }
    } else {
      const { error } = await supabase
        .from("app_membership_chat_reactions")
        .upsert(
          {
            message_id: messageId,
            user_id: userId,
            emoji,
          },
          {
            onConflict: "message_id,user_id",
          }
        );

      if (error) {
        console.error("Error saving chat reaction:", error);
        return;
      }
    }

    setOpenReactionMessageId(null);

    await fetchReactions(
      messages.map((message) => message.id)
    );
  }
  function handleTextareaChange(
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    setText(event.target.value);

    event.target.style.height = "46px";
    event.target.style.height = `${Math.min(
      event.target.scrollHeight,
      120
    )}px`;
  }

  if (loading) {
    return (
      <main className="chat-loading-page">
        <div className="chat-loading-card">
          <div className="chat-spinner" />
          <span>Opening chat...</span>
        </div>

        <style jsx>{`
          .chat-loading-page {
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: max(24px, env(safe-area-inset-top))
              max(20px, env(safe-area-inset-right))
              max(24px, env(safe-area-inset-bottom))
              max(20px, env(safe-area-inset-left));
            background: #f7f8fa;
            font-family: "Montserrat", Arial, sans-serif;
          }

          .chat-loading-card {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #475569;
            font-size: 14px;
            font-weight: 600;
          }

          .chat-spinner {
            width: 22px;
            height: 22px;
            border: 3px solid #dbe3ee;
            border-top-color: #14213d;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  let previousDate = "";

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <div className="back-button">
            <BackArrow href={`/groups/${communityId}/inside`} />
          </div>

          <div className="header-copy">
            <p className="eyebrow">{communityName}</p>
            <h1>Community Chat</h1>
            <p className="subtitle">
              Connect, share your training and support other athletes.
            </p>
          </div>
        </header>

        <section className="community-card">
          <div className="community-icon" aria-hidden="true">
            <span>PS</span>
          </div>

          <div>
            <h2>Member conversation</h2>
            <p>
              Share updates, ask questions and encourage your community.
            </p>
          </div>
        </section>

        <section
          className="messages-panel"
          aria-label="Community messages"
        >
          {errorMessage && (
            <div className="error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                💬
              </div>

              <h2>Start the conversation</h2>

              <p>
                Be the first member to share an update with the community.
              </p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => {
                const mine = message.user_id === userId;
                const author = mine
                  ? "You"
                  : getDisplayName(profilesMap[message.user_id]);

                const currentDate = formatMessageDate(
                  message.created_at
                );

                const showDate = currentDate !== previousDate;
                previousDate = currentDate;

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="date-divider">
                        <span>{currentDate}</span>
                      </div>
                    )}

                    <article
                      className={`message-row ${
                        mine ? "message-row-mine" : ""
                      }`}
                    >
                      {!mine && (
                        <UserAvatar
                          name={author}
                          userId={message.user_id}
                          size={36}
                        />
                      )}

                      <div
                        className={`message-card ${
                          mine ? "message-card-mine" : ""
                        }`}
                      >
                        <div className="message-meta">
                          <span className="message-author">
                            {author}
                          </span>

                          <time dateTime={message.created_at}>
                            {formatMessageTime(message.created_at)}
                          </time>
                        </div>

                        <p>{message.message}</p>

                        <div className="reaction-picker-wrapper">
                          {Array.from(
                            new Set(
                              reactions
                                .filter(
                                  (reaction) =>
                                    reaction.message_id === message.id
                                )
                                .map((reaction) => reaction.emoji)
                            )
                          ).map((emoji) => {
                            const emojiReactions = reactions.filter(
                              (reaction) =>
                                reaction.message_id === message.id &&
                                reaction.emoji === emoji
                            );

                            const reactedByMe = emojiReactions.some(
                              (reaction) =>
                                reaction.user_id === userId
                            );

                            return (
                              <button
                                key={emoji}
                                type="button"
                                className={`selected-reaction ${
                                  reactedByMe
                                    ? "selected-reaction-mine"
                                    : ""
                                }`}
                                aria-label={`React with ${emoji}`}
                                title={
                                  reactedByMe
                                    ? "Remove your reaction"
                                    : `React with ${emoji}`
                                }
                                onClick={() =>
                                  toggleReaction(message.id, emoji)
                                }
                              >
                                <span>{emoji}</span>

                                {emojiReactions.length > 1 && (
                                  <span>
                                    {emojiReactions.length}
                                  </span>
                                )}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            className="reaction-trigger"
                            aria-label="Add reaction"
                            title="Add reaction"
                            aria-expanded={
                              openReactionMessageId === message.id
                            }
                            onClick={() =>
                              setOpenReactionMessageId((current) =>
                                current === message.id
                                  ? null
                                  : message.id
                              )
                            }
                          >
                            +
                          </button>

                          <div
                            className={`reaction-picker ${
                              openReactionMessageId === message.id
                                ? "reaction-picker-open"
                                : ""
                            }`}
                          >
                            {["💪", "🔥", "👏", "❤️", "🎯", "🏃"].map(
                              (emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="reaction-option"
                                  aria-label={`React with ${emoji}`}
                                  title={`React with ${emoji}`}
                                  onClick={() =>
                                    toggleReaction(message.id, emoji)
                                  }
                                >
                                  {emoji}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        <footer className="composer-area">
          <div className="composer">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextareaChange}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              maxLength={2000}
              aria-label="Message"
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !text.trim()}
              aria-label="Send message"
            >
              {sending ? (
                <span className="button-spinner" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M21.2 2.8 3.7 9.4c-.9.3-.9 1.6 0 1.9l7.1 2.4 2.4 7.1c.3.9 1.6.9 1.9 0l6.6-17.5c.3-.8-.5-1.6-1.3-1.3Z"
                    fill="currentColor"
                  />
                  <path
                    d="m10.8 13.7 5.4-5.4"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>

          <p className="composer-help">
            Press Enter to send. Use Shift + Enter for a new line.
          </p>
        </footer>
      </section>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          width: 100%;
          min-height: 100%;
          overflow-x: hidden;
          background: #f7f8fa;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .chat-page {
          width: 100%;
          min-height: 100dvh;
          padding-top: max(14px, env(safe-area-inset-top));
          padding-right: max(14px, env(safe-area-inset-right));
          padding-bottom: max(14px, env(safe-area-inset-bottom));
          padding-left: max(14px, env(safe-area-inset-left));
          background:
            radial-gradient(
              circle at top right,
              rgba(37, 99, 235, 0.08),
              transparent 32%
            ),
            #f7f8fa;
          color: #111827;
          font-family: "Montserrat", Arial, sans-serif;
        }

        .chat-shell {
          width: 100%;
          max-width: 920px;
          min-height: calc(
            100dvh -
              max(14px, env(safe-area-inset-top)) -
              max(14px, env(safe-area-inset-bottom))
          );
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 4px 2px 18px;
        }

        .back-button {
          flex: 0 0 auto;
          padding-top: 2px;
        }

        .header-copy {
          min-width: 0;
        }

        .eyebrow {
          margin: 0 0 4px;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          overflow-wrap: anywhere;
        }

        h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(25px, 5vw, 34px);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.035em;
        }

        .subtitle {
          max-width: 620px;
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.55;
        }

        .community-card {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
        }

        .community-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #14213d;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .community-card h2 {
          margin: 0 0 4px;
          color: #172033;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.35;
        }

        .community-card p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
        }

        .messages-panel {
          flex: 1 1 auto;
          min-height: 320px;
          max-height: calc(100dvh - 340px);
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.07);
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .date-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 8px 0;
        }

        .date-divider span {
          padding: 6px 11px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #f8fafc;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .message-row {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 9px;
        }

        .message-row-mine {
          justify-content: flex-end;
        }

        .avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          margin-top: 2px;
          border-radius: 50%;
          background: #e8eef8;
          color: #14213d;
          font-size: 11px;
          font-weight: 700;
        }

        .message-card {
          width: fit-content;
          max-width: min(78%, 620px);
          padding: 11px 13px;
          border: 1px solid #e2e8f0;
          border-radius: 5px 17px 17px 17px;
          background: #ffffff;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.05);
        }

        .message-card-mine {
          border-color: #cddaf5;
          border-radius: 17px 5px 17px 17px;
          background: #edf3ff;
        }

        .message-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 5px;
        }

        .message-author {
          color: #172033;
          font-size: 11px;
          font-weight: 700;
        }

        .message-meta time {
          color: #94a3b8;
          font-size: 9px;
          font-weight: 600;
          white-space: nowrap;
        }

        .message-card p {
          margin: 0;
          color: #263244;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .message-card {
          position: relative;
          overflow: visible;
        }

        .reaction-picker-wrapper {
          position: absolute;
          right: 8px;
          bottom: -12px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 4px;
          width: max-content;
          margin: 0;
        }

        .message-row:not(.message-row-mine)
          .reaction-picker-wrapper {
          right: auto;
          left: 8px;
        }

        .reaction-trigger {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 24px;
          padding: 0;
          border: 1px solid #d8e1ec;
          border-radius: 999px;
          background: #ffffff;
          color: #53647a;
          box-shadow: 0 3px 10px rgba(31, 45, 61, 0.1);
          font-family: Montserrat, sans-serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 1;
          cursor: pointer;
        }

        .reaction-trigger:hover {
          background: #f5f8fc;
          border-color: #b9c7d8;
        }

        .reaction-trigger:active {
          transform: scale(0.94);
        }

        .selected-reaction {
          min-width: 30px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          border: 1px solid #cbdaf0;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 3px 10px rgba(31, 45, 61, 0.1);
          font-size: 15px;
          line-height: 1;
          cursor: pointer;
        }

        .reaction-picker {
          position: absolute;
          right: 0;
          bottom: calc(100% + 8px);
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 5px;
          border: 1px solid #dbe4ef;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 10px 28px rgba(31, 45, 61, 0.16);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(5px) scale(0.97);
          transform-origin: bottom right;
          transition:
            opacity 140ms ease,
            visibility 140ms ease,
            transform 140ms ease;
        }

        .message-row:not(.message-row-mine) .reaction-picker {
          right: auto;
          left: 0;
          transform-origin: bottom left;
        }

        .reaction-picker-open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }

        .reaction-option {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 30px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          font-size: 17px;
          line-height: 1;
          cursor: pointer;
        }

        .reaction-option:hover {
          background: #eef4fb;
          transform: scale(1.1);
        }

        .reaction-option:active {
          transform: scale(0.94);
        }
        .empty-state {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          text-align: center;
        }

        .empty-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          border-radius: 18px;
          background: #edf3ff;
          font-size: 25px;
        }

        .empty-state h2 {
          margin: 0 0 7px;
          color: #172033;
          font-size: 17px;
          font-weight: 700;
        }

        .empty-state p {
          max-width: 330px;
          margin: 0;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.55;
        }

        .error-message {
          margin-bottom: 12px;
          padding: 11px 13px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fff1f2;
          color: #b42318;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.45;
        }

        .composer-area {
          padding-top: 12px;
        }

        .composer {
          display: flex;
          align-items: flex-end;
          gap: 9px;
          padding: 8px;
          border: 1px solid #dce4ef;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.08);
        }

        textarea {
          width: 100%;
          min-width: 0;
          height: 46px;
          min-height: 46px;
          max-height: 120px;
          resize: none;
          overflow-y: auto;
          padding: 13px 14px 11px;
          border: 0;
          outline: none;
          border-radius: 13px;
          background: #f6f8fb;
          color: #172033;
          font-family: "Montserrat", Arial, sans-serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.35;
        }

        textarea::placeholder {
          color: #94a3b8;
        }

        .composer button {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 14px;
          background: #14213d;
          color: #ffffff;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            opacity 0.16s ease,
            background 0.16s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .composer button:not(:disabled):active {
          transform: scale(0.95);
        }

        .composer button:disabled {
          cursor: default;
          opacity: 0.38;
        }

        .composer button svg {
          width: 21px;
          height: 21px;
        }

        .button-spinner {
          width: 19px;
          height: 19px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        .composer-help {
          margin: 7px 5px 0;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 500;
          text-align: right;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .chat-page {
            padding-top: max(10px, env(safe-area-inset-top));
            padding-right: max(10px, env(safe-area-inset-right));
            padding-bottom: max(10px, env(safe-area-inset-bottom));
            padding-left: max(10px, env(safe-area-inset-left));
          }

          .chat-header {
            gap: 10px;
            padding-bottom: 14px;
          }

          .subtitle {
            font-size: 12px;
          }

          .community-card {
            padding: 13px;
            border-radius: 16px;
          }

          .community-icon {
            width: 42px;
            height: 42px;
            flex-basis: 42px;
          }

          .messages-panel {
            min-height: 300px;
            max-height: calc(100dvh - 320px);
            padding: 12px;
            border-radius: 17px;
          }

          .message-card {
            max-width: 84%;
          }

          .composer-help {
            display: none;
          }
        }

        @media (max-height: 700px) {
          .community-card {
            display: none;
          }

          .messages-panel {
            max-height: calc(100dvh - 225px);
          }
        }
      `}</style>
    </main>
  );
}



















