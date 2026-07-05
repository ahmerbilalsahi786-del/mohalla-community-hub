import { setupInstallPrompt } from "@/hooks/use-install-prompt";
import { syncMobilePushSubscription } from "@/lib/mobile-push";

export function registerPwa() {
  setupInstallPrompt();

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => syncMobilePushSubscription(registration))
      .catch(() => {});
  });
}
