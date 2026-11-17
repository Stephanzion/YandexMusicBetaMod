import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { If } from "@ui/components/ui/if";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";

import { FileText } from "lucide-react";

import { LRCLIB_SETTINGS_KEYS } from "~/mod/features/lrclib-lyrics/settings";

export function LrclibLyrics() {
  const [enabled, setEnabled] = useState(true);
  const [preferSynced, setPreferSynced] = useState(true);
  const [yandexFallback, setYandexFallback] = useState(true);
  const [unlockNonMusic, setUnlockNonMusic] = useState(false);

  useEffect(() => {
    (async () => {
      const [enabledValue, preferSyncedValue, yandexFallbackValue, unlockNonMusicValue] = await Promise.all([
        window.yandexMusicMod.getStorageValue(LRCLIB_SETTINGS_KEYS.enabled),
        window.yandexMusicMod.getStorageValue(LRCLIB_SETTINGS_KEYS.preferSynced),
        window.yandexMusicMod.getStorageValue(LRCLIB_SETTINGS_KEYS.yandexFallback),
        window.yandexMusicMod.getStorageValue(LRCLIB_SETTINGS_KEYS.unlockNonMusic),
      ]);

      setEnabled(enabledValue !== false);
      setPreferSynced(preferSyncedValue !== false);
      setYandexFallback(yandexFallbackValue !== false);
      setUnlockNonMusic(unlockNonMusicValue === true);
    })();
  }, []);

  return (
    <ExpandableCard title="Тексты песен" icon={<FileText className="h-4 w-4" />}>
      <div className="flex flex-col gap-5 pt-2 px-3">
        <div className="flex items-center gap-3">
          <Switch
            id="lrclib-lyrics-toggle"
            checked={enabled}
            onCheckedChange={(value) => {
              setEnabled(value);
              window.yandexMusicMod.setStorageValue(LRCLIB_SETTINGS_KEYS.enabled, value);
            }}
          />
          <Label htmlFor="lrclib-lyrics-toggle" className="cursor-pointer">
            Включить тексты песен
          </Label>
        </div>

        <If condition={enabled}>
          <div className="flex items-center gap-3">
            <Switch
              id="lrclib-sync-toggle"
              checked={preferSynced}
              onCheckedChange={(value) => {
                setPreferSynced(value);
                window.yandexMusicMod.setStorageValue(LRCLIB_SETTINGS_KEYS.preferSynced, value);
              }}
            />
            <Label htmlFor="lrclib-sync-toggle" className="cursor-pointer">
              Синхронизированные тексты
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="lrclib-fallback-toggle"
              checked={yandexFallback}
              onCheckedChange={(value) => {
                setYandexFallback(value);
                window.yandexMusicMod.setStorageValue(LRCLIB_SETTINGS_KEYS.yandexFallback, value);
              }}
            />
            <Label htmlFor="lrclib-fallback-toggle" className="cursor-pointer">
              Тексты Яндекса, если нет в LRCLib
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="lrclib-nonmusic-toggle"
              checked={unlockNonMusic}
              onCheckedChange={(value) => {
                setUnlockNonMusic(value);
                window.yandexMusicMod.setStorageValue(LRCLIB_SETTINGS_KEYS.unlockNonMusic, value);
              }}
            />
            <Label htmlFor="lrclib-nonmusic-toggle" className="cursor-pointer">
              Тексты для подкастов и UGC
            </Label>
          </div>

          <p className="text-sm text-muted-foreground">
            Тексты загружаются из LRCLib и кэшируются. Если текста нет, можно взять его из Яндекс Музыки.
          </p>
        </If>
      </div>
    </ExpandableCard>
  );
}
