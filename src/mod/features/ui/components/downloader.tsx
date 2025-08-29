/// <reference path="../../../../types/global.d.ts" />

import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { isPlaying, getProgress, getTrackMeta } from "~/mod/features/utils/player";
import {
  getAlbumTracks,
  getArtistTracks,
  getPlaylistTracks,
  getTrackUrl,
  getTracksInfo,
  QualityEnum,
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

import { Info, FolderOpen, Folder } from "lucide-react";

enum pageTypeEnum {
  OTHER,
  ARTIST,
  PLAYLIST,
  ALBUM,
}

const qualityLabels: Record<QualityEnum, string> = {
  [QualityEnum.LOSSLESS]: "Максимальное",
  [QualityEnum.NQ]: "Среднее",
  [QualityEnum.LQ]: "Низкое",
};

export function Downloader() {
  const [downloadType, setDownloadType] = useState(pageTypeEnum.OTHER);
  const [downloadQuality, setDownloadQuality] = useState(QualityEnum.LOSSLESS);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState("");
  const [downloadFolderPath, setDownloadFolderPath] = useState<string | null>(null);
  const downloadCancelledRef = useRef(false);

  // Load saved download folder path on component mount
  useEffect(() => {
    const loadDownloadPath = async () => {
      try {
        const savedPath = await window.yandexMusicMod.getStorageValue("downloadFolderPath");
        if (savedPath) {
          setDownloadFolderPath(savedPath);
        }
      } catch (error) {
        console.warn("Failed to load download folder path:", error);
      }
    };
    loadDownloadPath();
  }, []);

  // Save download folder path when it changes
  const saveDownloadPath = async (path: string | null) => {
    try {
      await window.yandexMusicMod.setStorageValue("downloadFolderPath", path);
      setDownloadFolderPath(path);
    } catch (error) {
      console.error("Failed to save download folder path:", error);
      toast.error("Не удалось сохранить путь к папке");
    }
  };

  // Handle folder selection
  const handleSelectFolder = async () => {
    try {
      const result = await window.yandexMusicMod.selectDownloadFolder();
      if (result.success && result.path) {
        await saveDownloadPath(result.path);
        toast.success("Папка для загрузки выбрана", {
          description: result.path,
        });
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
      toast.error("Не удалось выбрать папку");
    }
  };

  // Handle opening folder
  const handleOpenFolder = async () => {
    if (!downloadFolderPath) {
      toast.warning("Папка не выбрана");
      return;
    }

    try {
      const result = await window.yandexMusicMod.openFolder(downloadFolderPath);
      if (!result.success) {
        toast.error("Не удалось открыть папку", {
          description: result.error || "Неизвестная ошибка",
        });
      }
    } catch (error) {
      console.error("Failed to open folder:", error);
      toast.error("Не удалось открыть папку");
    }
  };

  const pageType = window.location.href.includes("/artist")
    ? pageTypeEnum.ARTIST
    : window.location.href.includes("/playlists")
      ? pageTypeEnum.PLAYLIST
      : window.location.href.includes("/album")
        ? pageTypeEnum.ALBUM
        : pageTypeEnum.OTHER;

  useEffect(() => {
    setDownloadType(pageType);
  }, [pageType]);

  const urlParams = new URLSearchParams(window.location.search);

  const collectionId =
    pageType === pageTypeEnum.ARTIST
      ? urlParams.get("artistId")
      : pageType === pageTypeEnum.ALBUM
        ? urlParams.get("albumId")
        : pageType === pageTypeEnum.PLAYLIST
          ? urlParams.get("playlistUuid")
          : null;

  const getTrackMetaQuery = useQuery({
    queryKey: ["player-test-track-meta"],
    queryFn: async () => {
      const data = getTrackMeta();
      if (data.isErr()) throw data.error;
      return data.value;
    },
    enabled: true,
    retry: false,
    staleTime: 500,
    refetchInterval: 500,
  });

  async function downloadTracks(trackIds: string[], quality: QualityEnum) {
    const tracks = [];
    const chunkSize = 50;

    for (var i = 0; i < trackIds.length; i += chunkSize) {
      setDownloadStatusText(`Получение информации о треках ${((i / trackIds.length) * 100).toFixed(2)}%`);
      setDownloadProgress((i / trackIds.length) * 100);
      if (downloadCancelledRef.current) return;

      const chunk = trackIds.slice(i, i + chunkSize);

      var newTracks = await getTracksInfo(chunk, true);

      console.log("[Downloader] get tracks info", chunk, newTracks);

      if (newTracks.isErr()) {
        console.error("[Downloader] get tracks info", newTracks.error);
        return toast.error("Произошла ошибка", {
          description: newTracks.error,
        });
      }

      tracks.push(...newTracks.value);

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log("[Downloader] tracks info", tracks);

    const downloadedTracks = [];

    for (var i = 0; i < tracks.length; i++) {
      setDownloadStatusText(`Скачивание треков ${i + 1} / ${tracks.length}`);
      setDownloadProgress((i / tracks.length) * 100);
      if (downloadCancelledRef.current) return;

      const trackTitle = `${tracks[i]!.artists.map((a: any) => a.name).join(", ")} - ${tracks[i]!.title}`;

      if (tracks[i]!.available === false) {
        console.log("[Downloader] Track is not available", tracks[i]);
        toast.warning("Трек недоступен", {
          description: trackTitle,
        });
        continue;
      }

      const downloadInfo = await getTrackUrl(tracks[i]!.id, quality);

      if (downloadInfo.isErr()) {
        console.log("[Downloader] DownloadUrl not available", tracks[i]);
        toast.error("Не удалось получить ссылку для загрузки трека", {
          description: trackTitle,
        });
        continue;
      }

      console.log("[Downloader] got track download url", tracks[i], downloadInfo.value);

      const downloadResult = await window.yandexMusicMod.downloadTrack(
        downloadInfo.value,
        tracks[i],
        downloadFolderPath,
      );

      if (downloadResult.error) {
        console.error("[Downloader] error while downloading track", downloadResult.error);
        toast.error("Не удалось скачать трек", {
          description: trackTitle,
        });
        continue;
      }

      console.log("[Downloader] downloadResult", downloadResult);

      downloadedTracks.push(tracks[i]!);

      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  async function downloadButtonClick() {
    if (isDownloading) {
      downloadCancelledRef.current = true;
      setIsDownloading(false);
      setDownloadStatusText("");
      setDownloadProgress(0);
      return;
    }

    downloadCancelledRef.current = false;
    setIsDownloading(true);

    switch (downloadType) {
      case pageTypeEnum.OTHER:
        await downloadTracks([getTrackMetaQuery.data.id], downloadQuality);
        break;

      case pageTypeEnum.ALBUM:
        if (collectionId) {
          const trackIds = await getAlbumTracks(collectionId);
          if (trackIds.isErr()) {
            toast.error("Произошла ошибка", {
              description: trackIds.error,
            });
            return;
          }
          await downloadTracks(trackIds.value, downloadQuality);
        }
        break;

      case pageTypeEnum.ARTIST:
        if (collectionId) {
          const trackIds = await getArtistTracks(collectionId);
          if (trackIds.isErr()) {
            toast.error("Произошла ошибка", {
              description: trackIds.error,
            });
            return;
          }
          await downloadTracks(trackIds.value, downloadQuality);
        }
        break;

      case pageTypeEnum.PLAYLIST:
        if (collectionId) {
          const trackIds = await getPlaylistTracks(collectionId);
          if (trackIds.isErr()) {
            toast.error("Произошла ошибка", {
              description: trackIds.error,
            });
            return;
          }
          await downloadTracks(trackIds.value, downloadQuality);
        }
        break;

      default:
        toast.error("Неизвестный тип загрузки");
        break;
    }

    setIsDownloading(false);
  }

  return (
    <ExpandableCard title="Скачать треки" opened={true}>
      <div className="flex flex-col gap-5 pt-2 px-3">
        <If condition={isDownloading}>
          <div className="flex flex-col gap-3">
            <span className="text-sm text-foreground text-center">{downloadStatusText}</span>
            <Progress value={downloadProgress} />
          </div>
        </If>

        <div className="flex gap-4 items-center justify-center">
          <span className="text-sm text-foreground">Скачать</span>
          <Select value={downloadType.toString()} onValueChange={(value) => setDownloadType(parseInt(value, 10))}>
            <SelectTrigger className="text-foreground w-full">
              <SelectValue className="text-foreground" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={pageTypeEnum.OTHER.toString()}>Текущий трек</SelectItem>

              <If condition={pageType === pageTypeEnum.ALBUM}>
                <SelectItem value={pageTypeEnum.ALBUM.toString()}>Весь альбом</SelectItem>
              </If>
              <If condition={pageType === pageTypeEnum.PLAYLIST}>
                <SelectItem value={pageTypeEnum.PLAYLIST.toString()}>Весь плейлист</SelectItem>
              </If>
              <If condition={pageType === pageTypeEnum.ARTIST}>
                <SelectItem value={pageTypeEnum.ARTIST.toString()}>Все треки артиста</SelectItem>
              </If>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4 items-center justify-center">
          <span className="text-sm text-foreground">Качество</span>
          <Select value={downloadQuality} onValueChange={(value) => setDownloadQuality(value as QualityEnum)}>
            <SelectTrigger className="text-foreground w-full">
              <SelectValue className="text-foreground" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(QualityEnum).map((quality) => (
                <SelectItem key={quality} value={quality}>
                  {qualityLabels[quality]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Input
            type="text"
            value={downloadFolderPath || "Папка не выбрана"}
            readOnly
            className="flex-1 text-sm cursor-default w-full"
            placeholder="Выберите папку для загрузки"
          />
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="sm"
                className="p-2 h-9 w-9"
                onClick={handleSelectFolder}
                disabled={isDownloading}
              >
                <Folder className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Выбрать папку</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="sm"
                className="p-2 h-9 w-9"
                onClick={handleOpenFolder}
                disabled={isDownloading || !downloadFolderPath}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Открыть папку</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Button
          variant="default"
          className="w-auto"
          disabled={!getTrackMetaQuery.isSuccess || !getTrackMetaQuery.data.id}
          onClick={downloadButtonClick}
        >
          {isDownloading ? "Стоп" : "Скачать"}
        </Button>

        <Alert variant="default" className="cursor-default">
          <Info />
          <div className="text-sm text-muted-foreground">
            Для загрузки всех треков артиста, плейлиста или альбома - откройте соответствующую страницу
          </div>
        </Alert>
      </div>
    </ExpandableCard>
  );
}
