import { getSettings } from "./settings";
import { isTrackLike, readTrackInfo, rememberTrack } from "./track-cache";
import type { TrackInfo } from "./types";

const MAX_DEPTH = 64;
const MAX_NODES = 50_000;

interface PatchTarget {
  track: Record<string, unknown>;
  info: TrackInfo;
}

interface VisitState {
  preferSynced: boolean;
  unlockNonMusic: boolean;
  visited: WeakSet<object>;
  nodes: number;
  failed: boolean;
  aborted: boolean;
  targets: PatchTarget[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function visit(value: unknown, depth: number, state: VisitState): void {
  if (state.failed || state.aborted) return;

  state.nodes += 1;

  if (state.nodes > MAX_NODES) {
    state.aborted = true;
    console.warn(`[LrclibLyrics] Response is too large, metadata patching skipped (${MAX_NODES} nodes)`);
    return;
  }

  if (depth > MAX_DEPTH) {
    state.aborted = true;
    console.warn(`[LrclibLyrics] Response is too deep, metadata patching skipped (${MAX_DEPTH} levels)`);
    return;
  }

  try {
    if (Array.isArray(value)) {
      if (state.visited.has(value)) return;
      state.visited.add(value);

      for (const item of value) {
        visit(item, depth + 1, state);
      }
      return;
    }

    if (!isRecord(value)) return;
    if (state.visited.has(value)) return;
    state.visited.add(value);

    if (isTrackLike(value)) {
      const info = readTrackInfo(value);
      if (info) {
        state.targets.push({ track: value, info });
      }
    }

    for (const child of Object.values(value)) {
      visit(child, depth + 1, state);
    }
  } catch (error) {
    state.failed = true;
    console.error("[LrclibLyrics] Failed to traverse track metadata:", error);
  }
}

function applyPatches(state: VisitState): void {
  for (const { track, info } of state.targets) {
    try {
      rememberTrack(info);

      if (!state.unlockNonMusic && !info.isMusic) continue;

      const lyricsInfo = isRecord(track.lyricsInfo) ? track.lyricsInfo : {};

      track.lyricsInfo = {
        ...lyricsInfo,
        hasAvailableTextLyrics: true,
        hasAvailableSyncLyrics: state.preferSynced,
      };
      track.lyricsAvailable = true;
    } catch (error) {
      console.error("[LrclibLyrics] Failed to patch track:", error);
    }
  }
}

export function patchTracksInResponse(data: unknown): unknown {
  try {
    const settings = getSettings();
    if (!settings.enabled) return data;

    const state: VisitState = {
      preferSynced: settings.preferSynced,
      unlockNonMusic: settings.unlockNonMusic,
      visited: new WeakSet<object>(),
      nodes: 0,
      failed: false,
      aborted: false,
      targets: [],
    };

    visit(data, 0, state);

    // Do not apply partial patches if traversal failed or hit a safety limit.
    if (state.failed || state.aborted) return data;

    applyPatches(state);
  } catch (error) {
    console.error("[LrclibLyrics] Failed to patch track metadata:", error);
  }

  return data;
}
