import { setupInstallPrompt } from "@/hooks/use-install-prompt";

export function registerPwa() {
  setupInstallPrompt();

  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
