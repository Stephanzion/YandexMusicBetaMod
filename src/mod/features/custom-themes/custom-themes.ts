import customStyles from "./custom-themes.css?inline";

const stylesheetName = "yandex-music-mod-custom-themes-style";

let disableVibeAnimationTimer = setInterval(() => {}, 1000 * 60 * 60);

let customThemeEnabled = false;
let customThemeAccent = "#4A9EFF";

async function updateTheme() {
  const enabled = (await window.yandexMusicMod.getStorageValue("custom-themes/enabled")) === true ? true : false;
  const accent = await window.yandexMusicMod.getStorageValue("custom-themes/accent");
  const playerColorsReplaceEnabled =
    (await window.yandexMusicMod.getStorageValue("custom-themes/playerColorsReplace")) === false ? false : true;
  const disableVibeAnimation = await window.yandexMusicMod.getStorageValue("custom-themes/disableVibeAnimation");
  const disableExplicitMark = await window.yandexMusicMod.getStorageValue("custom-themes/disableExplicitMark");
  const hiddenMenuItems = (await window.yandexMusicMod.getStorageValue("custom-themes/hideMenuItems")) || [];

  console.log("[custom-themes]", {
    enabled,
    accent,
    playerColorsReplaceEnabled,
    disableVibeAnimation,
    disableExplicitMark,
    hiddenMenuItems,
  });

  customThemeEnabled = enabled;
  customThemeAccent = accent;

  document.getElementById(stylesheetName)?.remove();

  if (enabled && accent) {
    const styleSheet = document.createElement("style");
    styleSheet.id = stylesheetName;
    styleSheet.innerHTML = customStyles;

    styleSheet.innerHTML += `
      :root {
        --yandexMusicModAccent: ${accent};
      }`;

    if (playerColorsReplaceEnabled) {
      styleSheet.innerHTML += `
        .ym-dark-theme 
        section[data-test-id="PLAYERBAR_DESKTOP"]
        {
          --player-average-color-background: var(--yandexMusicModPalette-200) !important;
        }
        .ym-dark-theme 
        div[data-test-id="FULLSCREEN_PLAYER_MODAL"]
        {
          --player-average-color-background: var(--yandexMusicModPalette-200) !important;
        }
        .ym-light-theme
        section[data-test-id="PLAYERBAR_DESKTOP"],
        div[data-test-id="FULLSCREEN_PLAYER_MODAL"]
        {
          --player-average-color-background: var(--yandexMusicModPalette-700) !important;
        }
        .ym-dark-theme div[class*="_averageColorBackground__"] {
          background: linear-gradient(var(--yandexMusicModPalette-200, var(--ym-background-color-secondary-enabled-blur)) 0, transparent 100%); 
        }
        .ym-light-theme div[class*="_averageColorBackground__"] {
          background: linear-gradient(var(--yandexMusicModPalette-light-300, var(--ym-background-color-secondary-enabled-blur)) 0, transparent 100%); 
        }
      `;
    }

    clearInterval(disableVibeAnimationTimer);

    if (disableVibeAnimation) {
      styleSheet.innerHTML += `
        div[data-test-id="VIBE_BLOCK"] {
            height: 32vh !important;
            min-height: unset !important;
        }
        div[data-test-id="VIBE_ANIMATION"] {
          display: none!important;
        }
          `;

      disableVibeAnimationTimer = setInterval(() => {
        sendMessageToWorkers("vibe-animation-worker-disable", undefined);
      }, 2000);
    } else {
      sendMessageToWorkers("vibe-animation-worker-enable", undefined);
    }

    if (disableExplicitMark) {
      styleSheet.innerHTML += `
        span[class*="Meta_explicitMarkContainer__"], svg[class*="ExplicitMarkIcon_"], svg[class*="explicitMark__"] {
          display: none!important;
        }
      `;
    }

    if (hiddenMenuItems && hiddenMenuItems.length > 0) {
      for (const menuItem of hiddenMenuItems) {
        styleSheet.innerHTML += `
          aside[data-test-id="NAVBAR"] li:has(a[href="/${menuItem}"]) {
            display: none!important;
          }
        `;
      }
    }

    document.head.appendChild(styleSheet);

    updateVibeBackgroundColor();
  }
}

