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
  id: number | string;
  userId: string;
  name: string;
  unitNumber: string;
  avatarUrl?: string | null;
  status: string;
  role: string;
  isVerified: boolean;
  communityId?: string;
  communityName?: string;
  communityLogoUrl?: string | null;
}

export interface SocietyReviewer {
  userId: string;
  name: string;
  unitNumber: string;
  avatarUrl?: string | null;
  role: "admin" | "moderator";
  communityId: string;
  communityName: string;
  communityLogoUrl?: string | null;
}

export const messageConversationsQueryKey = ["/api/messages"] as const;

export function messageConversationQueryKey(conversationId?: string | null) {
  return ["/api/messages", conversationId ?? ""] as const;
}

export function communityMembersQueryKey() {
  return ["/api/community/members", "approved"] as const;
}

export function communityMembersSearchQueryKey(search = "") {
  return ["/api/community/members", "approved", search.trim()] as const;
}

export function societyReviewersQueryKey(search = "") {
  return ["/api/reviewers", search.trim()] as const;
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

export async function listCommunityMembers(search = "") {
  const params = new URLSearchParams({ status: "approved", limit: "200" });
  const trimmedSearch = search.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);
  return customFetch<CommunityMember[]>(`/api/community/members?${params.toString()}`, { method: "GET" });
}

export async function listSocietyReviewers(search = "") {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);
  const suffix = params.size ? `?${params.toString()}` : "";
  return customFetch<SocietyReviewer[]>(`/api/reviewers${suffix}`, { method: "GET" });
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

export function useCommunityMembers(enabled = true, search = "") {
  return useQuery({
    queryKey: communityMembersSearchQueryKey(search),
    queryFn: () => listCommunityMembers(search),
    enabled,
  });
}

export function useSocietyReviewers(enabled = true, search = "") {
  return useQuery({
    queryKey: societyReviewersQueryKey(search),
    queryFn: () => listSocietyReviewers(search),
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
