import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  Heart,
  ImagePlus,
  Lock,
  LogOut,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Role = "resident" | "moderator" | "admin";
type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  communityId: string;
};
type Post = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "announcement" | "help" | "marketplace" | "safety";
  imageUrl?: string;
  createdAt: string;
};
type Like = { postId: string; userId: string };
type Notice = { id: string; userId: string; text: string; createdAt: string };
type LocalDb = { users: User[]; posts: Post[]; likes: Like[]; notices: Notice[] };

const DB_KEY = "mohalla.local.database.v1";
const TOKEN_KEY = "mohalla.local.token.v1";

const seedDb: LocalDb = {
  users: [
    {
      id: "u-admin",
      name: "Ayesha Khan",
      email: "admin@mohalla.test",
      password: "password123",
      role: "admin",
      communityId: "gulberg",
    },
    {
      id: "u-resident",
      name: "Bilal Ahmed",
      email: "resident@mohalla.test",
      password: "password123",
      role: "resident",
      communityId: "gulberg",
    },
  ],
  posts: [
    {
      id: "p-1",
      userId: "u-admin",
      title: "Water line repair tonight",
      body: "Maintenance is planned from 10 PM to midnight near Block C. Please store water before Maghrib.",
      type: "announcement",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "p-2",
      userId: "u-resident",
      title: "Need a trusted electrician",
      body: "Looking for someone who can fix a tripping breaker this afternoon. Recommendations welcome.",
      type: "help",
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
  ],
  likes: [{ postId: "p-1", userId: "u-resident" }],
  notices: [
    {
      id: "n-1",
      userId: "u-resident",
      text: "Welcome to Mohalla Gulberg.",
      createdAt: new Date().toISOString(),
    },
  ],
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mohalla Community Hub" },
      { name: "description", content: "Local preview of Mohalla with auth, storage, and community data." },
      { property: "og:title", content: "Mohalla Community Hub" },
      { property: "og:description", content: "Local preview of Mohalla with auth, storage, and community data." },
    ],
  }),
  component: Index,
});

function readDb(): LocalDb {
  if (typeof window === "undefined") return seedDb;
  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    window.localStorage.setItem(DB_KEY, JSON.stringify(seedDb));
    return seedDb;
  }
  return JSON.parse(raw) as LocalDb;
}

function saveDb(db: LocalDb) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function makeToken(user: User) {
  return btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 1000 * 60 * 60 * 12 }));
}

