export interface LrclibLyricsSettings {
  enabled: boolean;
  preferSynced: boolean;
  yandexFallback: boolean;
  unlockNonMusic: boolean;
}

export const LRCLIB_SETTINGS_KEYS = {
  enabled: "lrclib-lyrics/enabled",
  preferSynced: "lrclib-lyrics/preferSynced",
  yandexFallback: "lrclib-lyrics/yandexFallback",
  unlockNonMusic: "lrclib-lyrics/unlockNonMusic",
} as const;

const DEFAULT_SETTINGS: LrclibLyricsSettings = {
  enabled: true,
  preferSynced: true,
  yandexFallback: true,
  unlockNonMusic: false,
};

let currentSettings: LrclibLyricsSettings = { ...DEFAULT_SETTINGS };
let settingsLoadingPromise: Promise<void> | null = null;

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

async function loadSettings(): Promise<void> {
  const [enabled, preferSynced, yandexFallback, unlockNonMusic] = await Promise.all([
    window.yandexMusicMod.getStorageValue(LRCLIB_SETTINGS_KEYS.enabled),
    window.yandexMusicMod.getStorageValue(LRCLIB_SETTINGS_KEYS.preferSynced),
    window.yandexMusicMod.getStorageValue(LRCLIB_SETTINGS_KEYS.yandexFallback),
    window.yandexMusicMod.getStorageValue(LRCLIB_SETTINGS_KEYS.unlockNonMusic),
  ]);

  currentSettings = {
    enabled: readBoolean(enabled, DEFAULT_SETTINGS.enabled),
    preferSynced: readBoolean(preferSynced, DEFAULT_SETTINGS.preferSynced),
    yandexFallback: readBoolean(yandexFallback, DEFAULT_SETTINGS.yandexFallback),
    unlockNonMusic: readBoolean(unlockNonMusic, DEFAULT_SETTINGS.unlockNonMusic),
  };
}

export function ensureSettingsLoaded(): Promise<void> {
  if (!settingsLoadingPromise) {
    settingsLoadingPromise = loadSettings().catch((error) => {
      console.error("[LrclibLyrics] Failed to load settings:", error);
    });
  }

  return settingsLoadingPromise;
}

export function getSettings(): LrclibLyricsSettings {
  return currentSettings;
}

export function initSettings(): void {
  void ensureSettingsLoaded();

  window.yandexMusicMod.onStorageChanged((key: string, value: unknown) => {
    switch (key) {
      case LRCLIB_SETTINGS_KEYS.enabled:
        currentSettings = {
          ...currentSettings,
          enabled: readBoolean(value, DEFAULT_SETTINGS.enabled),
        };
        break;
      case LRCLIB_SETTINGS_KEYS.preferSynced:
        currentSettings = {
          ...currentSettings,
          preferSynced: readBoolean(value, DEFAULT_SETTINGS.preferSynced),
        };
        break;
      case LRCLIB_SETTINGS_KEYS.yandexFallback:
        currentSettings = {
          ...currentSettings,
          yandexFallback: readBoolean(value, DEFAULT_SETTINGS.yandexFallback),
        };
        break;
      case LRCLIB_SETTINGS_KEYS.unlockNonMusic:
        currentSettings = {
          ...currentSettings,
          unlockNonMusic: readBoolean(value, DEFAULT_SETTINGS.unlockNonMusic),
        };
        break;
    }
  });
}
