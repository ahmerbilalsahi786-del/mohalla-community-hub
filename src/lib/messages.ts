import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/lib/custom-fetch";

export interface MessageParticipant {
  userId: string;
  name: string;
  unitNumber: string;
  avatarUrl?: string | null;
}

export interface MessageConversation {
  id: string;
  participant: MessageParticipant;
  postId?: string | null;
  postTitle?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  isMine: boolean;
}

export interface MessageConversationDetail {
  conversation: MessageConversation;
  messages: ConversationMessage[];
}

export interface StartConversationInput {
  recipientId: string;
  postId?: string | number | null;
  openingMessage?: string;
}

export interface SendMessageInput {
  conversationId: string;
  body: string;
}

export interface CommunityMember {
  id: number;
  userId: string;
  name: string;
  unitNumber: string;
  status: string;
  role: string;
  isVerified: boolean;
}

export const messageConversationsQueryKey = ["/api/messages"] as const;

export function messageConversationQueryKey(conversationId?: string | null) {
  return ["/api/messages", conversationId ?? ""] as const;
}

export function communityMembersQueryKey() {
  return ["/api/community/members", "approved"] as const;
}

export async function listMessageConversations() {
  return customFetch<{ conversations: MessageConversation[] }>("/api/messages", { method: "GET" });
}

export async function getMessageConversation(conversationId: string) {
  return customFetch<MessageConversationDetail>(`/api/messages/${conversationId}`, { method: "GET" });
}

export async function startConversation(input: StartConversationInput) {
  return customFetch<MessageConversationDetail>("/api/messages/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      postId: input.postId == null ? null : String(input.postId),
    }),
  });
}

export async function sendConversationMessage(input: SendMessageInput) {
  return customFetch<ConversationMessage>(`/api/messages/${input.conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: input.body }),
  });
}

export async function markConversationRead(conversationId: string) {
  return customFetch<{ ok: boolean }>(`/api/messages/${conversationId}/read`, { method: "POST" });
}

export async function listCommunityMembers() {
  return customFetch<CommunityMember[]>("/api/community/members?status=approved&limit=200", { method: "GET" });
}

export function useListMessageConversations() {
  return useQuery({
    queryKey: messageConversationsQueryKey,
    queryFn: listMessageConversations,
    refetchInterval: 30000,
  });
}

export function useMessageConversation(conversationId?: string | null) {
  return useQuery({
    queryKey: messageConversationQueryKey(conversationId),
    queryFn: () => getMessageConversation(conversationId ?? ""),
    enabled: Boolean(conversationId),
    refetchInterval: conversationId ? 10000 : false,
  });
}

export function useCommunityMembers(enabled = true) {
  return useQuery({
    queryKey: communityMembersQueryKey(),
    queryFn: listCommunityMembers,
    enabled,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startConversation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: messageConversationsQueryKey });
      queryClient.invalidateQueries({ queryKey: messageConversationQueryKey(data.conversation.id) });
    },
  });
}

export function useSendConversationMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendConversationMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: messageConversationsQueryKey });
      queryClient.invalidateQueries({ queryKey: messageConversationQueryKey(variables.conversationId) });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markConversationRead,
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: messageConversationsQueryKey });
      queryClient.invalidateQueries({ queryKey: messageConversationQueryKey(conversationId) });
    },
  });
}
