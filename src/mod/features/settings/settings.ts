import posthog from "posthog-js";

let exeptionsCaptureEnabled = true;

function updateExeptionsCaptureEnabled() {
  if (exeptionsCaptureEnabled) posthog.opt_in_capturing();
  else posthog.opt_out_capturing();
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
