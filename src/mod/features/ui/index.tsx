import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";

Sentry.init({
  dsn: import.meta.env.VITE_PUBLIC_SENTRY_DSN!,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,

  integrations: [Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })],
  enableLogs: true,
  tracesSampleRate: 1.0,
  sampleRate: 1.0,
  tracePropagationTargets: [/^\//, /^https:\/\/api.music.yandex.net\//],

  beforeSend: (event, hint) => {
    // @ts-ignore
    if (!window.__yandexMusicModAnalyticsEnabled) return null;
    return event;
  },
});

Sentry.metrics.count("app_loaded", 1);

const queryClient = new QueryClient();

interface ModUiSingleton {
  host: HTMLDivElement;
  root: Root;
  observer?: MutationObserver;
}

type ModUiWindow = Window & {
  __yandexMusicModUiSingleton?: ModUiSingleton;
  __yandexMusicModUiMountScheduled?: boolean;
};

const modUiWindow = window as ModUiWindow;
const SIDEBAR_ID = "yandex-music-mod-sidebar";
const SHEET_CONTAINER_ID = "mod-sheet-container";

function ensureHostAttached(singleton: ModUiSingleton): void {
  try {
    if (!singleton.host.isConnected && document.body) {
      document.body.appendChild(singleton.host);
    }
  } catch (error) {
    console.error("[YandexMusicMod] Failed to reattach UI host:", error);
  }
}

function watchHost(singleton: ModUiSingleton): void {
  if (singleton.observer) return;

  try {
    const observer = new MutationObserver(() => ensureHostAttached(singleton));
    // Observe the whole document: Yandex Music can replace <body> children during hydration.
    observer.observe(document, { childList: true, subtree: true });
    singleton.observer = observer;

    window.addEventListener("pageshow", () => ensureHostAttached(singleton));
  } catch (error) {
    console.error("[YandexMusicMod] Failed to watch UI host:", error);
  }
}

function cleanupStaleUi(): void {
  try {
    for (const host of document.querySelectorAll(`#${SIDEBAR_ID}`)) {
      host.remove();
    }

    // A detached React root can leave its portal (and the menu button) behind.
    for (const container of document.querySelectorAll(`#${SHEET_CONTAINER_ID}`)) {
      container.remove();
    }
  } catch (error) {
    console.error("[YandexMusicMod] Failed to clean up stale UI:", error);
  }
}

function mountModUi(): void {
  const existingSingleton = modUiWindow.__yandexMusicModUiSingleton;
  if (existingSingleton) {
    ensureHostAttached(existingSingleton);
    watchHost(existingSingleton);
    return;
  }

  if (!document.body) return;

  cleanupStaleUi();

  const host = document.createElement("div");
  host.id = SIDEBAR_ID;

  let root: Root;
  try {
    document.body.appendChild(host);
    root = createRoot(host, {});
  } catch (error) {
    host.remove();
    console.error("[YandexMusicMod] Failed to create UI root:", error);
    return;
  }

  const singleton: ModUiSingleton = { host, root };
  modUiWindow.__yandexMusicModUiSingleton = singleton;
  watchHost(singleton);

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
}

function scheduleUiMount(): void {
  if (modUiWindow.__yandexMusicModUiSingleton || modUiWindow.__yandexMusicModUiMountScheduled) {
    const existingSingleton = modUiWindow.__yandexMusicModUiSingleton;
    if (existingSingleton) {
      ensureHostAttached(existingSingleton);
      watchHost(existingSingleton);
    }
    return;
  }

  modUiWindow.__yandexMusicModUiMountScheduled = true;

  const mountAfterFrame = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modUiWindow.__yandexMusicModUiMountScheduled = false;
        try {
          mountModUi();
        } catch (error) {
          console.error("[YandexMusicMod] Failed to initialize UI:", error);
        }
      });
    });
  };

  if (document.readyState === "complete") {
    mountAfterFrame();
  } else {
    // Waiting for load (instead of DOMContentLoaded) avoids Yandex's hydration body replacement.
    window.addEventListener("load", mountAfterFrame, { once: true });
  }
}

scheduleUiMount();
