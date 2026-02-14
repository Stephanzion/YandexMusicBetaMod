import { useEffect, useState } from "react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { If } from "@ui/components/ui/if";

import { Snowflake } from "lucide-react";

import Snowfall from "react-snowfall";

const getIsNewYear = () => {
  const date = new Date();
  const year = date.getFullYear();
  const start = new Date(year, 11, 10); // 10 декабря
  const end = new Date(year + 1, 0, 15); // 15 января следующего года

  return date >= start && date <= end;
};

export function NewYearSnowfallAnimation() {
  const [isNewYear, setIsNewYear] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const snowfallEnabled =
        (await window.yandexMusicMod.getStorageValue("snowfall/enabled")) === false ? false : true;
      setEnabled(snowfallEnabled || false);
    })();

    window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
      if (key.includes("snowfall/enabled")) setEnabled(value === false ? false : true);
    });

    setIsNewYear(getIsNewYear());

    const timer = setInterval(
      () => {
        setIsNewYear(getIsNewYear());
      },
      1000 * 60 * 60,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <If condition={enabled && isNewYear}>
      <Snowfall
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          zIndex: 99999,
        }}
        snowflakeCount={25}
        speed={[0.5, 3]}
        wind={[-0.5, 2]}
        radius={[1, 3]}
        color="white"
      />

      <style>
        {`
        .ym-dark-theme canvas[data-testid="SnowfallCanvas"]
        {
            opacity: 0.2;
        }
        `}
      </style>
    </If>
  );
}

export function NewYearSnowfall() {
  if (!getIsNewYear()) return null;

  const [snowfallEnabled, setSnowfallEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const snowfallEnabled =
        (await window.yandexMusicMod.getStorageValue("snowfall/enabled")) === false ? false : true;
      setSnowfallEnabled(snowfallEnabled || false);
    })();
  }, []);

  return (
    <ExpandableCard title="Падающий снежок" icon={<Snowflake className="h-4 w-4" />}>
      <div className="flex flex-col gap-5 pt-2 px-3">
        <div className="flex items-center gap-3">
          <Switch
            id="snowfall-toggle"
            checked={snowfallEnabled}
            onCheckedChange={(enabled) => {
              setSnowfallEnabled(enabled);
              window.yandexMusicMod.setStorageValue("snowfall/enabled", enabled);
            }}
          />
          <Label htmlFor="snowfall-toggle" className="cursor-pointer">
            Включить анимацию падающего снежка
          </Label>
        </div>
      </div>
    </ExpandableCard>
  );
}
