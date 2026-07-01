import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch("/api/notifications");
    if (!response.ok) throw new Error("Could not load notifications.");
    const data = await response.json();
    setItems(data.notifications ?? []);
  };

  useEffect(() => {
    load().catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
  };

  const openNotification = async (item: NotificationItem) => {
    await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
    if (item.link) window.location.href = item.link;
  };

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Community updates for your account</p>
              </div>
              {items.some((item) => !item.isRead) && (
                <Button type="button" variant="outline" size="sm" onClick={markAllRead}>
                  <CheckCheck size={15} />
                  Mark all read
                </Button>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {loading ? (
                <div className="space-y-3 p-5">
                  {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-md bg-muted" />)}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Bell size={30} className="text-muted-foreground/40" />
                  <p className="mt-3 font-medium">No notifications yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">New community activity will appear here.</p>
                </div>
              ) : (
                items.map((item) => (
                  <button key={item.id} type="button" onClick={() => openNotification(item)} className={`block w-full border-b border-border px-5 py-4 text-left last:border-b-0 hover:bg-muted/40 ${item.isRead ? "" : "bg-primary/5"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-muted" : "bg-primary"}`} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{item.body}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
