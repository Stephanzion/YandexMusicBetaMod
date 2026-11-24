import { ensureSettingsLoaded, getSettings } from "./settings";
import type { BackgroundFit, BackgroundSettings } from "./settings";
import { getBackgroundImage } from "./storage";

const STYLE_ID = "yandex-music-mod-background-style";
const IMAGE_LAYER_ID = "yandex-music-mod-background";
const DIM_LAYER_ID = "yandex-music-mod-background-dim";

const FIT_STYLES: Record<BackgroundFit, { size: string; repeat: string }> = {
  cover: { size: "cover", repeat: "no-repeat" },
  contain: { size: "contain", repeat: "no-repeat" },
  stretch: { size: "100% 100%", repeat: "no-repeat" },
  tile: { size: "auto", repeat: "repeat" },
};

const TRANSPARENT_SELECTORS = [
  '[class*="CommonLayout_root"]',
  '[class*="WithTopBanner_root"]',
  '[class*="TitleBar_root"]',
  '[class*="Navbar_root"]',
  '[class*="Content_main"]',
];

let applyPromise: Promise<void> | null = null;
let applyAgain = false;
let initialized = false;

function mountContainer(): HTMLElement {
  return document.body ?? document.documentElement;
}

function ensureImageLayer(): HTMLDivElement {
  let layer = document.getElementById(IMAGE_LAYER_ID) as HTMLDivElement | null;
  if (layer) return layer;

  layer = document.createElement("div");
  layer.id = IMAGE_LAYER_ID;
  layer.setAttribute("aria-hidden", "true");
  layer.style.position = "fixed";
  layer.style.inset = "0";
  layer.style.zIndex = "-1";
  layer.style.backgroundPosition = "center center";
  layer.style.transformOrigin = "center center";
  layer.style.pointerEvents = "none";
  mountContainer().prepend(layer);

  return layer;
}

function ensureDimLayer(): HTMLDivElement {
  let layer = document.getElementById(DIM_LAYER_ID) as HTMLDivElement | null;
  if (layer) return layer;

  layer = document.createElement("div");
  layer.id = DIM_LAYER_ID;
  layer.setAttribute("aria-hidden", "true");
  layer.style.position = "fixed";
  layer.style.inset = "0";
  layer.style.zIndex = "-1";
  layer.style.pointerEvents = "none";

  const imageLayer = ensureImageLayer();
  imageLayer.after(layer);

  return layer;
}

function ensureStyle(): HTMLStyleElement {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (style) return style;

  style = document.createElement("style");
  style.id = STYLE_ID;
  document.head.appendChild(style);

  return style;
}

function hideLayers(): void {
  ensureImageLayer().style.display = "none";
  ensureDimLayer().style.display = "none";
  ensureStyle().textContent = "";
}

function paint(settings: BackgroundSettings, dataUrl: string): void {
  const imageLayer = ensureImageLayer();
  const dimLayer = ensureDimLayer();
  const fit = FIT_STYLES[settings.fit];

  imageLayer.style.display = "block";
  imageLayer.style.backgroundImage = `url("${dataUrl}")`;
  imageLayer.style.backgroundSize = fit.size;
  imageLayer.style.backgroundRepeat = fit.repeat;
  imageLayer.style.backgroundColor = settings.fit === "contain" ? "#0a0a0f" : "transparent";
  imageLayer.style.filter = settings.blur > 0 ? `blur(${settings.blur}px)` : "none";
  imageLayer.style.transform = settings.blur > 0 ? `scale(${1 + settings.blur / 200})` : "none";

  dimLayer.style.display = "block";
  dimLayer.style.background = `rgba(0, 0, 0, ${settings.dim / 100})`;

  ensureStyle().textContent = `
    html, body {
      background-color: transparent !important;
    }
    ${TRANSPARENT_SELECTORS.join(",\n    ")} {
      background-color: transparent !important;
    }
  `;
}

async function applyNow(): Promise<void> {
  await ensureSettingsLoaded();

  const settings = getSettings();
  if (!settings.enabled) {
    hideLayers();
    return;
  }

  const image = await getBackgroundImage();
  if (!image?.dataUrl) {
    hideLayers();
    return;
  }

  paint(settings, image.dataUrl);
}

export function refreshBackground(): Promise<void> {
  if (applyPromise) {
    applyAgain = true;
    return applyPromise;
  }

  applyPromise = applyNow()
    .catch((error) => {
      console.error("[Backgrounds] Failed to apply background:", error);
    })
    .finally(() => {
      applyPromise = null;

      if (applyAgain) {
        applyAgain = false;
        void refreshBackground();
      }
    });

  return applyPromise;
}

export function initBackgrounds(): void {
  if (initialized) return;
  initialized = true;

  const start = () => void refreshBackground();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.yandexMusicMod.onStorageChanged((key: string) => {
    if (key.startsWith("backgrounds/")) void refreshBackground();
  });
}
