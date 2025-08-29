import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/ui/select";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { If } from "@ui/components/ui/if";

const availableFonts = ["JetBrains Mono", "Lato", "Inter", "Rubik", "Ubuntu", "Roboto Slab", "Quicksand", "Pacifico"];

export function FontChanger() {
  const [customFontEnabled, setCustomFontEnabled] = useState(false);
  const [customFont, setCustomFont] = useState(availableFonts[0]);

  useEffect(() => {
    (async () => {
      const savedFont = await window.yandexMusicMod.getStorageValue("font-changer/font");
      if (!savedFont) window.yandexMusicMod.setStorageValue("font-changer/font", availableFonts[0]);

      setCustomFontEnabled((await window.yandexMusicMod.getStorageValue("font-changer/enabled")) || false);
      setCustomFont(savedFont || availableFonts[0]);
    })();
  }, []);

  return (
    <ExpandableCard title="Замена шрифтов">
      <div className="flex flex-col gap-5 pt-2 px-3">
        <div className="flex items-center gap-3">
          <Switch
            id="font-changer-toggle"
            checked={customFontEnabled}
            onCheckedChange={(enabled) => {
              setCustomFontEnabled(enabled);
              window.yandexMusicMod.setStorageValue("font-changer/enabled", enabled);
            }}
          />
          <Label htmlFor="font-changer-toggle" className="cursor-pointer">
            Заменить шрифты в приложении
          </Label>
        </div>

        <If condition={customFontEnabled}>
          <div className="flex gap-4 items-center justify-center">
            <span className="text-sm text-foreground">Шрифт:</span>
            <Select
              value={customFont}
              onValueChange={(value: string) => {
                setCustomFont(value);
                window.yandexMusicMod.setStorageValue("font-changer/savedFont", value);
              }}
              disabled={!customFontEnabled}
            >
              <SelectTrigger className="w-full text-foreground">
                <SelectValue placeholder="Выбрать шрифт" />
              </SelectTrigger>
              <SelectContent>
                {availableFonts.map((font) => (
                  <SelectItem value={font}>{font}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </If>
      </div>
    </ExpandableCard>
  );
}
