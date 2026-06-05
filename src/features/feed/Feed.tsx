import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Pin, Heart, MessageSquare, Plus, X, ChevronDown, ChevronUp,
  Megaphone, Shield, Search, ShoppingBag, Calendar, Users, Send, LogOut,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Route as AuthLayout } from "@/routes/_authenticated/route";

type PostType = "general" | "announcement" | "safety" | "lost_found" | "buy_sell" | "event";

interface Author {
  full_name: string | null;
  display_name: string | null;
  unit_number: string | null;
}
interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  image_urls: string[] | null;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: Author | null;
}
interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: Author | null;
}

const CATEGORIES = [
  { value: "all", label: "All", icon: Users, color: "text-foreground" },
  { value: "announcement", label: "Announcements", icon: Megaphone, color: "text-amber-600" },
  { value: "safety", label: "Safety", icon: Shield, color: "text-red-500" },
  { value: "lost_found", label: "Lost & Found", icon: Search, color: "text-blue-500" },
  { value: "buy_sell", label: "Buy & Sell", icon: ShoppingBag, color: "text-green-600" },
  { value: "event", label: "Events", icon: Calendar, color: "text-accent" },
] as const;

const CATEGORY_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  announcement: { label: "Announcement", bg: "bg-amber-500/10", text: "text-amber-700" },
  safety: { label: "Safety", bg: "bg-red-500/10", text: "text-red-600" },
  lost_found: { label: "Lost & Found", bg: "bg-blue-500/10", text: "text-blue-600" },
  buy_sell: { label: "Buy & Sell", bg: "bg-green-500/10", text: "text-green-700" },
  event: { label: "Event", bg: "bg-accent/10", text: "text-accent" },
  general: { label: "General", bg: "bg-muted", text: "text-muted-foreground" },
};

function authorName(a: Author | null) {
  return a?.full_name || a?.display_name || "Resident";
}
function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function AvatarInitials({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn(
      "flex items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 font-bold text-white shrink-0",
      size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
    )}>{initials}</div>
  );
}

