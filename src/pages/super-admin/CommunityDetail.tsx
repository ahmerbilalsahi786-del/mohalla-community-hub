import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Building2, FileText, ImagePlus, Loader2, Save, ShoppingBag, Trash2, UserMinus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/cloudinary";
import { SuperAdminLayout } from "./SuperAdminLayout";
import {
  deletePlatformCommunity,
  fetchPlatformCommunity,
  removePlatformCommunityAdmin,
  updatePlatformCommunityBranding,
} from "./platform-api";

const defaults = {
  themePrimaryColor: "#1B5E20",
  themeSecondaryColor: "#0288D1",
  themeBackgroundColor: "#FAFDF8",
  themeBannerColor: "#FFFFFF",
  themeSidebarColor: "#FFFFFF",
};

const colorFields = [
  { key: "themePrimaryColor", label: "Primary color" },
  { key: "themeSecondaryColor", label: "Secondary color" },
  { key: "themeBackgroundColor", label: "Background color" },
  { key: "themeBannerColor", label: "Banner color" },
  { key: "themeSidebarColor", label: "Sidebar color" },
] as const;

export default function SuperAdminCommunityDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["platform-community", id],
    queryFn: () => fetchPlatformCommunity(id),
    enabled: Boolean(id),
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [colors, setColors] = useState(defaults);
  const [uploading, setUploading] = useState(false);
  const [removeAdminOpen, setRemoveAdminOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (!data?.community) return;
    setLogoUrl(data.community.logoUrl ?? null);
    setColors({
      themePrimaryColor: data.community.themePrimaryColor ?? defaults.themePrimaryColor,
      themeSecondaryColor: data.community.themeSecondaryColor ?? defaults.themeSecondaryColor,
      themeBackgroundColor: data.community.themeBackgroundColor ?? defaults.themeBackgroundColor,
      themeBannerColor: data.community.themeBannerColor ?? defaults.themeBannerColor,
      themeSidebarColor: data.community.themeSidebarColor ?? defaults.themeSidebarColor,
    });
  }, [data]);

  const saveBranding = useMutation({
    mutationFn: () => updatePlatformCommunityBranding(id, { logoUrl, ...colors }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-community", id] });
      qc.invalidateQueries({ queryKey: ["platform-communities"] });
      toast({ title: "Community branding updated" });
    },
  });

  const removeAdmin = useMutation({
    mutationFn: () => removePlatformCommunityAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-community", id] });
      qc.invalidateQueries({ queryKey: ["platform-communities"] });
      qc.invalidateQueries({ queryKey: ["platform-dashboard"] });
      toast({ title: "Admin access removed" });
      setRemoveAdminOpen(false);
    },
  });

  const deleteCommunity = useMutation({
    mutationFn: () => deletePlatformCommunity(id, confirmName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-communities"] });
      qc.invalidateQueries({ queryKey: ["platform-dashboard"] });
      toast({ title: "Society deleted" });
      navigate("/super-admin/communities");
    },
  });

  const uploadLogo = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) setLogoUrl(url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <Button asChild variant="ghost" className="mb-4 rounded-xl">
        <Link href="/super-admin/communities"><ArrowLeft size={16} /> Back to communities</Link>
      </Button>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center"><Spinner /></div>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                    {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Building2 size={24} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-2xl font-bold text-foreground">{data.community.name}</h1>
                      <Badge>{data.community.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{data.community.area || "Area not set"} · {data.community.city || "City not set"}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Admin: {data.community.adminName} {data.community.adminEmail ? `(${data.community.adminEmail})` : ""}</p>
                  </div>
                </div>
              </div>
              {(data.community.rejectionReason || data.community.suspendedReason) && (
                <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {data.community.rejectionReason || data.community.suspendedReason}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Members", value: data.stats.members, icon: Users },
                { label: "Posts", value: data.stats.posts, icon: FileText },
                { label: "Listings", value: data.stats.listings, icon: ShoppingBag },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <Icon size={18} className="mb-3 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-lg border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <h2 className="font-semibold text-foreground">Recent posts</h2>
                </div>
                {data.recentPosts.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No posts yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.recentPosts.map((post: any) => (
                      <div key={post.id} className="p-4">
                        <p className="text-sm font-medium text-foreground">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{post.type} · {new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <h2 className="font-semibold text-foreground">Recent signups</h2>
                </div>
                {data.recentSignups.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No signups yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.recentSignups.map((profile: any) => (
                      <div key={profile.id} className="p-4">
                        <p className="text-sm font-medium text-foreground">{profile.display_name ?? profile.full_name ?? "Resident"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(profile.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-foreground">Theme customization</h2>
              <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={20} className="text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : "Upload logo"}</p>
                  <p className="text-xs text-muted-foreground">Click to choose an image</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadLogo(event.target.files?.[0])} />
              </label>

              <div className="space-y-3">
                {colorFields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</span>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
                      <input
                        type="color"
                        value={colors[field.key]}
                        onChange={(event) => setColors((current) => ({ ...current, [field.key]: event.target.value }))}
                        className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <input
                        value={colors[field.key]}
                        onChange={(event) => setColors((current) => ({ ...current, [field.key]: event.target.value }))}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>
                ))}
              </div>
              <Button className="mt-4 w-full rounded-xl" onClick={() => saveBranding.mutate()} disabled={saveBranding.isPending}>
                {saveBranding.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </Button>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-foreground">Live preview</h2>
              <div style={{ background: colors.themeBackgroundColor }} className="overflow-hidden rounded-lg border border-border">
                <div style={{ background: colors.themeBannerColor }} className="h-12 border-b border-black/10" />
                <div className="flex h-40">
                  <div style={{ background: colors.themeSidebarColor }} className="w-24 border-r border-black/10 p-3">
                    <div style={{ background: colors.themePrimaryColor }} className="mb-2 h-6 rounded" />
                    <div style={{ background: colors.themeSecondaryColor }} className="h-6 rounded" />
                  </div>
                  <div className="flex-1 p-3">
                    <div className="mb-2 h-14 rounded bg-white/80 ring-1 ring-black/10" />
                    <div className="h-10 rounded bg-white/60 ring-1 ring-black/10" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-destructive/20 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h2 className="font-semibold text-foreground">Admin controls</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Remove this society admin or delete the society from Mohalla.</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  disabled={!data.community.adminId}
                  onClick={() => setRemoveAdminOpen(true)}
                >
                  <UserMinus size={16} />
                  Remove Admin
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full justify-start rounded-xl"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 size={16} />
                  Delete Society
                </Button>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">Community not found.</div>
      )}

      <Dialog open={removeAdminOpen} onOpenChange={setRemoveAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove society admin</DialogTitle>
            <DialogDescription>
              This removes admin access from {data?.community.adminName ?? "the assigned admin"}. The society remains active.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveAdminOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => removeAdmin.mutate()} disabled={removeAdmin.isPending || !data?.community.adminId}>
              {removeAdmin.isPending ? <Spinner className="mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setConfirmName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete society</DialogTitle>
            <DialogDescription>
              This removes {data?.community.name ?? "this society"} from Mohalla and unassigns its residents. Type the society name to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="detail-delete-community-name" className="text-sm font-semibold text-foreground">
              Society name
            </label>
            <Input
              id="detail-delete-community-name"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={data?.community.name ?? "Society name"}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteCommunity.mutate()}
              disabled={deleteCommunity.isPending || !data?.community.name || confirmName.trim() !== data.community.name}
            >
              {deleteCommunity.isPending ? <Spinner className="mr-2" /> : null}
              Delete Society
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
