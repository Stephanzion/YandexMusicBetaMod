export type LyricsFormat = "TEXT" | "LRC";

export interface TrackInfo {
  id: string;
  title: string;
  version?: string;
  artists: string[];
  album?: string;
  durationMs?: number;
  isMusic: boolean;
}

export interface LrclibRecord {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}
