import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Palette, RotateCcw, Save, Upload } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import {
  getAdminGetCommunityQueryKey,
  useAdminGetCommunity,
  useAdminUpdateCommunity,
} from "@/lib/generated/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { COMMUNITY_THEME_CHANGE_EVENT } from "@/lib/theme";

const defaults = {
  themePrimaryColor: "#1B5E20",
  themeSecondaryColor: "#0288D1",
  themeBackgroundColor: "#FAFDF8",
  themeBannerColor: "#FFFFFF",
  themeSidebarColor: "#FFFFFF",
};

const colorFields = [
  { key: "themePrimaryColor", label: "Primary Color" },
  { key: "themeSecondaryColor", label: "Secondary Color" },
  { key: "themeBackgroundColor", label: "Background Color" },
  { key: "themeBannerColor", label: "Top Banner Color" },
  { key: "themeSidebarColor", label: "Sidebar Color" },
] as const;

export default function AdminBranding() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useAdminGetCommunity({ communityId: "default" });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [colors, setColors] = useState(defaults);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setLogoUrl(settings.logoUrl ?? null);
    setColors({
      themePrimaryColor: settings.themePrimaryColor ?? defaults.themePrimaryColor,
      themeSecondaryColor: settings.themeSecondaryColor ?? defaults.themeSecondaryColor,
      themeBackgroundColor: settings.themeBackgroundColor ?? defaults.themeBackgroundColor,
      themeBannerColor: settings.themeBannerColor ?? defaults.themeBannerColor,
      themeSidebarColor: settings.themeSidebarColor ?? defaults.themeSidebarColor,
    });
  }, [settings]);

  const update = useAdminUpdateCommunity({
    mutation: {
      onSuccess: (updated) => {
        setLogoUrl(updated.logoUrl ?? null);
        setColors({
          themePrimaryColor: updated.themePrimaryColor ?? defaults.themePrimaryColor,
          themeSecondaryColor: updated.themeSecondaryColor ?? defaults.themeSecondaryColor,
          themeBackgroundColor: updated.themeBackgroundColor ?? defaults.themeBackgroundColor,
          themeBannerColor: updated.themeBannerColor ?? defaults.themeBannerColor,
          themeSidebarColor: updated.themeSidebarColor ?? defaults.themeSidebarColor,
        });
        qc.setQueriesData({ queryKey: ["current-user"] }, (current: any) => current ? {
          ...current,
          community: current.community ? {
            ...current.community,
            logoUrl: updated.logoUrl ?? current.community.logoUrl ?? null,
            themePrimaryColor: updated.themePrimaryColor ?? null,
            themeSecondaryColor: updated.themeSecondaryColor ?? null,
            themeBackgroundColor: updated.themeBackgroundColor ?? null,
            themeBannerColor: updated.themeBannerColor ?? null,
            themeSidebarColor: updated.themeSidebarColor ?? null,
          } : current.community,
        } : current);
        qc.invalidateQueries({ queryKey: getAdminGetCommunityQueryKey() });
        qc.invalidateQueries({ queryKey: ["current-user"] });
        window.dispatchEvent(new CustomEvent(COMMUNITY_THEME_CHANGE_EVENT, { detail: updated }));
        toast({ title: "Your community's branding has been updated" });
      },
      onError: (error) => {
        toast({
          title: "Branding could not be saved",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const uploadLogo = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (!url) {
        toast({ title: "Image upload failed", description: "Please try again.", variant: "destructive" });
        return;
      }
      setLogoUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    update.mutate({
      data: {
        communityId: "default",
        logoUrl,
        ...colors,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Branding</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Update the logo and colors members see across your community.</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImagePlus size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Logo</h3>
                <p className="text-sm text-muted-foreground">Upload a square logo for the sidebar and top bar.</p>
              </div>
            </div>

            <label
              onDrop={(event) => {
                event.preventDefault();
                uploadLogo(event.dataTransfer.files?.[0]);
              }}
              onDragOver={(event) => event.preventDefault()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:bg-muted/50",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-background ring-1 ring-border">
                {logoUrl ? <img src={logoUrl} alt="Community logo" className="h-full w-full object-cover" /> : <Upload size={24} className="text-muted-foreground" />}
              </div>
              <span className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : "Drop logo here or click to upload"}</span>
              <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WebP works best.</span>
              <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadLogo(event.target.files?.[0])} disabled={uploading} />
            </label>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Colors</h3>
                <p className="text-sm text-muted-foreground">Choose the main app colors for your community.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {colorFields.map((field) => (
                <label key={field.key} className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</span>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
                    <input
                      type="color"
                      value={colors[field.key]}
                      onChange={(event) => setColors((current) => ({ ...current, [field.key]: event.target.value }))}
                      className="h-9 w-12 cursor-pointer rounded-md border-0 bg-transparent p-0"
                    />
                    <input
                      value={colors[field.key]}
                      onChange={(event) => setColors((current) => ({ ...current, [field.key]: event.target.value }))}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={save} disabled={update.isPending || isLoading} className="gap-2 rounded-xl">
                {update.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => setColors(defaults)} className="gap-2 rounded-xl">
                <RotateCcw size={16} />
                Reset to Default
              </Button>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <h3 className="mb-4 font-semibold text-foreground">Live preview</h3>
          <div style={{ background: colors.themeBackgroundColor }} className="overflow-hidden rounded-lg border border-border">
            <div style={{ background: colors.themeBannerColor }} className="flex items-center gap-2 border-b border-black/10 p-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/10">
                {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Palette size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold">{settings?.name ?? "Mohalla"}</p>
                <p className="text-xs opacity-70">Dashboard</p>
              </div>
            </div>
            <div className="flex min-h-52">
              <div style={{ background: colors.themeSidebarColor }} className="w-24 border-r border-black/10 p-3">
                <div style={{ background: colors.themePrimaryColor }} className="mb-2 h-7 rounded-md" />
                <div className="mb-2 h-7 rounded-md bg-black/5" />
                <div className="h-7 rounded-md bg-black/5" />
              </div>
              <div className="flex-1 p-4">
                <div className="mb-3 h-16 rounded-lg bg-white/80 ring-1 ring-black/10" />
                <div className="flex gap-2">
                  <div style={{ background: colors.themePrimaryColor }} className="h-9 flex-1 rounded-lg" />
                  <div style={{ background: colors.themeSecondaryColor }} className="h-9 flex-1 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}
