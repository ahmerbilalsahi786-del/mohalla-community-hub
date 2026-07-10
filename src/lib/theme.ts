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
  secondary: "oklch(0.945 0.032 163)",
  secondaryHover: "oklch(0.90 0.042 164)",
  secondaryForeground: "oklch(0.235 0.048 238)",
  accent: "oklch(0.66 0.135 172)",
  accentForeground: "oklch(0.12 0.035 214)",
  background: "oklch(0.982 0.010 108)",
  foreground: "oklch(0.22 0.042 238)",
  banner: "oklch(0.998 0.004 108)",
  bannerForeground: "oklch(0.22 0.042 238)",
  muted: "oklch(0.95 0.014 104)",
  mutedForeground: "oklch(0.48 0.034 233)",
  border: "oklch(0.885 0.021 216)",
  input: "oklch(0.91 0.018 214)",
  sidebar: "oklch(0.992 0.006 108)",
  sidebarForeground: "oklch(0.25 0.046 238)",
  sidebarAccent: "oklch(0.947 0.024 164)",
  sidebarAccentForeground: "oklch(0.25 0.046 238)",
  sidebarBorder: "oklch(0.892 0.02 216)",
  sidebarPrimaryForeground: "oklch(0.99 0.004 97)",
  ring: "oklch(0.50 0.126 184)",
  chart1: "oklch(0.45 0.126 184)",
  chart2: "oklch(0.66 0.135 172)",
};

const midnight = {
  primary: "oklch(0.72 0.13 191)",
  primaryHover: "oklch(0.65 0.13 192)",
  primaryForeground: "oklch(0.12 0.036 255)",
  secondary: "oklch(0.258 0.052 253)",
  secondaryHover: "oklch(0.32 0.058 253)",
  secondaryForeground: "oklch(0.935 0.015 224)",
  accent: "oklch(0.78 0.138 158)",
  accentForeground: "oklch(0.11 0.032 255)",
  background: "oklch(0.145 0.038 255)",
  foreground: "oklch(0.948 0.014 224)",
  banner: "oklch(0.195 0.044 252)",
  bannerForeground: "oklch(0.948 0.014 224)",
  muted: "oklch(0.25 0.043 252)",
  mutedForeground: "oklch(0.745 0.035 226)",
  border: "oklch(0.34 0.052 250)",
  input: "oklch(0.31 0.052 250)",
  sidebar: "oklch(0.125 0.038 258)",
  sidebarForeground: "oklch(0.925 0.015 224)",
  sidebarAccent: "oklch(0.225 0.052 254)",
  sidebarAccentForeground: "oklch(0.94 0.015 224)",
  sidebarBorder: "oklch(0.30 0.052 250)",
  sidebarPrimaryForeground: "oklch(0.12 0.036 255)",
  ring: "oklch(0.72 0.13 191)",
  chart1: "oklch(0.72 0.13 191)",
  chart2: "oklch(0.78 0.138 158)",
};

