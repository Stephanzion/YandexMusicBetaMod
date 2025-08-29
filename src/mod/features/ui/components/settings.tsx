import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";

export function Settings() {
  const [exeptionsCaptureEnabled, setExeptionsCaptureEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      setExeptionsCaptureEnabled(
        (await window.yandexMusicMod.getStorageValue("settings/exeptionsCaptureEnabled")) === false ? false : true,
      );
    })();
  }, []);

  return (
    <ExpandableCard title="Настройки">
      <div className="flex flex-col gap-5 pt-2 px-3">
        <div className="flex items-center gap-3">
          <Switch
            id="settings-exeptions-capture-toggle"
            checked={exeptionsCaptureEnabled}
            onCheckedChange={(enabled) => {
              setExeptionsCaptureEnabled(enabled);
              window.yandexMusicMod.setStorageValue("settings/exeptionsCaptureEnabled", enabled);
            }}
          />
          <Label htmlFor="settings-exeptions-capture-toggle" className="cursor-pointer">
            Делиться анонимной статистикой ошибок в приложении
          </Label>
        </div>
      </div>
    </ExpandableCard>
  );
}
