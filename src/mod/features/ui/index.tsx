import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from "posthog-js/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.createElement("div");
  sidebar.id = "yandex-music-mod-sidebar";
  document.body.appendChild(sidebar);

  function captureConsole(method) {
    const original = console[method];
    console[method] = function (...args) {
      try {
        posthog.capture("console_message", {
          level: method,
          message: args.map(String).join(" "),
          args: args,
        });
      } catch (e) {}
      original.apply(console, args);
    };
  }

  ["log", "warn", "error", "debug"].forEach(captureConsole);

  createRoot(sidebar, {}).render(
    <StrictMode>
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY!}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST!,
          defaults: "2025-05-24",
          capture_exceptions: {
            capture_unhandled_errors: true,
            capture_unhandled_rejections: true,
            capture_console_errors: true,
          },
          disable_session_recording: true,
          persistence: "localStorage",
          disable_surveys: true,
          disable_web_experiments: true,
          disable_external_dependency_loading: true,
          enable_recording_console_log: true,
          advanced_disable_flags: true,
        }}
      >
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </PostHogProvider>
    </StrictMode>,
  );
});
