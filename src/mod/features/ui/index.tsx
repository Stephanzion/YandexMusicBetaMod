import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.createElement("div");
  sidebar.id = "yandex-music-mod-sidebar";
  document.body.appendChild(sidebar);

  createRoot(sidebar, {}).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
