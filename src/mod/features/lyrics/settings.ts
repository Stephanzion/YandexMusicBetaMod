export interface LyricsSettings {
  enabled: boolean;
  preferSynced: boolean;
  unlockNonMusic: boolean;
}

export const LYRICS_SETTINGS_KEYS = {
  enabled: "lyrics/enabled",
  preferSynced: "lyrics/preferSynced",
  unlockNonMusic: "lyrics/unlockNonMusic",
} as const;

const DEFAULT_SETTINGS: LyricsSettings = {
  enabled: true,
  preferSynced: true,
  unlockNonMusic: false,
};

let currentSettings: LyricsSettings = { ...DEFAULT_SETTINGS };
let settingsLoadingPromise: Promise<void> | null = null;

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

async function loadSettings(): Promise<void> {
  const [enabled, preferSynced, unlockNonMusic] = await Promise.all([
    window.yandexMusicMod.getStorageValue(LYRICS_SETTINGS_KEYS.enabled),
    window.yandexMusicMod.getStorageValue(LYRICS_SETTINGS_KEYS.preferSynced),
    window.yandexMusicMod.getStorageValue(LYRICS_SETTINGS_KEYS.unlockNonMusic),
  ]);

  currentSettings = {
    enabled: readBoolean(enabled, DEFAULT_SETTINGS.enabled),
    preferSynced: readBoolean(preferSynced, DEFAULT_SETTINGS.preferSynced),
    unlockNonMusic: readBoolean(unlockNonMusic, DEFAULT_SETTINGS.unlockNonMusic),
  };
}

export function ensureSettingsLoaded(): Promise<void> {
  if (!settingsLoadingPromise) {
    settingsLoadingPromise = loadSettings().catch((error) => {
      console.error("[Lyrics] Failed to load settings:", error);
    });
  }

  return settingsLoadingPromise;
}

export function getSettings(): LyricsSettings {
  return currentSettings;
}

export function initSettings(): void {
  void ensureSettingsLoaded();

  window.yandexMusicMod.onStorageChanged((key: string, value: unknown) => {
    switch (key) {
      case LYRICS_SETTINGS_KEYS.enabled:
        currentSettings = { ...currentSettings, enabled: readBoolean(value, DEFAULT_SETTINGS.enabled) };
        break;
      case LYRICS_SETTINGS_KEYS.preferSynced:
        currentSettings = { ...currentSettings, preferSynced: readBoolean(value, DEFAULT_SETTINGS.preferSynced) };
        break;
      case LYRICS_SETTINGS_KEYS.unlockNonMusic:
        currentSettings = {
          ...currentSettings,
          unlockNonMusic: readBoolean(value, DEFAULT_SETTINGS.unlockNonMusic),
        };
        break;
    }
  });
}
