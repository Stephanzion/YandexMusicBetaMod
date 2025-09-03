import { useMemo, useState, useEffect, useRef } from "react";

import {
  getPlaylistTracks,
  getTracksInfo,
  likeTrack,
  getAccountInfo,
  getLikesAndHistory,
  updateAccountSettings,
} from "~/mod/features/utils/downloader";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Button } from "@ui/components/ui/button";
import { If } from "@ui/components/ui/if";
import { Progress } from "@ui/components/ui/progress";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@ui/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/ui/select";
import { Input } from "@ui/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/components/ui/tooltip";

import { Info } from "lucide-react";

export function AutoLiker() {
  const [isInProgress, setIsInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatusText, setProgressStatusText] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const stopSignal = useRef(false);

  const handleButtonClick = async () => {
    if (isInProgress) {
      stopSignal.current = true;
      return;
    }

    stopSignal.current = false;

    setIsInProgress(true);
    setProgress(0);
    setProgressStatusText("Получение информации о плейлисте");

    const playlistId = playlistUrl.match(/playlists\/([a-z0-9-\.]+)/)?.[1] || "";

    if (!playlistId) {
      toast.error("Произошла ошибка", {
        description: "Не удалось получить информацию о плейлисте",
      });
      setIsInProgress(false);
      return;
    }

    const trackIds = await getPlaylistTracks(playlistId);

    if (trackIds.isErr()) {
      toast.error("Произошла ошибка", {
        description: trackIds.error,
      });
      setIsInProgress(false);
      return;
    }

    const accountInfo = await getAccountInfo();

    if (accountInfo.isErr()) {
      toast.error("Произошла ошибка", {
        description: accountInfo.error,
      });
      setIsInProgress(false);
      return;
    }

    const userId = accountInfo.value.uid;

    console.log("[AutoLiker] userId", userId);

    for (var i = 0; i < trackIds.value.length; i++) {
      if (stopSignal.current) {
        setIsInProgress(false);
        return;
      }

      setProgressStatusText(`Добавление треков ${i + 1} / ${trackIds.value.length}`);
      setProgress((i / trackIds.value.length) * 100);

      const result = await likeTrack(userId, trackIds.value[i]!);

      if (result.isErr()) {
        toast.error("Произошла ошибка", {
          description: result.error,
        });
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsInProgress(false);
  };

  const handleCopyPlaylistLink = async () => {
    const likesAndHistory = await getLikesAndHistory();

    if (likesAndHistory.isErr()) {
      return toast.error("Произошла ошибка", {
        description: likesAndHistory.error,
      });
    }

    if (!likesAndHistory.value.favorites?.playlistUuid) {
      return toast.error("Произошла ошибка", {
        description: "Не удалось получить информацию о плейлисте",
      });
    }

    const updateVisabilityResult = await updateAccountSettings("userMusicVisibility", "PUBLIC");

    if (updateVisabilityResult.isErr()) {
      return toast.error("Произошла ошибка", {
        description: updateVisabilityResult.error,
      });
    }

    await navigator.clipboard.writeText(
      `https://music.yandex.ru/playlists/${likesAndHistory.value.favorites.playlistUuid}`,
    );

    toast.success("Ссылка скопирована", {
      description: "Ссылка на плейлист скопирована в буфер обмена",
    });
  };

  return (
    <ExpandableCard title="Перенести треки из плейлиста" opened={false}>
      <div className="flex flex-col gap-5 pt-2 px-3">
        <Alert variant="default" className="cursor-default">
          <Info />
          <div className="text-sm text-muted-foreground">
            Мод поставит лайки под каждым треком в плейлисте, это нужно для переноса музыки с другого аккаунта
          </div>
        </Alert>

        <If condition={isInProgress}>
          <div className="flex flex-col gap-3">
            <span className="text-sm text-foreground text-center">{progressStatusText}</span>
            <Progress value={progress} />
          </div>
        </If>

        <div className="flex gap-4 items-center justify-center">
          <Input
            type="text"
            defaultValue={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            disabled={isInProgress}
            className="flex-1 text-sm cursor-default w-full"
            placeholder="Ссылка на плейлист"
          />
        </div>

        <Button variant="default" className="w-full" onClick={handleButtonClick} disabled={playlistUrl.length === 0}>
          {isInProgress ? "Стоп" : "Перенести треки"}
        </Button>

        <div className="w-full my-2 border-b border-border" />

        <Button variant="default" className="w-full" onClick={handleCopyPlaylistLink}>
          Ссылка на Мою коллекцию
        </Button>
      </div>
    </ExpandableCard>
  );
}
