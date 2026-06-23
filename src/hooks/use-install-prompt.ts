import { useCallback, useEffect, useState } from "react";

type InstallOutcome = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome; platform: string }>;
};

const DISMISSED_KEY = "mohalla_install_prompt_dismissed";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let setupComplete = false;
const subscribers = new Set<() => void>();

function isStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function notify() {
  installed = isStandalone();
  subscribers.forEach((subscriber) => subscriber());
}

export function setupInstallPrompt() {
  if (setupComplete || typeof window === "undefined") return;
  setupComplete = true;
  installed = isStandalone();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    window.localStorage.removeItem(DISMISSED_KEY);
    notify();
  });

  window.matchMedia("(display-mode: standalone)").addEventListener?.("change", notify);
}

export function dismissInstallPrompt() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISSED_KEY, "true");
  notify();
}

export function useInstallPrompt() {
  const [state, setState] = useState(() => ({
    canPrompt: Boolean(deferredPrompt),
    dismissed: typeof window !== "undefined" && window.localStorage.getItem(DISMISSED_KEY) === "true",
    installed,
    standalone: isStandalone(),
  }));

  useEffect(() => {
    setupInstallPrompt();
    const update = () => {
      setState({
        canPrompt: Boolean(deferredPrompt),
        dismissed: window.localStorage.getItem(DISMISSED_KEY) === "true",
        installed,
        standalone: isStandalone(),
      });
    };
    subscribers.add(update);
    update();
    return () => {
      subscribers.delete(update);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;

    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    notify();
    return choice.outcome;
  }, []);

  return {
    ...state,
    isInstallable: state.canPrompt && !state.installed && !state.standalone,
    promptInstall,
  };
}
