import { useEffect, useState } from "react";
import axios from "axios";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Button } from "@ui/components/ui/button";
import { Switch } from "@ui/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/components/ui/tooltip";
import { toast } from "sonner";

export function Settings() {
  const [exeptionsCaptureEnabled, setExeptionsCaptureEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      setExeptionsCaptureEnabled(
        (await window.yandexMusicMod.getStorageValue("settings/exeptionsCaptureEnabled")) === false ? false : true,
      );
    })();
  }, []);

  async function handleCopyAuthData() {
    const accessToken = localStorage.oauth ? "OAuth " + JSON.parse(localStorage.oauth).value : null;

    const experimentsResponse = await axios.get("https://api.music.yandex.net/account/experiments/details", {
      method: "GET",
      headers: {
        "x-yandex-music-client": "YandexMusicDesktopAppWindows/" + window.VERSION,
        "x-yandex-music-without-invocation-info": "1",
        Authorization: accessToken,
      },
    });

    if (experimentsResponse.status !== 200) {
      console.error("Failed to save experiments", experimentsResponse.status);
      return;
    }

    const data = {
      accessToken: localStorage.oauth ? "OAuth " + JSON.parse(localStorage.oauth).value : null,
      experiments: experimentsResponse.data,
    };

    toast.success("Данные авторизации скопированы");

    return navigator.clipboard.writeText(JSON.stringify(data));
  }

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

        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger>
              <Button onClick={handleCopyAuthData}>Скопировать данные авторизации</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Если разработчик попросит вас дать доступ к своему аккаунту, вы можете поделиться этими данными.</p>
              <br />
              <p>Не передавайте их кому-либо еще.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </ExpandableCard>
  );
}