function updateVibeBackgroundColor() {
  function hexToHue(hex: string, offset = 0) {
    // убрать #
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
      switch (max) {
        case r:
          h = ((g - b) / d) % 6;
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

    // применяем смещение
    h = (h + offset) % 360;
    if (h < 0) h += 360;

    return h;
  }

  function getCssVarNormalizedRgb<T extends string | number>(varName: T): { r: number; g: number; b: number } | null {
    const el = document.createElement("div");
    el.style.display = "none";
    el.style.color = `var(${varName})`;
    document.body.appendChild(el);

    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);

    // Парсим color(srgb ...) или rgb(...)
    let match;
    if (computed.startsWith("color(srgb")) {
      match = computed.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)\)/);
      if (!match) return null;
      return { r: parseFloat(match[1]), g: parseFloat(match[2]), b: parseFloat(match[3]) };
    } else if (computed.startsWith("rgb")) {
      match = computed.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (!match) return null;
      return {
        r: parseInt(match[1], 10) / 255,
        g: parseInt(match[2], 10) / 255,
        b: parseInt(match[3], 10) / 255,
      };
    }

    return null;
  }

  const backgroundColor = getCssVarNormalizedRgb("--ym-background-color-primary-enabled-content");

  console.log("[custom-themes] updateVibeBackgroundColor", backgroundColor);

  if (!backgroundColor) return;

  sendMessageToWorkers("vibe-animation-worker-apply-settings", {
    isYandexMusicMod: true,
    backgroundColor: [backgroundColor.r, backgroundColor.g, backgroundColor.b],
  });

  if (customThemeEnabled) {
    sendMessageToWorkers("vibe-animation-worker-apply-settings", {
      isYandexMusicMod: true,
      collectionHue: hexToHue(customThemeAccent, 50),
      hue: hexToHue(customThemeAccent, 50),
      useDefaultHue: false,
    });
  }
}

window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
  if (key.includes("custom-themes")) updateTheme();
});

updateTheme();

// Перехват запросов к backgroundWorker
(function () {
  window.__workers = [];
  const OrigWorker = window.Worker as any;
  window.Worker = function (...args: any[]) {
    const worker = new OrigWorker(...args);
    const origPostMessage = worker.postMessage;
    window.__workers.push(worker);
    worker.postMessage = function (message, transfer) {
      if (message?.payload?.backgroundColor || message?.payload?.collectionHue) {
        if (!message?.payload?.isYandexMusicMod)
          setTimeout(() => {
            updateVibeBackgroundColor();
          }, 500);
      }

      return origPostMessage.call(worker, message, transfer);
    };
    return worker;
  };

  const _atob = atob;

  // Патч offscreen canvas который управляет vibe анимацией
  window.atob = function (str) {
    const decoded = _atob(str);
    if (decoded.includes("updateBackgroundColor(t){this.background=new c(t,t,t)}")) {
      const modified = decoded.replace(
        "updateBackgroundColor(t){this.background=new c(t,t,t)}",
        `
        updateBackgroundColor(t)
        {
            if(Array.isArray(t))
              this.background=new c(t[0],t[1],t[2]);
            else
              this.background=new c(t,t,t);
         }
        `,
      );
      console.log("[custom-themes] Modified vibe animation worker code");
      return modified;
    }
    return decoded;
  };
})();

function sendMessageToWorkers(type: string, message: any) {
  for (const worker of window.__workers.filter((worker) => !worker.objectURL))
    worker.postMessage({
      source: "vibe",
      type: type,
      payload: message,
    });
}
