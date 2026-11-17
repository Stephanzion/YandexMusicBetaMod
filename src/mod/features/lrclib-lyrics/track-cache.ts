import type { TrackInfo } from "./types";

const MAX_TRACKS = 5000;

const knownTracks = new Map<string, TrackInfo>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isMusicTrack(record: Record<string, unknown>): boolean {
  if (record.isPodcast === true || record.isAudiobook === true || record.isNonMusic === true) return false;
  if (record.isUGC === true || record.trackSource === "UGC" || record.trackSource === "OWN_REPLACED_TO_UGC") {
    return false;
  }

  const type = readString(record.type);
  return type === undefined || type === "music" || type === "track";
}

function readArtists(record: Record<string, unknown>): string[] {
  if (!Array.isArray(record.artists)) return [];

  return record.artists
    .map((artist) => {
      if (typeof artist === "string") return artist;
      if (isRecord(artist)) return readString(artist.name);
      return undefined;
    })
    .filter((name): name is string => typeof name === "string");
}

function readAlbum(record: Record<string, unknown>): string | undefined {
  if (!Array.isArray(record.albums)) return undefined;

  const album = record.albums[0];
  if (!isRecord(album)) return undefined;

  return readString(album.title);
}

export function isTrackLike(record: Record<string, unknown>): boolean {
  const id = record.id;
  const hasId = typeof id === "string" || typeof id === "number";
  if (!hasId || typeof record.title !== "string" || !Array.isArray(record.artists)) return false;

  return (
    "lyricsInfo" in record ||
    "lyricsAvailable" in record ||
    "durationMs" in record ||
    "trackSource" in record ||
    "realId" in record
  );
}

export function readTrackInfo(record: Record<string, unknown>): TrackInfo | null {
  const id = typeof record.id === "number" ? String(record.id) : readString(record.id);
  const title = readString(record.title);
  if (!id || !title) return null;

  return {
    id,
    title,
    version: readString(record.version),
    artists: readArtists(record),
    album: readAlbum(record),
    durationMs: typeof record.durationMs === "number" ? record.durationMs : undefined,
    isMusic: isMusicTrack(record),
  };
}

export function rememberTrack(track: TrackInfo): void {
  if (knownTracks.size >= MAX_TRACKS) {
    const oldestTrackId = knownTracks.keys().next().value;
    if (oldestTrackId !== undefined) knownTracks.delete(oldestTrackId);
  }

  knownTracks.delete(track.id);
  knownTracks.set(track.id, track);
}

export function getKnownTrack(trackId: string): TrackInfo | undefined {
  return knownTracks.get(trackId);
}

export function isTrackAllowed(trackId: string, unlockNonMusic: boolean): boolean {
  const track = knownTracks.get(trackId);
  if (!track) return unlockNonMusic;
  return unlockNonMusic || track.isMusic;
}
