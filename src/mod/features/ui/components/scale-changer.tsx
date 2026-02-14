import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/ui/select";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { Slider } from "@ui/components/ui/slider";
import { Button } from "@ui/components/ui/button";
import { If } from "@ui/components/ui/if";

import { Expand } from "lucide-react";

export function ScaleChanger() {
  const [customScale, setCustomScale] = useState(1);

  useEffect(() => {
    (async () => {
      const savedScale = await window.yandexMusicMod.getStorageValue("scale-changer/savedScale");
      if (!savedScale) window.yandexMusicMod.setStorageValue("scale-changer/savedScale", 1);

      setCustomScale(savedScale || 1);
    })();
  }, []);

  return (
    <ExpandableCard title="Размер интерфейса" icon={<Expand className="h-4 w-4" />}>
      <div className="flex flex-col gap-4 pt-2 px-3 items-center justify-center">
        <div className="flex gap-3 items-center w-full">
          <span className="text-sm text-muted-foreground">Размер интерфейса: {customScale.toFixed(2)}x</span>
          <Button
            className="text-sm"
            variant="ghost"
            onClick={() => {
              setCustomScale(1);
              window.yandexMusicMod.setStorageValue("scale-changer/savedScale", 1);
            }}
          >
            Сбросить
          </Button>
        </div>

        <Slider
          defaultValue={[customScale]}
          value={[customScale]}
          min={0.3}
          max={2}
          step={0.05}
          onValueChange={(value) => {
            setCustomScale(value[0]!);
            window.yandexMusicMod.setStorageValue("scale-changer/savedScale", value[0]!);
          }}
        />
      </div>
    </ExpandableCard>
  );
}
