import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { useListMessageConversations } from "@/lib/messages";

export function MessageShortcut() {
  const { data } = useListMessageConversations();
  const unread = data?.conversations?.reduce((total, conversation) => total + conversation.unreadCount, 0) ?? 0;

  return (
    <Link href="/messages" className="relative">
      <button
        type="button"
        aria-label="Open messages"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border portal-soft-rule bg-card/90 text-muted-foreground shadow-sm transition-colors hover:bg-card hover:text-foreground"
      >
        <MessageCircle size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </Link>
  );
}