function isHexColor(value?: string | null) {
  return Boolean(value && /^#[0-9a-f]{6}$/i.test(value));
}

function safeColor(value: string | null | undefined, fallback: string) {
  return isHexColor(value) ? value! : fallback;
}

function foregroundFor(hex: string, fallback = defaults.foreground) {
  if (!isHexColor(hex)) return fallback;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? "#12312d" : "#FFFFFF";
}

function mix(color: string, amount: number, base: string) {
  return `color-mix(in oklch, ${color} ${amount}%, ${base})`;
}

function applyStoredThemePreference(root: HTMLElement) {
  const storedTheme = window.localStorage.getItem("mohalla-theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  root.classList.toggle("dark", storedTheme ? storedTheme === "dark" : prefersDark);
}

function applyTheme(vars: typeof defaults) {
  const root = document.documentElement;
  root.style.setProperty("--foreground", vars.foreground);
  root.style.setProperty("--primary", vars.primary);
  root.style.setProperty("--primary-hover", vars.primaryHover);
  root.style.setProperty("--primary-foreground", vars.primaryForeground);
  root.style.setProperty("--secondary", vars.secondary);
  root.style.setProperty("--secondary-hover", vars.secondaryHover);
  root.style.setProperty("--secondary-foreground", vars.secondaryForeground);
  root.style.setProperty("--accent", vars.accent);
  root.style.setProperty("--accent-foreground", vars.accentForeground);
  root.style.setProperty("--background", vars.background);
  root.style.setProperty("--card", vars.banner);
  root.style.setProperty("--card-foreground", vars.bannerForeground);
  root.style.setProperty("--popover", vars.banner);
  root.style.setProperty("--popover-foreground", vars.bannerForeground);
  root.style.setProperty("--muted", vars.muted);
  root.style.setProperty("--muted-foreground", vars.mutedForeground);
  root.style.setProperty("--border", vars.border);
  root.style.setProperty("--input", vars.input);
  root.style.setProperty("--sidebar", vars.sidebar);
  root.style.setProperty("--sidebar-foreground", vars.sidebarForeground);
  root.style.setProperty("--sidebar-primary", vars.primary);
  root.style.setProperty("--sidebar-primary-foreground", vars.sidebarPrimaryForeground);
  root.style.setProperty("--sidebar-accent", vars.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", vars.sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", vars.sidebarBorder);
  root.style.setProperty("--sidebar-ring", vars.ring);
  root.style.setProperty("--ring", vars.ring);
  root.style.setProperty("--chart-1", vars.chart1);
  root.style.setProperty("--chart-2", vars.chart2);
}

export function useCommunityTheme(
  community: CommunityTheme | null | undefined,
  options: { forceLight?: boolean } = {},
) {
  useEffect(() => {
    const root = document.documentElement;
    const forceLight = Boolean(options.forceLight);
    if (forceLight) root.classList.remove("dark");
    else applyStoredThemePreference(root);
    const primary = safeColor(community?.themePrimaryColor, defaults.primary);
    const accent = safeColor(community?.themeSecondaryColor, defaults.accent);
    const background = safeColor(community?.themeBackgroundColor, defaults.background);
    const banner = safeColor(community?.themeBannerColor, defaults.banner);
    const sidebar = safeColor(community?.themeSidebarColor, defaults.sidebar);
    const primaryForeground = isHexColor(primary) ? foregroundFor(primary) : defaults.primaryForeground;
    const accentForeground = isHexColor(accent) ? foregroundFor(accent, defaults.accentForeground) : defaults.accentForeground;
    const foreground = foregroundFor(background);
    const bannerForeground = foregroundFor(banner, defaults.bannerForeground);
    const sidebarForeground = foregroundFor(sidebar, defaults.sidebarForeground);

    root.style.setProperty("--community-primary", primary);
    root.style.setProperty("--community-secondary", accent);
    root.style.setProperty("--community-background", background);
    root.style.setProperty("--community-banner", banner);
    root.style.setProperty("--community-sidebar", sidebar);
    root.style.setProperty("--community-primary-foreground", primaryForeground);
    root.style.setProperty("--community-secondary-foreground", accentForeground);
    root.style.setProperty("--community-banner-foreground", bannerForeground);
    root.style.setProperty("--community-sidebar-foreground", sidebarForeground);

    const applySemanticTheme = () => {
      if (forceLight && root.classList.contains("dark")) {
        root.classList.remove("dark");
      }

      if (!forceLight && root.classList.contains("dark")) {
        applyTheme(midnight);
        return;
      }

      applyTheme({
        ...defaults,
        primary,
        primaryHover: isHexColor(primary) ? `color-mix(in oklch, ${primary} 86%, black)` : defaults.primaryHover,
        primaryForeground,
        secondary: mix(accent, 15, banner),
        secondaryHover: mix(accent, 24, banner),
        secondaryForeground: bannerForeground,
        accent,
        accentForeground,
        background,
        foreground,
        banner,
        bannerForeground,
        muted: mix(primary, 6, background),
        mutedForeground: mix(foreground, 72, background),
        border: mix(primary, 18, background),
        input: mix(primary, 16, background),
        sidebar,
        sidebarForeground,
        sidebarAccent: mix(primary, 14, sidebar),
        sidebarAccentForeground: sidebarForeground,
        sidebarBorder: mix(primary, 16, sidebar),
        sidebarPrimaryForeground: primaryForeground,
        ring: primary,
        chart1: primary,
        chart2: accent,
      });
    };

    applySemanticTheme();

    const observer = new MutationObserver(applySemanticTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [community, options.forceLight]);
}
