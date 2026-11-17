import { getTracksInfo } from "~/mod/features/utils/api";
import { onYandexApiRequest, onYandexApiResponse } from "~/mod/features/utils/utils";

import { lrcToPlainText, sanitizeLrc } from "./lrc";
import { findLrclibLyrics } from "./lrclib";
import { patchTracksInResponse } from "./metadata";
import { ensureSettingsLoaded, getSettings, initSettings, type LrclibLyricsSettings } from "./settings";
import { getKnownTrack, isTrackAllowed, readTrackInfo, rememberTrack } from "./track-cache";
import type { LrclibRecord, LyricsFormat, TrackInfo } from "./types";
import { fetchYandexLyrics } from "./yandex";

const TRACK_LYRICS_URL_PATTERN = /^https:\/\/api\.music\.yandex\.net\/tracks\/([^/?#]+)\/lyrics\/?(?:[?#]|$)/i;
const TEXT_LYRICS_URL_PREFIX = "https://api.music.yandex.net/lrclib/lyrics/";
const TEXT_LYRICS_URL_MATCH = "/lrclib/lyrics/";

const TOTAL_RESOLVE_TIMEOUT_MS = 8000;
const TRACK_INFO_TIMEOUT_MS = 3000;
const LYRICS_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_LYRICS_CACHE_ENTRIES = 200;

interface CachedLyrics {
  text: string;
  expiresAt: number;
}

const lyricsCache = new Map<string, CachedLyrics>();

let initialized = false;

function responseJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function responseText(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
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

function cacheLyrics(key: string, text: string): void {
  if (lyricsCache.size >= MAX_LYRICS_CACHE_ENTRIES) {
    const oldestKey = lyricsCache.keys().next().value;
    if (oldestKey !== undefined) lyricsCache.delete(oldestKey);
  }

  lyricsCache.delete(key);
  lyricsCache.set(key, {
    text,
    expiresAt: Date.now() + LYRICS_CACHE_TTL_MS,
  });
}

function selectLyricsText(record: LrclibRecord, format: LyricsFormat): string | null {
  const plainLyrics = record.plainLyrics?.trim() ?? "";
  const syncedLyrics = record.syncedLyrics?.trim() ?? "";

  if (format === "LRC") {
    if (syncedLyrics) {
      const sanitizedLyrics = sanitizeLrc(syncedLyrics);
      if (sanitizedLyrics) return sanitizedLyrics;
    }

    return plainLyrics || lrcToPlainText(syncedLyrics) || null;
  }

  if (plainLyrics) return plainLyrics;
  return syncedLyrics ? lrcToPlainText(syncedLyrics) || null : null;
}

async function lookupTrackInfo(trackId: string, deadline: number): Promise<TrackInfo | null> {
  const cachedTrack = getKnownTrack(trackId);
  if (cachedTrack) return cachedTrack;

  const timeout = Math.min(TRACK_INFO_TIMEOUT_MS, deadline - Date.now());
  if (timeout <= 0) return null;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeout);
  });

  try {
    const result = await Promise.race([getTracksInfo([trackId]), timeoutPromise]);
    if (!result || result.isErr()) return null;

    const rawTrack: unknown = result.value[0];
    if (typeof rawTrack !== "object" || rawTrack === null) return null;

    const trackInfo = readTrackInfo(rawTrack as Record<string, unknown>);
    if (trackInfo) rememberTrack(trackInfo);

    return trackInfo;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function resolveLyrics(
  trackId: string,
  format: LyricsFormat,
  settings: LrclibLyricsSettings,
): Promise<string | null> {
  const cacheKey = `${trackId}:${format}:${settings.yandexFallback ? "fallback" : "no-fallback"}`;
  const cachedLyrics = lyricsCache.get(cacheKey);

  if (cachedLyrics) {
    if (cachedLyrics.expiresAt > Date.now()) return cachedLyrics.text;
    lyricsCache.delete(cacheKey);
  }

  const deadline = Date.now() + TOTAL_RESOLVE_TIMEOUT_MS;
  const track = await lookupTrackInfo(trackId, deadline);

  let lyrics: string | null = null;

  if (track) {
    const record = await findLrclibLyrics(track, format, deadline);
    if (record) lyrics = selectLyricsText(record, format);
  }

  if (!lyrics && settings.yandexFallback) {
    const yandexLyrics = await fetchYandexLyrics(trackId, format, deadline);
    if (yandexLyrics) {
      lyrics = format === "LRC" ? sanitizeLrc(yandexLyrics) || yandexLyrics : yandexLyrics;
    }
  }

  if (lyrics) cacheLyrics(cacheKey, lyrics);

  return lyrics;
}

export function initLrclibLyrics(): void {
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

    return responseJson({
      downloadUrl: `${TEXT_LYRICS_URL_PREFIX}${encodeURIComponent(trackId)}?format=${format}`,
      major: {
        id: 0,
        name: "LRCLIB",
        prettyName: "LRCLib",
      },
      externalLyricId: `lrclib-${trackId}`,
      lyricId: 0,
      writers: [],
    });
  });

  // Отдаём сам текст по синтетическому URL, который вернули выше.
  onYandexApiRequest(TEXT_LYRICS_URL_MATCH, async (request: Request) => {
    await ensureSettingsLoaded();

    const settings = getSettings();
    if (!settings.enabled) return responseText("", 404);

    const url = new URL(request.url);
    const match = /\/lrclib\/lyrics\/([^/?#]+)/.exec(url.pathname);
    const trackId = decodeTrackId(match?.[1] ?? "");

    if (!trackId || !isTrackAllowed(trackId, settings.unlockNonMusic)) return responseText("", 404);

    const lyrics = await resolveLyrics(trackId, readFormat(url), settings);
    return lyrics ? responseText(lyrics) : responseText("", 404);
  });

  // Разблокируем кнопку текста в метаданных трека.
  onYandexApiResponse("api.music.yandex.net", async (response: { url: string; data: unknown }) => {
    await ensureSettingsLoaded();

    try {
      return patchTracksInResponse(response.data);
    } catch (error) {
      console.error("[LrclibLyrics] Failed to patch track metadata:", error);
      return response.data;
    }
  });
}
