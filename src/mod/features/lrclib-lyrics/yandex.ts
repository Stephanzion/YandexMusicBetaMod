import type { LyricsFormat } from "./types";

const YANDEX_API_URL = "https://api.music.yandex.net";
const REQUEST_TIMEOUT_MS = 4000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOAuthToken(): string | null {
  try {
    const rawToken = localStorage.oauth;
    if (!rawToken) return null;

    const parsed: unknown = JSON.parse(rawToken);
    if (!isRecord(parsed)) return null;

    return readString(parsed.value);
  } catch {
    return null;
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Yandex-Music-Client": `YandexMusicDesktopAppWindows/${window.VERSION ?? "5.0.0"}`,
    "X-Yandex-Music-Frontend": "new",
    "X-Yandex-Music-Without-Invocation-Info": "1",
  };

  const token = getOAuthToken();
  if (token) headers.Authorization = `OAuth ${token}`;

  return headers;
}

export async function fetchYandexLyrics(
  trackId: string,
  format: LyricsFormat,
  deadline: number,
): Promise<string | null> {
  const timeout = Math.min(REQUEST_TIMEOUT_MS, deadline - Date.now());
  if (timeout <= 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${YANDEX_API_URL}/tracks/${encodeURIComponent(trackId)}/supplement`, {
      headers: buildHeaders(),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data: unknown = await response.json();
    const payload = isRecord(data) && isRecord(data.result) ? data.result : data;

    if (!isRecord(payload) || !isRecord(payload.lyrics)) return null;

    const lyrics = payload.lyrics;

    if (format === "LRC") {
      const syncedLyrics = readString(lyrics.syncedLyrics) ?? readString(lyrics.syncLyrics) ?? readString(lyrics.lrc);
      if (syncedLyrics) return syncedLyrics;
    }

    return readString(lyrics.fullLyrics) ?? readString(lyrics.lyrics);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
