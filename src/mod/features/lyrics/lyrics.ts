import { getTracksInfo } from "~/mod/features/utils/api";
import { onYandexApiRequest, onYandexApiResponse } from "~/mod/features/utils/utils";

import { findLrclibLyrics } from "./lrclib";
import { isLrcLike, lrcToPlainText, plainToLrc, sanitizeLrc } from "./lrc";
import { patchTracksInResponse } from "./metadata";
import { ensureSettingsLoaded, getSettings, initSettings } from "./settings";
import { getCachedLyrics, getCustomLyrics, setCachedLyrics } from "./storage";
import { getKnownTrack, isTrackAllowed, readTrackInfo, rememberTrack } from "./track-cache";
import type { LyricsFormat, ResolvedLyrics, TrackInfo } from "./types";

const TRACK_LYRICS_URL_PATTERN = /^https:\/\/api\.music\.yandex\.net\/tracks\/([^/?#]+)\/lyrics\/?(?:[?#]|$)/i;
const SYNTHETIC_LYRICS_URL_PREFIX = "https://api.music.yandex.net/mod-lyrics/";
const SYNTHETIC_LYRICS_URL_MATCH = "/mod-lyrics/";

const RESOLVE_TIMEOUT_MS = 8000;
const TRACK_INFO_TIMEOUT_MS = 3000;
const NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000;

const NOT_FOUND_MESSAGE = "Текст песни не найден. Добавьте свой текст в меню мода → «Тексты песен».";

const inFlight = new Map<string, Promise<ResolvedLyrics>>();
const negativeCache = new Map<string, number>();

let initialized = false;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function readFormat(url: URL): LyricsFormat {
  return url.searchParams.get("format")?.toUpperCase() === "LRC" ? "LRC" : "TEXT";
}

function decodeTrackId(value: string): string | null {
  try {
    const trackId = decodeURIComponent(value).trim();
    return trackId.length > 0 ? trackId : null;
  } catch {
    return null;
  }
}

function toFormat(rawText: string, format: LyricsFormat, durationMs?: number): string {
  const text = rawText.trim();
  if (!text) return "";

  const lrcLike = isLrcLike(text);

  if (format === "LRC") {
    if (lrcLike) return sanitizeLrc(text);
    return plainToLrc(text, durationMs);
  }

  return lrcLike ? lrcToPlainText(text) : text;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function lookupTrackInfo(trackId: string): Promise<TrackInfo | null> {
  const cachedTrack = getKnownTrack(trackId);
  if (cachedTrack) return cachedTrack;

  const result = await withTimeout(getTracksInfo([trackId]), TRACK_INFO_TIMEOUT_MS);
  if (!result || result.isErr()) return null;

  const rawTrack: unknown = result.value[0];
  if (typeof rawTrack !== "object" || rawTrack === null) return null;

  const trackInfo = readTrackInfo(rawTrack as Record<string, unknown>);
  if (trackInfo) rememberTrack(trackInfo);

  return trackInfo;
}

async function resolveLyrics(trackId: string, format: LyricsFormat): Promise<ResolvedLyrics> {
  const custom = await getCustomLyrics(trackId);
  if (custom?.text?.trim()) {
    return { text: toFormat(custom.text, format, undefined), source: "custom", synced: isLrcLike(custom.text) };
  }

  const cacheKey = `${trackId}:${format}`;

  const cached = await getCachedLyrics(cacheKey);
  if (cached) {
    return { text: cached, source: "lrclib", synced: format === "LRC" };
  }

  const negativeUntil = negativeCache.get(cacheKey);
  if (negativeUntil && negativeUntil > Date.now()) {
    return { text: "", source: "none", synced: false };
  }

  const deadline = Date.now() + RESOLVE_TIMEOUT_MS;
  const track = await lookupTrackInfo(trackId);

  if (track) {
    const record = await findLrclibLyrics(track, format, deadline);
    if (record) {
      const syncedText = record.syncedLyrics?.trim() ?? "";
      const plainText = record.plainLyrics?.trim() ?? "";

      let text = "";
      if (format === "LRC") {
        text = syncedText ? sanitizeLrc(syncedText) : plainToLrc(plainText, track.durationMs);
      } else {
        text = plainText || (syncedText ? lrcToPlainText(syncedText) : "");
      }

      if (text) {
        void setCachedLyrics(cacheKey, text);
        negativeCache.delete(cacheKey);
        return { text, source: "lrclib", synced: format === "LRC" };
      }
    }
  }

  negativeCache.set(cacheKey, Date.now() + NEGATIVE_CACHE_TTL_MS);
  return { text: "", source: "none", synced: false };
}

function resolveLyricsOnce(trackId: string, format: LyricsFormat): Promise<ResolvedLyrics> {
  const key = `${trackId}:${format}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = resolveLyrics(trackId, format)
    .catch((error): ResolvedLyrics => {
      console.error("[Lyrics] Failed to resolve lyrics:", error);
      return { text: "", source: "none", synced: false };
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

function buildNotFoundResponse(format: LyricsFormat): Response {
  const text = format === "LRC" ? `[00:00.00]${NOT_FOUND_MESSAGE}` : NOT_FOUND_MESSAGE;
  return textResponse(text);
}

export function initLyrics(): void {
  if (initialized) return;
  initialized = true;

  initSettings();

  // Подменяем ответ Яндекс Музыки на объект TrackLyrics с собственным URL текста.
  onYandexApiRequest("/tracks/", async (request: Request) => {
    const match = TRACK_LYRICS_URL_PATTERN.exec(request.url);
    if (!match) return undefined;

    await ensureSettingsLoaded();

    const settings = getSettings();
    if (!settings.enabled) return undefined;

    const trackId = decodeTrackId(match[1] ?? "");
    if (!trackId || !isTrackAllowed(trackId, settings.unlockNonMusic)) return undefined;

    const format = readFormat(new URL(request.url));

    const payload = {
      downloadUrl: `${SYNTHETIC_LYRICS_URL_PREFIX}${encodeURIComponent(trackId)}?format=${format}`,
      major: {
        id: 0,
        name: "LRCLIB",
        prettyName: "LRCLib",
      },
      externalLyricId: `mod-${trackId}`,
      lyricId: 0,
      writers: [],
    };

    // Отдаём и плоский объект, и обёртку result: разные версии клиента читают разное.
    return jsonResponse({ ...payload, result: payload });
  });

  // Отдаём сам текст по синтетическому URL, который вернули выше.
  onYandexApiRequest(SYNTHETIC_LYRICS_URL_MATCH, async (request: Request) => {
    await ensureSettingsLoaded();

    const settings = getSettings();
    if (!settings.enabled) return textResponse("");

    const url = new URL(request.url);
    const match = /\/mod-lyrics\/([^/?#]+)/.exec(url.pathname);
    const trackId = decodeTrackId(match?.[1] ?? "");

    if (!trackId || !isTrackAllowed(trackId, settings.unlockNonMusic)) return textResponse("");

    const format = readFormat(url);
    const resolved = await resolveLyricsOnce(trackId, format);

    if (!resolved.text) return buildNotFoundResponse(format);

    return textResponse(resolved.text);
  });

  // Разблокируем кнопку текста в метаданных трека.
  onYandexApiResponse("api.music.yandex.net", async (response: { url: string; data: unknown }) => {
    await ensureSettingsLoaded();

    try {
      return patchTracksInResponse(response.data);
    } catch (error) {
      console.error("[Lyrics] Failed to patch track metadata:", error);
      return response.data;
    }
  });

  console.log("[Lyrics] Initialized");
}
