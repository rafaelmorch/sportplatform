import type { SupabaseClient } from "@supabase/supabase-js";

export type CoachMessageRole = "user" | "coach";

export type CoachStoredMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: CoachMessageRole;
  content: string;
  created_at: string;
};

export type CoachConversationRow = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type CreateConversationResult = {
  conversation: CoachConversationRow;
};

type LoadLatestConversationResult = {
  conversation: CoachConversationRow | null;
  messages: CoachStoredMessage[];
};

export async function createCoachConversation(
  supabase: SupabaseClient,
  userId: string,
  title = "Conversa com o Coach"
): Promise<CreateConversationResult> {
  const { data, error } = await supabase
    .from("performance_ai_coach_conversations")
    .insert({
      user_id: userId,
      title,
    })
    .select("id, user_id, title, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(
      `Não foi possível criar a conversa do Coach: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("O Supabase não retornou a conversa criada.");
  }

  return {
    conversation: data as CoachConversationRow,
  };
}

export async function loadLatestCoachConversation(
  supabase: SupabaseClient,
  userId: string
): Promise<LoadLatestConversationResult> {
  const { data: conversationData, error: conversationError } =
    await supabase
      .from("performance_ai_coach_conversations")
      .select("id, user_id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (conversationError) {
    throw new Error(
      `Não foi possível carregar a conversa do Coach: ${conversationError.message}`
    );
  }

  if (!conversationData) {
    return {
      conversation: null,
      messages: [],
    };
  }

  const conversation = conversationData as CoachConversationRow;

  const { data: messagesData, error: messagesError } = await supabase
    .from("performance_ai_coach_messages")
    .select("id, conversation_id, user_id, role, content, created_at")
    .eq("conversation_id", conversation.id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(
      `Não foi possível carregar as mensagens do Coach: ${messagesError.message}`
    );
  }

  return {
    conversation,
    messages: (messagesData ?? []) as CoachStoredMessage[],
  };
}

export async function saveCoachMessage(
  supabase: SupabaseClient,
  input: {
    conversationId: string;
    userId: string;
    role: CoachMessageRole;
    content: string;
  }
): Promise<CoachStoredMessage> {
  const normalizedContent = input.content.trim();

  if (!normalizedContent) {
    throw new Error("Não é possível salvar uma mensagem vazia.");
  }

  const { data, error } = await supabase
    .from("performance_ai_coach_messages")
    .insert({
      conversation_id: input.conversationId,
      user_id: input.userId,
      role: input.role,
      content: normalizedContent,
    })
    .select("id, conversation_id, user_id, role, content, created_at")
    .single();

  if (error) {
    throw new Error(
      `Não foi possível salvar a mensagem do Coach: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("O Supabase não retornou a mensagem salva.");
  }

  const { error: updateError } = await supabase
    .from("performance_ai_coach_conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.conversationId)
    .eq("user_id", input.userId);

  if (updateError) {
    console.error(
      "A mensagem foi salva, mas a conversa não foi atualizada:",
      updateError
    );
  }

  return data as CoachStoredMessage;
}

export async function getOrCreateCoachConversation(
  supabase: SupabaseClient,
  userId: string
): Promise<LoadLatestConversationResult> {
  const existing = await loadLatestCoachConversation(supabase, userId);

  if (existing.conversation) {
    return existing;
  }

  const created = await createCoachConversation(supabase, userId);

  return {
    conversation: created.conversation,
    messages: [],
  };
}