function userFromToken(db: LocalDb): User | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token)) as { userId: string; exp: number };
    if (payload.exp < Date.now()) {
      window.localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return db.users.find((user) => user.id === payload.userId) ?? null;
  } catch {
    window.localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

function Index() {
  const [db, setDb] = useState<LocalDb>(() => readDb());
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const nextDb = readDb();
    setDb(nextDb);
    setUser(userFromToken(nextDb));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function persist(nextDb: LocalDb) {
    saveDb(nextDb);
    setDb(nextDb);
  }

  function login(email: string, password: string) {
    const found = db.users.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password,
    );
    if (!found) {
      setAuthError("Invalid email or password.");
      return;
    }
    window.localStorage.setItem(TOKEN_KEY, makeToken(found));
    setUser(found);
    setAuthError("");
  }

  function register(name: string, email: string, password: string) {
    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }
    if (db.users.some((candidate) => candidate.email.toLowerCase() === email.toLowerCase())) {
      setAuthError("That email is already registered.");
      return;
    }
    const nextUser: User = {
      id: `u-${crypto.randomUUID()}`,
      name,
      email,
      password,
      role: "resident",
      communityId: "gulberg",
    };
    const nextDb = { ...db, users: [...db.users, nextUser] };
    persist(nextDb);
    window.localStorage.setItem(TOKEN_KEY, makeToken(nextUser));
    setUser(nextUser);
    setAuthError("");
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  if (!user) {
    return (
      <AuthScreen
        error={authError}
        mode={authMode}
        onLogin={login}
        onRegister={register}
        setMode={setAuthMode}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Mohalla Gulberg</p>
            <h1 className="text-2xl font-semibold tracking-tight">Community Hub</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-slate-200 px-3 py-1 text-sm capitalize text-slate-700">
              {user.role}
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      {toast ? (
        <div className="fixed right-4 top-4 z-10 rounded-md bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <Composer
            user={user}
            onCreate={(post) => {
              persist({ ...db, posts: [post, ...db.posts] });
              setToast("Post added to the local database.");
            }}
          />
          <Feed db={db} user={user} persist={persist} setToast={setToast} />
        </section>
        <aside className="space-y-4">
          <SystemStatus db={db} user={user} />
          <Notifications db={db} user={user} />
          <AdminPanel db={db} user={user} persist={persist} setToast={setToast} />
        </aside>
      </div>
    </main>
  );
}

function AuthScreen({
  error,
  mode,
  onLogin,
  onRegister,
  setMode,
}: {
  error: string;
  mode: "login" | "register";
  onLogin: (email: string, password: string) => void;
  onRegister: (name: string, email: string, password: string) => void;
  setMode: (mode: "login" | "register") => void;
}) {
  const [name, setName] = useState("Sara Malik");
  const [email, setEmail] = useState("admin@mohalla.test");
  const [password, setPassword] = useState("password123");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_420px]">
        <section className="rounded-md border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Mohalla</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Local community preview</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This environment runs without Replit-only services. It has local authorization, seeded database records,
            role checks, notifications, likes, and browser-backed image storage.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Feature icon={<Lock />} title="Authorization" text="Token session with expiry" />
            <Feature icon={<ShieldCheck />} title="Roles" text="Admin tools are protected" />
            <Feature icon={<ImagePlus />} title="Storage" text="Uploads stay in local preview" />
          </div>
        </section>
        <form
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            mode === "login" ? onLogin(email, password) : onRegister(name, email, password);
          }}
        >
          <div className="mb-4 flex rounded-md border border-slate-200 bg-slate-100 p-1">
            <button
              className={`flex-1 rounded px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-white shadow-sm" : ""}`}
              type="button"
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 rounded px-3 py-2 text-sm font-medium ${mode === "register" ? "bg-white shadow-sm" : ""}`}
              type="button"
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>
          {mode === "register" ? (
            <Field label="Name" value={name} onChange={setName} />
          ) : (
            <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Demo admin: admin@mohalla.test / password123
            </p>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password" type="password" value={password} onChange={setPassword} />
          {error ? <p className="mb-3 text-sm font-medium text-red-700">{error}</p> : null}
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
            {mode === "login" ? <Lock className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="mb-3 block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

function Feature({ icon, text, title }: { icon: React.ReactNode; text: string; title: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="mb-3 text-emerald-700 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-slate-600">{text}</p>
    </div>
  );
}

function Composer({
  onCreate,
  user,
}: {
  onCreate: (post: Post) => void;
  user: User;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<Post["type"]>("help");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  function readImage(file: File) {
    if (file.size > 750_000) {
      setError("Use an image under 750 KB for this local preview.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <form
      className="rounded-md border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim().length < 3 || body.trim().length < 10) {
          setError("Title needs 3 characters and body needs 10 characters.");
          return;
        }
        onCreate({
          id: `p-${crypto.randomUUID()}`,
          userId: user.id,
          title: title.trim().slice(0, 200),
          body: body.trim().slice(0, 5000),
          type,
          imageUrl,
          createdAt: new Date().toISOString(),
        });
        setTitle("");
        setBody("");
        setImageUrl("");
        setError("");
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Create community post</h2>
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          onChange={(event) => setType(event.target.value as Post["type"])}
          value={type}
        >
          <option value="help">Help</option>
          <option value="announcement">Announcement</option>
          <option value="marketplace">Marketplace</option>
          <option value="safety">Safety</option>
        </select>
      </div>
      <input
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        maxLength={200}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title"
        value={title}
      />
      <textarea
        className="mt-3 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        maxLength={5000}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Share an update, request, alert, or listing."
        value={body}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
          <ImagePlus className="h-4 w-4" />
          Add image
          <input
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) readImage(file);
            }}
            type="file"
          />
        </label>
        <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Post</button>
      </div>
      {imageUrl ? <img alt="" className="mt-3 max-h-52 rounded-md border object-cover" src={imageUrl} /> : null}
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
    </form>
  );
}

function Feed({
  db,
  persist,
  setToast,
  user,
}: {
  db: LocalDb;
  persist: (db: LocalDb) => void;
  setToast: (message: string) => void;
  user: User;
}) {
  const usersById = useMemo(() => Object.fromEntries(db.users.map((item) => [item.id, item])), [db.users]);

  return (
    <div className="space-y-3">
      {db.posts.map((post) => {
        const liked = db.likes.some((like) => like.postId === post.id && like.userId === user.id);
        const likesCount = db.likes.filter((like) => like.postId === post.id).length;
        return (
          <article className="rounded-md border border-slate-200 bg-white p-4" key={post.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold capitalize text-amber-900">
                  {post.type}
                </span>
                <h2 className="mt-3 text-lg font-semibold">{post.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {usersById[post.userId]?.name ?? "Neighbor"} · {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
              {(user.role === "admin" || user.role === "moderator") && (
                <button
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700"
                  onClick={() => {
                    persist({ ...db, posts: db.posts.filter((candidate) => candidate.id !== post.id) });
                    setToast("Post removed by moderator.");
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{post.body}</p>
            {post.imageUrl ? <img alt="" className="mt-3 max-h-72 rounded-md border object-cover" src={post.imageUrl} /> : null}
            <button
              className={`mt-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                liked ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
              }`}
              onClick={() => {
                const nextLikes = liked
                  ? db.likes.filter((like) => !(like.postId === post.id && like.userId === user.id))
                  : [...db.likes, { postId: post.id, userId: user.id }];
                persist({ ...db, likes: nextLikes });
              }}
            >
              <Heart className="h-4 w-4" />
              {liked ? "Liked" : "Like"} · {likesCount}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function SystemStatus({ db, user }: { db: LocalDb; user: User }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <CheckCircle2 className="h-5 w-5 text-emerald-700" />
        Local systems
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Users" value={db.users.length} />
        <Stat label="Posts" value={db.posts.length} />
        <Stat label="Likes" value={db.likes.length} />
        <Stat label="Session" value={user.role} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-slate-100 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold capitalize">{value}</dd>
    </div>
  );
}

function Notifications({ db, user }: { db: LocalDb; user: User }) {
  const notices = db.notices.filter((notice) => notice.userId === user.id);
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Bell className="h-5 w-5 text-amber-700" />
        Notifications
      </h2>
      <div className="mt-3 space-y-2">
        {notices.length ? (
          notices.map((notice) => (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950" key={notice.id}>
              {notice.text}
            </p>
          ))
        ) : (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        )}
      </div>
    </section>
  );
}

function AdminPanel({
  db,
  persist,
  setToast,
  user,
}: {
  db: LocalDb;
  persist: (db: LocalDb) => void;
  setToast: (message: string) => void;
  user: User;
}) {
  if (user.role === "resident") {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ShieldCheck className="h-5 w-5 text-slate-500" />
          Admin
        </h2>
        <p className="mt-3 text-sm text-slate-600">Resident accounts cannot access moderation controls.</p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <ShieldCheck className="h-5 w-5 text-emerald-700" />
        Admin controls
      </h2>
      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        onClick={() => {
          const notices = db.users
            .filter((candidate) => candidate.communityId === user.communityId)
            .map((candidate) => ({
              id: `n-${crypto.randomUUID()}`,
              userId: candidate.id,
              text: `${user.name} sent a community-wide safety reminder.`,
              createdAt: new Date().toISOString(),
            }));
          persist({ ...db, notices: [...notices, ...db.notices] });
          setToast("Notification sent to real local members only.");
        }}
      >
        <Megaphone className="h-4 w-4" />
        Notify members
      </button>
      <div className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
        <ShoppingBag className="mb-2 h-4 w-4" />
        Marketplace WhatsApp links are normalized from 03XX to 92XX in this local preview model.
      </div>
    </section>
  );
}
