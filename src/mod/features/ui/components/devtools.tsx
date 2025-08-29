import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { Alert, AlertDescription } from "@ui/components/ui/alert";

import { Info } from "lucide-react";

export function Devtools() {
  const [devtoolsEnabled, setDevtoolsEnabled] = useState(false);
  const [systemToolbarEnabled, setSystemToolbarEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      setDevtoolsEnabled((await window.yandexMusicMod.getStorageValue("devtools/enabled")) || false);
      setSystemToolbarEnabled((await window.yandexMusicMod.getStorageValue("devtools/systemToolbar")) || false);
    })();
  }, []);

  return (
    <ExpandableCard title="Для разработчиков">
      <div className="flex flex-col gap-5 pt-2 px-3">
        <div className="flex items-center gap-3">
          <Switch
            id="devtools-toggle"
            checked={devtoolsEnabled}
            onCheckedChange={(enabled) => {
              setDevtoolsEnabled(enabled);
              window.yandexMusicMod.setStorageValue("devtools/enabled", enabled);
            }}
          />
          <Label htmlFor="devtools-toggle" className="cursor-pointer">
            Включить режим разработчика
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="systemToolbar-toggle"
            checked={systemToolbarEnabled}
            onCheckedChange={(enabled) => {
              setSystemToolbarEnabled(enabled);
              window.yandexMusicMod.setStorageValue("devtools/systemToolbar", enabled);
            }}
          />
          <Label htmlFor="systemToolbar-toggle" className="cursor-pointer">
            Включить системную рамку окна
          </Label>
        </div>

        <Alert variant="default" className="cursor-default">
          <Info />
          <AlertDescription>Потребуется перезапуск</AlertDescription>
        </Alert>
      </div>
    </ExpandableCard>
  );
}
