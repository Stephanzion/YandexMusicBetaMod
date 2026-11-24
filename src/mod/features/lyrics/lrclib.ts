import type { LrclibRecord, LyricsFormat, TrackInfo } from "./types";

const LRCLIB_API_URL = "https://lrclib.net/api";
const LRCLIB_CLIENT = "YandexMusicBetaMod";
const REQUEST_TIMEOUT_MS = 4000;

interface Candidate {
  record: LrclibRecord;
  score: number;
  artistMatch: boolean;
  titleMatch: boolean;
  durationDiff: number | null;
}

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
  const duration = readNumber(value.duration);

  if (id === null || !trackName || !artistName || duration === null) return null;

  return {
    id,
    trackName,
    artistName,
    albumName: readString(value.albumName) ?? "",
    duration,
    instrumental: value.instrumental === true,
    plainLyrics: readString(value.plainLyrics),
    syncedLyrics: readString(value.syncedLyrics),
  };
}

function toRecords(value: unknown): LrclibRecord[] {
  if (!Array.isArray(value)) return [];

  return value.map(toRecord).filter((record): record is LrclibRecord => record !== null);
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
  } catch (error) {
    console.warn("[Lyrics] LRCLib request failed:", url, error);
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

function titleVariants(track: TrackInfo): string[] {
  const variants = [normalize(track.title)];

  if (track.version) {
    const withVersion = normalize(`${track.title} ${track.version}`);
    if (!variants.includes(withVersion)) variants.push(withVersion);
  }

  return variants.filter((variant) => variant.length > 0);
}

function evaluate(record: LrclibRecord, track: TrackInfo, format: LyricsFormat): Candidate {
  const recordName = normalize(record.trackName);
  const names = titleVariants(track);

  let titleMatch = false;
  let score = 0;

  if (names.includes(recordName)) {
    titleMatch = true;
    score += 100;
  } else if (names.some((name) => name.includes(recordName) || recordName.includes(name))) {
    score += 40;
  }

  const recordArtist = normalize(record.artistName);
  const artists = track.artists.map(normalize).filter(Boolean);

  let artistMatch = false;
  if (recordArtist.length > 0 && artists.includes(recordArtist)) {
    artistMatch = true;
    score += 60;
  } else if (artists.some((name) => recordArtist.includes(name) || name.includes(recordArtist))) {
    artistMatch = true;
    score += 25;
  }

  if (track.album && normalize(record.albumName) === normalize(track.album)) score += 20;

  let durationDiff: number | null = null;
  if (track.durationMs !== undefined) {
    durationDiff = Math.abs(record.duration - track.durationMs / 1000);
    if (durationDiff <= 2) score += 40;
    else if (durationDiff <= 5) score += 25;
    else if (durationDiff <= 10) score += 10;
    else score -= Math.min(60, durationDiff);
  }

  const hasPlain = Boolean(record.plainLyrics?.trim());
  const hasSynced = Boolean(record.syncedLyrics?.trim());

  if (format === "LRC") {
    if (hasSynced) score += 40;
    else if (hasPlain) score += 5;
  } else if (hasPlain) {
    score += 20;
  } else if (hasSynced) {
    score += 5;
  }

  if (!hasPlain && !hasSynced) score -= 200;

  return { record, score, artistMatch, titleMatch, durationDiff };
}

function isAcceptable(candidate: Candidate): boolean {
  if (candidate.artistMatch) return candidate.score >= 40;

  // Если исполнитель не совпал, берём только точное совпадение названия и близкую длительность:
  // иначе легко подхватить чужую песню с таким же названием.
  const durationOk = candidate.durationDiff === null || candidate.durationDiff <= 5;
  return candidate.titleMatch && durationOk && candidate.score >= 100;
}

function pickBest(candidates: Candidate[]): Candidate | null {
  let best: Candidate | null = null;

  for (const candidate of candidates) {
    if (candidate.record.instrumental) continue;
    if (!candidate.record.plainLyrics?.trim() && !candidate.record.syncedLyrics?.trim()) continue;
    if (!best || candidate.score > best.score) best = candidate;
  }

  return best && isAcceptable(best) ? best : null;
}

function deduplicate(records: LrclibRecord[]): LrclibRecord[] {
  const unique = new Map<number, LrclibRecord>();
  for (const record of records) unique.set(record.id, record);
  return [...unique.values()];
}

export async function findLrclibLyrics(
  track: TrackInfo,
  format: LyricsFormat,
  deadline: number,
): Promise<LrclibRecord | null> {
  if (!track.title) return null;

  const records: LrclibRecord[] = [];
  const primaryArtist = track.artists[0] ?? "";
  const titles = [track.title];

  if (track.version && !track.title.toLowerCase().includes(track.version.toLowerCase())) {
    titles.push(`${track.title} ${track.version}`);
  }

  // 1. Точный запрос: исполнитель + название + альбом + длительность.
  if (primaryArtist && track.album && track.durationMs !== undefined && deadline > Date.now()) {
    const params = new URLSearchParams({
      artist_name: primaryArtist,
      track_name: track.title,
      album_name: track.album,
      duration: String(Math.round(track.durationMs / 1000)),
    });

    const exact = toRecord(await fetchJson(`${LRCLIB_API_URL}/get?${params.toString()}`, deadline));
    if (exact) records.push(exact);
  }

  let best = pickBest(records.map((record) => evaluate(record, track, format)));

  // 2. Поиск по исполнителю и названию.
  if (!best && primaryArtist && deadline > Date.now()) {
    for (const title of titles) {
      if (deadline <= Date.now()) break;

      const params = new URLSearchParams({ track_name: title, artist_name: primaryArtist });
      const found = toRecords(await fetchJson(`${LRCLIB_API_URL}/search?${params.toString()}`, deadline));
      records.push(...found);

      best = pickBest(deduplicate(records).map((record) => evaluate(record, track, format)));
      if (best) break;
    }
  }

  // 3. Поиск только по названию: у LRCLib исполнители часто записаны иначе
  // ("Глюк'oZa" / "Глюкоза", "Cream Soda" / "ХЛЕБ").
  if (!best && deadline > Date.now()) {
    const params = new URLSearchParams({ track_name: track.title });
    const found = toRecords(await fetchJson(`${LRCLIB_API_URL}/search?${params.toString()}`, deadline));
    records.push(...found);

    best = pickBest(deduplicate(records).map((record) => evaluate(record, track, format)));
  }

  if (!best) return null;

  console.log("[Lyrics] LRCLib match:", {
    track: `${track.artists.join(", ")} - ${track.title}`,
    found: `${best.record.artistName} - ${best.record.trackName}`,
    score: best.score,
    synced: Boolean(best.record.syncedLyrics),
  });

  return best.record;
}
