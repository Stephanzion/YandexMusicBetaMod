import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";

import { FaDiscord } from "react-icons/fa";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@ui/components/ui/alert";

export function DiscordRPC() {
  const [discordRPCEnabled, setDiscordRPCEnabled] = useState(true);
  const [showModButton, setShowModButton] = useState(true);

  useEffect(() => {
    (async () => {
      setDiscordRPCEnabled(
        (await window.yandexMusicMod.getStorageValue("discordRPC/enabled")) === false ? false : true,
      );
      setShowModButton(
        (await window.yandexMusicMod.getStorageValue("discordRPC/showModButton")) === false ? false : true,
      );
    })();
  }, []);

  return (
    <ExpandableCard title="Интеграция с Discord" icon={<FaDiscord className="h-4 w-4" />}>
      <div className="flex flex-col gap-5 pt-2 px-3">
        <Alert variant="default" className="cursor-default">
          <Info />
          <div className="text-sm text-muted-foreground">
            Для корректной работы интеграции с Discord, запускайте Яндекс Музыку от имени администратора
          </div>
        </Alert>

        <div className="flex items-center gap-3">
          <Switch
            id="discord-rpc-toggle"
            checked={discordRPCEnabled}
            onCheckedChange={(enabled) => {
              setDiscordRPCEnabled(enabled);
              window.yandexMusicMod.setStorageValue("discordRPC/enabled", enabled);
            }}
          />
          <Label htmlFor="discord-rpc-toggle" className="cursor-pointer">
            Показывать текущий трек в профиле Discord
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="discord-mod-button-toggle"
            checked={showModButton}
            onCheckedChange={(enabled) => {
              setShowModButton(enabled);
              window.yandexMusicMod.setStorageValue("discordRPC/showModButton", enabled);
            }}
          />
          <Label htmlFor="discord-mod-button-toggle" className="cursor-pointer">
            Показывать кнопку YandexMusicMod
          </Label>
        </div>
      </div>
    </ExpandableCard>
  );
}