function CommentSection({ postId, me }: { postId: string; me: { user: User; profile: Author | null } }) {
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, post_id, user_id, body, created_at, profiles:user_id(full_name, display_name, unit_number)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as Comment[]) ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("comments").insert({
        post_id: postId, user_id: me.user.id, body: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  function submit() {
    const t = body.trim();
    if (!t) return;
    create.mutate(t);
  }

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-3">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <AvatarInitials name={authorName(c.profiles)} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 rounded-xl px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">{authorName(c.profiles)}</span>
                    {c.profiles?.unit_number && <span className="text-xs text-muted-foreground">{c.profiles.unit_number}</span>}
                  </div>
                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{c.body}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <AvatarInitials name={authorName(me.profile)} size="sm" />
        <div className="flex-1 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Write a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 text-sm bg-muted/50 rounded-xl px-3 py-2 border border-border focus:outline-none focus:border-primary focus:bg-background transition-colors"
          />
          <button
            onClick={submit}
            disabled={!body.trim() || create.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, me, likedByMe }: { post: Post; me: { user: User; profile: Author | null }; likedByMe: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();
  const badge = CATEGORY_BADGE[post.type] || CATEGORY_BADGE.general;

  const like = useMutation({
    mutationFn: async () => {
      if (likedByMe) {
        const { error } = await supabase
          .from("post_likes").delete()
          .eq("post_id", post.id).eq("user_id", me.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: me.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["my-likes"] });
    },
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 border-b border-border/50 bg-primary/5 px-4 py-2">
          <Pin size={13} className="text-primary" />
          <span className="text-xs font-semibold text-primary">Pinned Post</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AvatarInitials name={authorName(post.profiles)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{authorName(post.profiles)}</span>
              {post.profiles?.unit_number && <span className="text-xs text-muted-foreground">{post.profiles.unit_number}</span>}
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
            </div>
            <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", badge.bg, badge.text)}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => like.mutate()}
            disabled={like.isPending}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors",
              likedByMe ? "text-red-500" : "text-muted-foreground hover:text-red-500",
            )}
          >
            <Heart size={18} className={likedByMe ? "fill-current" : ""} />
            <span>{post.likes_count}</span>
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageSquare size={18} />
            <span>{post.comments_count}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {expanded && <CommentSection postId={post.id} me={me} />}
      </div>
    </div>
  );
}

function CreatePostModal({ onClose, me }: { onClose: () => void; me: { user: User; profile: Author | null } }) {
  const [type, setType] = useState<PostType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").insert({
        user_id: me.user.id, type, title: title.trim(), body: body.trim(), image_urls: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Could not create post", description: e.message, variant: "destructive" }),
  });

  const typeOptions: { value: PostType; label: string }[] = [
    { value: "general", label: "General" },
    { value: "announcement", label: "Announcement" },
    { value: "safety", label: "Safety" },
    { value: "lost_found", label: "Lost & Found" },
    { value: "buy_sell", label: "Buy & Sell" },
    { value: "event", label: "Event" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Create Post</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <AvatarInitials name={authorName(me.profile)} />
            <div>
              <p className="font-semibold text-sm text-foreground">{authorName(me.profile)}</p>
              <p className="text-xs text-muted-foreground">
                {me.profile?.unit_number ? `${me.profile.unit_number} · ` : ""}Mohalla Community
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "rounded-xl py-2 px-3 text-sm font-medium border transition-all",
                    type === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50",
                  )}
                >{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="What's this about?"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-background transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Message</label>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)} rows={4}
              placeholder="Share something with your neighbors..."
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-background transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={title.trim().length < 3 || body.trim().length < 10 || create.isPending}
            className="rounded-xl"
          >
            {create.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const { user } = AuthLayout.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data: myProfile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async (): Promise<Author | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, display_name, unit_number")
        .eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", activeCategory],
    queryFn: async (): Promise<Post[]> => {
      let q = supabase
        .from("posts")
        .select("id, user_id, title, body, type, image_urls, is_pinned, likes_count, comments_count, created_at, profiles:user_id(full_name, display_name, unit_number)")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (activeCategory !== "all") q = q.eq("type", activeCategory);
      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as Post[]) ?? [];
    },
  });

  const { data: myLikes = new Set<string>() } = useQuery({
    queryKey: ["my-likes", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_likes").select("post_id").eq("user_id", user.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.post_id as string));
    },
  });

  const me = { user, profile: myProfile ?? null };

  const handleSignOut = useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate({ to: "/auth", replace: true });
  }, [navigate, qc, toast]);

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col">
        <header className="border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <span className="font-bold text-primary-foreground">م</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Mohalla</p>
                <h1 className="text-sm font-semibold leading-tight">Community Feed</h1>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-xl">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
          <nav className="mx-auto max-w-2xl flex items-center gap-1 px-6 pb-3 text-sm">
            <a href="/" className="rounded-lg px-3 py-1.5 bg-muted font-medium">Feed</a>
            <a href="/marketplace" className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-muted">Marketplace</a>
          </nav>
        </header>


        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-6 py-3">
          <div className="mx-auto max-w-2xl flex items-center gap-2 overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all shrink-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon size={14} className={active ? "" : cat.color} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1">
          <div className="p-6 max-w-2xl mx-auto space-y-4 pb-24">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <MessageSquare size={32} className="text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-foreground">No posts yet.</h3>
                <p className="text-sm text-muted-foreground mt-1">Be the first to post something!</p>
                <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl">
                  <Plus size={16} className="mr-2" /> Create Post
                </Button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} me={me} likedByMe={myLikes.has(post.id)} />
              ))
            )}
          </div>
        </main>
      </div>

      <button
        onClick={() => setShowCreate(true)}
        aria-label="Create post"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} me={me} />}
    </div>
  );
}
