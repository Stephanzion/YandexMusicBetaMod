import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";

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
    <ExpandableCard title="Интеграция с Discord">
      <div className="flex flex-col gap-5 pt-2 px-3">
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
