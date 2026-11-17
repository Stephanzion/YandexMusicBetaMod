import type { LrclibRecord, LyricsFormat, TrackInfo } from "./types";

const LRCLIB_API_URL = "https://lrclib.net/api";
const LRCLIB_CLIENT = "YandexMusicBetaMod";
const REQUEST_TIMEOUT_MS = 4000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toRecord(value: unknown): LrclibRecord | null {
  if (!isRecord(value)) return null;

  const id = readNumber(value.id);
  const trackName = readString(value.trackName) ?? readString(value.name);
  const artistName = readString(value.artistName);
  const albumName = readString(value.albumName);
  const duration = readNumber(value.duration);

  if (id === null || !trackName || !artistName || albumName === null || duration === null) return null;

  return {
    id,
    trackName,
    artistName,
    albumName,
    duration,
    instrumental: value.instrumental === true,
    plainLyrics: readString(value.plainLyrics),
    syncedLyrics: readString(value.syncedLyrics),
  };
}

async function fetchJson(url: string, deadline: number): Promise<unknown | null> {
  const timeout = Math.min(REQUEST_TIMEOUT_MS, deadline - Date.now());
  if (timeout <= 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        "Lrclib-Client": LRCLIB_CLIENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function scoreRecord(record: LrclibRecord, track: TrackInfo, format: LyricsFormat): number {
  const recordName = normalize(record.trackName);
  const trackNames = [normalize(track.title)];
  if (track.version) trackNames.push(normalize(`${track.title} ${track.version}`));

  let score = 0;

  if (trackNames.includes(recordName)) {
    score += 100;
  } else if (trackNames.some((name) => name.includes(recordName) || recordName.includes(name))) {
    score += 40;
  }

  const recordArtist = normalize(record.artistName);
  const artistNames = track.artists.map(normalize).filter(Boolean);

  if (artistNames.includes(recordArtist)) {
    score += 60;
  } else if (artistNames.some((name) => recordArtist.includes(name) || name.includes(recordArtist))) {
    score += 25;
  }

  if (track.album && normalize(record.albumName) === normalize(track.album)) score += 20;

  if (track.durationMs !== undefined) {
    const difference = Math.abs(record.duration - track.durationMs / 1000);
    if (difference <= 2) score += 40;
    else if (difference <= 5) score += 25;
    else if (difference <= 10) score += 10;
    else score -= Math.min(60, difference);
  }

  const hasPlainLyrics = Boolean(record.plainLyrics?.trim());
  const hasSyncedLyrics = Boolean(record.syncedLyrics?.trim());

  if (format === "LRC") {
    if (hasSyncedLyrics) score += 40;
    else if (hasPlainLyrics) score += 5;
  } else if (hasPlainLyrics) {
    score += 20;
  } else if (hasSyncedLyrics) {
    score += 5;
  }

  if (!hasPlainLyrics && !hasSyncedLyrics) score -= 200;

  return score;
}

function pickBestRecord(records: LrclibRecord[], track: TrackInfo, format: LyricsFormat): LrclibRecord | null {
  let bestRecord: LrclibRecord | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const record of records) {
    if (record.instrumental) continue;

    const score = scoreRecord(record, track, format);
    if (score > bestScore) {
      bestScore = score;
      bestRecord = record;
    }
  }

  return bestScore >= 20 ? bestRecord : null;
}

function deduplicateRecords(records: LrclibRecord[]): LrclibRecord[] {
  const uniqueRecords = new Map<number, LrclibRecord>();

  for (const record of records) {
    uniqueRecords.set(record.id, record);
  }

  return [...uniqueRecords.values()];
}

export async function findLrclibLyrics(
  track: TrackInfo,
  format: LyricsFormat,
  deadline: number,
): Promise<LrclibRecord | null> {
  if (!track.title || track.artists.length === 0) return null;

  const records: LrclibRecord[] = [];
  const primaryArtist = track.artists[0] ?? "";
  const titles = [track.title];

  if (track.version && !track.title.toLowerCase().includes(track.version.toLowerCase())) {
    titles.push(`${track.title} ${track.version}`);
  }

  if (track.album && track.durationMs !== undefined && deadline > Date.now()) {
    const params = new URLSearchParams({
      artist_name: primaryArtist,
      track_name: track.title,
      album_name: track.album,
      duration: String(Math.round(track.durationMs / 1000)),
    });

    const exactRecord = toRecord(await fetchJson(`${LRCLIB_API_URL}/get?${params.toString()}`, deadline));
    if (exactRecord) records.push(exactRecord);
  }

  for (const title of titles) {
    if (deadline <= Date.now()) break;

    const params = new URLSearchParams({
      track_name: title,
      artist_name: primaryArtist,
    });

    const response = await fetchJson(`${LRCLIB_API_URL}/search?${params.toString()}`, deadline);
    if (Array.isArray(response)) {
      records.push(...response.map(toRecord).filter((record): record is LrclibRecord => record !== null));
    }

    if (records.length > 0) break;
  }

  if (records.length === 0 && deadline > Date.now()) {
    const query = [primaryArtist, track.title, track.version].filter(Boolean).join(" ");
    const params = new URLSearchParams({ q: query });

    const response = await fetchJson(`${LRCLIB_API_URL}/search?${params.toString()}`, deadline);
    if (Array.isArray(response)) {
      records.push(...response.map(toRecord).filter((record): record is LrclibRecord => record !== null));
    }
  }

  return pickBestRecord(deduplicateRecords(records), track, format);
}
