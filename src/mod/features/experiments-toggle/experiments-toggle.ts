import { onYandexApiResponse } from "~/mod/features/utils/utils";

let experimentsOverride: any[] = [];

(async () => {
  const experimentsOverrideValue =
    (await window.yandexMusicMod.getStorageValue("settings/accountExperimentsOverride")) || [];

  console.log("[experimentsOverride] ", experimentsOverrideValue);

  if (experimentsOverrideValue && experimentsOverrideValue.length > 0) {
    experimentsOverride = [...experimentsOverrideValue];
  }
})();

onYandexApiResponse("/account/experiments/details", async function (response: any) {
  console.log(`[experimentsOverride] Original experiments:`, response.data);

  if (!experimentsOverride || experimentsOverride.length === 0) {
    console.log(`[experimentsOverride] No overrides configured, returning original data`);
    return response.data;
  }

  // Clone the original response data
  const modifiedData = { ...response.data };

  // Apply overrides from settings
  experimentsOverride.forEach((override: any) => {
    if (override.id && modifiedData[override.id]) {
      console.log(`[experimentsOverride] Overriding experiment ${override.id}:`, override.value);
      modifiedData[override.id] = override.value;
    } else if (override.id) {
      console.log(`[experimentsOverride] Adding new experiment ${override.id}:`, override.value);
      modifiedData[override.id] = override.value;
    }
  });

  console.log(`[experimentsOverride] Modified experiments:`, modifiedData);
  return modifiedData;
});
