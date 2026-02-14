import * as Sentry from "@sentry/react";

let exeptionsCaptureEnabled = true;

function updateExeptionsCaptureEnabled() {
  // @ts-ignore
  if (exeptionsCaptureEnabled) window.__yandexMusicModAnalyticsEnabled = true;
  // @ts-ignore
  else window.__yandexMusicModAnalyticsEnabled = false;
}

window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
  if (key === "settings/exeptionsCaptureEnabled") exeptionsCaptureEnabled = value === false ? false : true;
  updateExeptionsCaptureEnabled();
});

(async () => {
  exeptionsCaptureEnabled =
    (await window.yandexMusicMod.getStorageValue("settings/exeptionsCaptureEnabled")) === false ? false : true;
  updateExeptionsCaptureEnabled();
})();
