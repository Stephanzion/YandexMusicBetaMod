import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";

export function AutoBestQuality() {
  const [autoBestQualityEnabled, setAutoBestQualityEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      setAutoBestQualityEnabled(
        (await window.yandexMusicMod.getStorageValue("autoBestQuality/enabled")) === false ? false : true,
      );
    })();
  }, []);

  return (
    <ExpandableCard title="Авто-выбор качества">
      <div className="flex flex-col gap-5 pt-2 px-3">
        <div className="flex items-center gap-3">
          <Switch
            id="auto-quality-toggle"
            checked={autoBestQualityEnabled}
            onCheckedChange={(enabled) => {
              setAutoBestQualityEnabled(enabled);
              window.yandexMusicMod.setStorageValue("autoBestQuality/enabled", enabled);
            }}
          />
          <Label htmlFor="auto-quality-toggle" className="cursor-pointer">
            Высокое качество музыки по умолчанию
          </Label>
        </div>
      </div>
    </ExpandableCard>
  );
}
