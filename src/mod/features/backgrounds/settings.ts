export type BackgroundFit = "cover" | "contain" | "stretch" | "tile";

export interface BackgroundSettings {
  enabled: boolean;
  blur: number;
  dim: number;
  fit: BackgroundFit;
}

export const BACKGROUND_SETTINGS_KEYS = {
  enabled: "backgrounds/enabled",
  blur: "backgrounds/blur",
  dim: "backgrounds/dim",
  fit: "backgrounds/fit",
} as const;

export const BACKGROUND_LIMITS = {
  blur: { min: 0, max: 40, fallback: 12 },
  dim: { min: 0, max: 90, fallback: 45 },
} as const;

const DEFAULT_SETTINGS: BackgroundSettings = {
  enabled: false,
  blur: BACKGROUND_LIMITS.blur.fallback,
  dim: BACKGROUND_LIMITS.dim.fallback,
  fit: "cover",
};

const FITS: BackgroundFit[] = ["cover", "contain", "stretch", "tile"];

let currentSettings: BackgroundSettings = { ...DEFAULT_SETTINGS };
let settingsLoadingPromise: Promise<void> | null = null;

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function readFit(value: unknown): BackgroundFit {
  return typeof value === "string" && (FITS as string[]).includes(value)
    ? (value as BackgroundFit)
    : DEFAULT_SETTINGS.fit;
}

async function loadSettings(): Promise<void> {
  const [enabled, blur, dim, fit] = await Promise.all([
    window.yandexMusicMod.getStorageValue(BACKGROUND_SETTINGS_KEYS.enabled),
    window.yandexMusicMod.getStorageValue(BACKGROUND_SETTINGS_KEYS.blur),
    window.yandexMusicMod.getStorageValue(BACKGROUND_SETTINGS_KEYS.dim),
    window.yandexMusicMod.getStorageValue(BACKGROUND_SETTINGS_KEYS.fit),
  ]);

  currentSettings = {
    enabled: readBoolean(enabled, DEFAULT_SETTINGS.enabled),
    blur: readNumber(blur, DEFAULT_SETTINGS.blur, BACKGROUND_LIMITS.blur.min, BACKGROUND_LIMITS.blur.max),
    dim: readNumber(dim, DEFAULT_SETTINGS.dim, BACKGROUND_LIMITS.dim.min, BACKGROUND_LIMITS.dim.max),
    fit: readFit(fit),
  };
}

export function ensureSettingsLoaded(): Promise<void> {
  if (!settingsLoadingPromise) {
    settingsLoadingPromise = loadSettings().catch((error) => {
      console.error("[Backgrounds] Failed to load settings:", error);
    });
  }

  return settingsLoadingPromise;
}

export function getSettings(): BackgroundSettings {
  return currentSettings;
}

export function initSettings(): void {
  void ensureSettingsLoaded();

  window.yandexMusicMod.onStorageChanged((key: string, value: unknown) => {
    switch (key) {
      case BACKGROUND_SETTINGS_KEYS.enabled:
        currentSettings = { ...currentSettings, enabled: readBoolean(value, DEFAULT_SETTINGS.enabled) };
        break;
      case BACKGROUND_SETTINGS_KEYS.blur:
        currentSettings = {
          ...currentSettings,
          blur: readNumber(value, DEFAULT_SETTINGS.blur, BACKGROUND_LIMITS.blur.min, BACKGROUND_LIMITS.blur.max),
        };
        break;
      case BACKGROUND_SETTINGS_KEYS.dim:
        currentSettings = {
          ...currentSettings,
          dim: readNumber(value, DEFAULT_SETTINGS.dim, BACKGROUND_LIMITS.dim.min, BACKGROUND_LIMITS.dim.max),
        };
        break;
      case BACKGROUND_SETTINGS_KEYS.fit:
        currentSettings = { ...currentSettings, fit: readFit(value) };
        break;
    }
  });
}
