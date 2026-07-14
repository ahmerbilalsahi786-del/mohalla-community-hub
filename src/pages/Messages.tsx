import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, Ban, Loader2, MessageCircle, Plus, Search, Send, User } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { canManageCommunity, useCurrentUser } from "@/hooks/use-current-user";
import {
  CommunityMember,
  MessageConversation,
  useCommunityMembers,
  useListMessageConversations,
  useMarkConversationRead,
  useMessageConversation,
  useSendConversationMessage,
  useSocietyReviewers,
  useStartConversation,
} from "@/lib/messages";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(value?: string | null) {
  if (!value) return "";
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (diff < 60) return `${Math.max(0, diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/15">
      {initials(name || "Resident")}
    </span>
  );
}

function ConversationRow({
  conversation,
  active,
}: {
  conversation: MessageConversation;
  active: boolean;
}) {
  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={cn(
        "block rounded-xl border px-3 py-3 text-left transition-all",
        active
          ? "border-primary/45 bg-primary/10 shadow-sm"
          : "border-transparent hover:border-border hover:bg-card/80",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={conversation.participant.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{conversation.participant.name}</p>
              <p className="truncate text-xs text-muted-foreground">{conversation.participant.unitNumber || "Community member"}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(conversation.lastMessageAt ?? conversation.createdAt)}</span>
          </div>
          {conversation.postTitle && (
            <p className="mt-2 truncate rounded-lg bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
              {conversation.postTitle}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {conversation.lastMessage || "No messages yet"}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-black text-primary-foreground">
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function MemberPicker({
  currentUserId,
  canSearchReviewers,
  onStart,
  busy,
}: {
  currentUserId?: string;
  canSearchReviewers: boolean;
  onStart: (member: CommunityMember, openingMessage: string) => void;
  busy: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [openingMessage, setOpeningMessage] = useState("");
  const memberSearch = query.trim();
  const { data: members = [], isLoading, isError } = useCommunityMembers(true, memberSearch);
  const {
    data: reviewers = [],
    isLoading: reviewersLoading,
    isError: reviewersError,
  } = useSocietyReviewers(canSearchReviewers, memberSearch);

  const filteredMembers = useMemo(() => {
    const needle = memberSearch.toLowerCase();
    const reviewerMembers: CommunityMember[] = reviewers.map((reviewer) => ({
      id: reviewer.userId,
      userId: reviewer.userId,
      name: reviewer.name,
      unitNumber: reviewer.unitNumber,
      status: "approved",
      role: reviewer.role,
      isVerified: true,
      communityId: reviewer.communityId,
      communityName: reviewer.communityName,
      communityLogoUrl: reviewer.communityLogoUrl,
    }));
    const uniqueMembers = new Map<string, CommunityMember>();
    [...members, ...reviewerMembers].forEach((member) => {
      const existing = uniqueMembers.get(member.userId);
      uniqueMembers.set(member.userId, existing?.communityName ? existing : member);
    });

    return [...uniqueMembers.values()]
      .filter((member) => member.userId !== currentUserId)
      .filter((member) => {
        if (!needle) return true;
        return (
          (member.name ?? "").toLowerCase().includes(needle) ||
          (member.unitNumber ?? "").toLowerCase().includes(needle)
        );
      });
  }, [currentUserId, memberSearch, members, reviewers]);

  const selectedMember = filteredMembers.find((member) => member.userId === selectedId) ?? null;

  return (
    <div className="rounded-2xl border portal-soft-rule bg-card/86 p-3 shadow-sm backdrop-blur-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={canSearchReviewers ? "Search members or society reviewers" : "Search members"}
          className="h-10 w-full rounded-xl border portal-soft-rule bg-background/70 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {isLoading || reviewersLoading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading members...
          </div>
        ) : isError || reviewersError ? (
          <p className="px-2 py-4 text-sm text-destructive">Could not load community members.</p>
        ) : filteredMembers.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">No members found.</p>
        ) : (
          filteredMembers.map((member) => (
            <button
              key={member.userId}
              type="button"
              onClick={() => setSelectedId(member.userId)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
                selectedId === member.userId ? "bg-primary/10 text-primary" : "hover:bg-muted/60",
              )}
            >
              <Avatar name={member.name} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{member.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {member.communityName
                    ? `${member.role === "admin" ? "Admin" : "Moderator"} · ${member.communityName}`
                    : member.unitNumber || "Community member"}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      <textarea
        value={openingMessage}
        onChange={(event) => setOpeningMessage(event.target.value)}
        placeholder="Opening message"
        rows={3}
        className="mt-3 w-full resize-none rounded-xl border portal-soft-rule bg-background/70 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
      />
      <Button
        type="button"
        className="mt-2 w-full rounded-xl"
        disabled={!selectedMember || busy}
        onClick={() => selectedMember && onStart(selectedMember, openingMessage)}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
        Start Chat
      </Button>
    </div>
  );
}

export default function Messages() {
  const [, params] = useRoute("/messages/:id");
  const conversationId = params?.id ?? null;
  const hasOpenConversation = Boolean(conversationId);
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState("");
  const [blocking, setBlocking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: listData, isLoading: listLoading } = useListMessageConversations();
  const { data: detail, isLoading: detailLoading } = useMessageConversation(conversationId);
  const startConversation = useStartConversation();
  const sendMessage = useSendConversationMessage();
  const markRead = useMarkConversationRead();

  const conversations = listData?.conversations ?? [];
  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      return (
        conversation.participant.name.toLowerCase().includes(needle) ||
        conversation.participant.unitNumber.toLowerCase().includes(needle) ||
        conversation.postTitle?.toLowerCase().includes(needle)
      );
    });
  }, [conversations, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [detail?.messages.length, conversationId]);

  useEffect(() => {
    if (conversationId && detail?.messages.length !== undefined) {
      markRead.mutate(conversationId);
    }
  }, [conversationId, detail?.messages.length]);

  const handleStart = (member: CommunityMember, openingMessage: string) => {
    startConversation.mutate(
      { recipientId: member.userId, openingMessage },
      {
        onSuccess: (data) => {
          setShowNew(false);
          setSearch("");
          navigate(`/messages/${data.conversation.id}`);
        },
        onError: (error: any) => {
          toast({
            title: "Could not start chat",
            description: error?.message ?? "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const submitDraft = () => {
    if (!conversationId || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    sendMessage.mutate(
      { conversationId, body },
      {
        onError: (error: any) => {
          setDraft(body);
          toast({
            title: "Could not send message",
            description: error?.message ?? "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    submitDraft();
  };

  const blockParticipant = async () => {
    const participant = detail?.conversation.participant;
    if (!participant?.userId || blocking) return;
    setBlocking(true);
    try {
      const response = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: participant.userId }),
      });
      if (!response.ok) throw new Error("Could not update block setting.");
      const result = await response.json();
      toast({
        title: result.blocked ? "Member blocked" : "Member unblocked",
        description: result.blocked ? "They will no longer be able to message you." : "They can message you again.",
      });
      navigate("/messages");
    } catch (error: any) {
      toast({ title: error?.message ?? "Could not block member", variant: "destructive" });
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-hidden p-0 pb-20 sm:p-6 sm:pb-6">
          <div className="mx-auto grid h-[calc(100dvh-8.25rem)] max-w-6xl gap-4 sm:h-[calc(100dvh-8.5rem)] lg:grid-cols-[22rem_minmax(0,1fr)]">
            <section className={cn(
              "portal-soft-rule min-h-0 flex-col overflow-hidden rounded-none border-0 bg-card/62 shadow-sm backdrop-blur-xl sm:rounded-3xl sm:border lg:flex",
              hasOpenConversation ? "hidden" : "flex",
            )}>
              <div className="border-b portal-soft-rule p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-foreground">Messages</h2>
                    <p className="text-sm text-muted-foreground">Private community chats</p>
                  </div>
                  <Button type="button" size="icon" className="rounded-xl" onClick={() => setShowNew((value) => !value)}>
                    <Plus size={18} />
                  </Button>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search chats"
                    className="h-10 w-full rounded-xl border portal-soft-rule bg-background/70 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {showNew && (
                  <div className="mb-3">
                    <MemberPicker
                      currentUserId={currentUser?.userId}
                      canSearchReviewers={canManageCommunity(currentUser?.role)}
                      busy={startConversation.isPending}
                      onStart={handleStart}
                    />
                  </div>
                )}

                {listLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-20 animate-pulse rounded-xl bg-muted/60" />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                    <MessageCircle size={32} className="text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-bold text-foreground">No private chats yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Start a direct message with a verified member.</p>
                    <Button type="button" className="mt-4 rounded-xl" onClick={() => setShowNew(true)}>
                      <Plus size={16} />
                      New Chat
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <ConversationRow
                        key={conversation.id}
                        conversation={conversation}
                        active={conversation.id === conversationId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className={cn(
              "portal-soft-rule min-h-0 flex-col overflow-hidden rounded-none border-0 bg-card/62 shadow-sm backdrop-blur-xl sm:rounded-3xl sm:border lg:flex",
              hasOpenConversation ? "flex" : "hidden",
            )}>
              {!conversationId ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <MessageCircle size={30} />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-foreground">Select a conversation</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Use private messages to continue post discussions with neighbors.
                  </p>
                </div>
              ) : detailLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading conversation...
                </div>
              ) : !detail ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <User size={30} className="text-muted-foreground/40" />
                  <p className="mt-3 font-bold text-foreground">Conversation not available</p>
                  <Link href="/messages" className="mt-3 text-sm font-semibold text-primary">Back to messages</Link>
                </div>
              ) : (
                <>
                  <div className="flex shrink-0 items-center gap-3 border-b portal-soft-rule px-4 py-3">
                    <Link href="/messages" className="flex h-9 w-9 items-center justify-center rounded-xl border portal-soft-rule bg-background/70 text-muted-foreground lg:hidden">
                      <ArrowLeft size={17} />
                    </Link>
                    <Avatar name={detail.conversation.participant.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-foreground">{detail.conversation.participant.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {detail.conversation.participant.unitNumber || "Community member"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={blockParticipant}
                      disabled={blocking}
                      className="rounded-xl text-destructive hover:bg-destructive/10"
                    >
                      {blocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban size={14} />}
                      Block
                    </Button>
                  </div>

                  {detail.conversation.postTitle && (
                    <div className="border-b portal-soft-rule bg-accent/8 px-4 py-3">
                      <p className="text-xs font-black uppercase text-accent">Post discussion</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{detail.conversation.postTitle}</p>
                    </div>
                  )}

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {detail.messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                        Start the private conversation.
                      </div>
                    ) : (
                      detail.messages.map((message) => (
                        <div key={message.id} className={cn("flex", message.isMine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm",
                              message.isMine
                                ? "bg-primary text-primary-foreground"
                                : "border portal-soft-rule bg-background/80 text-foreground",
                            )}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                            <p className={cn("mt-1 text-[11px]", message.isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSend} className="flex shrink-0 items-end gap-2 border-t portal-soft-rule bg-background/55 p-3">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          submitDraft();
                        }
                      }}
                      placeholder="Write a private message"
                      rows={1}
                      className="min-h-11 flex-1 resize-none rounded-xl border portal-soft-rule bg-card/90 px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                    <Button type="submit" size="icon-lg" className="rounded-xl" disabled={!draft.trim() || sendMessage.isPending}>
                      {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
                    </Button>
                  </form>
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
