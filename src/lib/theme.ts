import { useEffect } from "react";

export interface CommunityTheme {
  themePrimaryColor?: string | null;
  themeSecondaryColor?: string | null;
  themeBackgroundColor?: string | null;
  themeBannerColor?: string | null;
  themeSidebarColor?: string | null;
}

const defaults = {
  primary: "oklch(0.45 0.126 184)",
  primaryHover: "oklch(0.39 0.126 185)",
  primaryForeground: "oklch(0.99 0.004 97)",
  secondary: "oklch(0.66 0.135 172)",
  secondaryForeground: "oklch(0.12 0.035 214)",
  background: "oklch(0.982 0.010 108)",
  banner: "oklch(0.998 0.004 108)",
  sidebar: "oklch(0.992 0.006 108)",
  ring: "oklch(0.50 0.126 184)",
};

const midnight = {
  primary: "oklch(0.72 0.13 191)",
  primaryHover: "oklch(0.65 0.13 192)",
  primaryForeground: "oklch(0.12 0.036 255)",
  secondary: "oklch(0.78 0.138 158)",
  secondaryForeground: "oklch(0.11 0.032 255)",
  background: "oklch(0.145 0.038 255)",
  banner: "oklch(0.195 0.044 252)",
  sidebar: "oklch(0.125 0.038 258)",
  ring: "oklch(0.72 0.13 191)",
};

const legacyDefaults = {
  primary: "#1B5E20",
  secondary: "#0288D1",
  background: "#FAFDF8",
  banner: "#FFFFFF",
  sidebar: "#FFFFFF",
};

function isHexColor(value?: string | null) {
  return Boolean(value && /^#[0-9a-f]{6}$/i.test(value));
}

function safeColor(value: string | null | undefined, fallback: string, legacyFallback?: string) {
  if (!isHexColor(value)) return fallback;
  return value!.toLowerCase() === legacyFallback?.toLowerCase() ? fallback : value!;
}

function foregroundFor(hex: string) {
  if (!isHexColor(hex)) return defaults.primaryForeground;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? "#12312d" : "#FFFFFF";
}

function applyTheme(vars: typeof defaults) {
  const root = document.documentElement;
  root.style.setProperty("--primary", vars.primary);
  root.style.setProperty("--primary-hover", vars.primaryHover);
  root.style.setProperty("--primary-foreground", vars.primaryForeground);
  root.style.setProperty("--accent", vars.secondary);
  root.style.setProperty("--accent-foreground", vars.secondaryForeground);
  root.style.setProperty("--background", vars.background);
  root.style.setProperty("--card", vars.banner);
  root.style.setProperty("--popover", vars.banner);
  root.style.setProperty("--sidebar", vars.sidebar);
  root.style.setProperty("--sidebar-primary", vars.primary);
  root.style.setProperty("--ring", vars.ring);
}

export function useCommunityTheme(community: CommunityTheme | null | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    const primary = safeColor(community?.themePrimaryColor, defaults.primary, legacyDefaults.primary);
    const secondary = safeColor(community?.themeSecondaryColor, defaults.secondary, legacyDefaults.secondary);
    const background = safeColor(community?.themeBackgroundColor, defaults.background, legacyDefaults.background);
    const banner = safeColor(community?.themeBannerColor, defaults.banner, legacyDefaults.banner);
    const sidebar = safeColor(community?.themeSidebarColor, defaults.sidebar, legacyDefaults.sidebar);
    const primaryForeground = isHexColor(primary) ? foregroundFor(primary) : defaults.primaryForeground;
    const secondaryForeground = isHexColor(secondary) ? foregroundFor(secondary) : defaults.secondaryForeground;

    root.style.setProperty("--community-primary", primary);
    root.style.setProperty("--community-secondary", secondary);
    root.style.setProperty("--community-background", background);
    root.style.setProperty("--community-banner", banner);
    root.style.setProperty("--community-sidebar", sidebar);
    root.style.setProperty("--community-primary-foreground", primaryForeground);
    root.style.setProperty("--community-secondary-foreground", secondaryForeground);
    root.style.setProperty("--community-banner-foreground", foregroundFor(banner));
    root.style.setProperty("--community-sidebar-foreground", foregroundFor(sidebar));

    const applySemanticTheme = () => {
      if (root.classList.contains("dark")) {
        applyTheme(midnight);
        return;
      }

      applyTheme({
        ...defaults,
        primary,
        primaryHover: isHexColor(primary) ? `color-mix(in oklch, ${primary} 86%, black)` : defaults.primaryHover,
        primaryForeground,
        secondary,
        secondaryForeground,
        background,
        banner,
        sidebar,
        ring: primary,
      });
    };

    applySemanticTheme();

    const observer = new MutationObserver(applySemanticTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [community]);
}
