import { useEffect } from "react";

export interface CommunityTheme {
  themePrimaryColor?: string | null;
  themeSecondaryColor?: string | null;
  themeBackgroundColor?: string | null;
  themeBannerColor?: string | null;
  themeSidebarColor?: string | null;
}

const defaults = {
  primary: "#1B5E20",
  secondary: "#0288D1",
  background: "#FAFDF8",
  banner: "#FFFFFF",
  sidebar: "#FFFFFF",
};

function isHexColor(value?: string | null) {
  return Boolean(value && /^#[0-9a-f]{6}$/i.test(value));
}

function safeColor(value: string | null | undefined, fallback: string) {
  return isHexColor(value) ? value! : fallback;
}

function foregroundFor(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? "#12312d" : "#FFFFFF";
}

export function useCommunityTheme(community: CommunityTheme | null | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    const primary = safeColor(community?.themePrimaryColor, defaults.primary);
    const secondary = safeColor(community?.themeSecondaryColor, defaults.secondary);
    const background = safeColor(community?.themeBackgroundColor, defaults.background);
    const banner = safeColor(community?.themeBannerColor, defaults.banner);
    const sidebar = safeColor(community?.themeSidebarColor, defaults.sidebar);

    root.style.setProperty("--community-primary", primary);
    root.style.setProperty("--community-secondary", secondary);
    root.style.setProperty("--community-background", background);
    root.style.setProperty("--community-banner", banner);
    root.style.setProperty("--community-sidebar", sidebar);
    root.style.setProperty("--community-primary-foreground", foregroundFor(primary));
    root.style.setProperty("--community-secondary-foreground", foregroundFor(secondary));
    root.style.setProperty("--community-banner-foreground", foregroundFor(banner));
    root.style.setProperty("--community-sidebar-foreground", foregroundFor(sidebar));
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--accent", secondary);
    root.style.setProperty("--background", background);
    root.style.setProperty("--primary-foreground", foregroundFor(primary));
    root.style.setProperty("--accent-foreground", foregroundFor(secondary));
  }, [community]);
}
