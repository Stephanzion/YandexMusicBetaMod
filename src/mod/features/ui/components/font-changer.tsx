import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/ui/select";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { If } from "@ui/components/ui/if";

import { Type } from "lucide-react";

import "@ui/assets/fonts/stylesheet.css";
import availableFontsRaw from "@ui/assets/fonts/fonts.json";
const availableFonts = availableFontsRaw.map((font) => font.name);

export function FontChanger() {
  const [customFontEnabled, setCustomFontEnabled] = useState(false);
  const [customFont, setCustomFont] = useState(availableFonts[0]);

  useEffect(() => {
    (async () => {
      let savedFont = await window.yandexMusicMod.getStorageValue("font-changer/savedFont");
      savedFont = availableFonts.find((font) => font === savedFont) || availableFonts[0];
      const savedFontEnabled = (await window.yandexMusicMod.getStorageValue("font-changer/enabled")) || false;

      setCustomFontEnabled(savedFontEnabled || false);
      setCustomFont(savedFont || availableFonts[0]);
    })();
  }, []);

  return (
    <ExpandableCard title="Замена шрифтов" icon={<Type className="h-4 w-4" />}>
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
