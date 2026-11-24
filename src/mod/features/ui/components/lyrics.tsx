import { useCallback, useEffect, useState } from "react";

import { getTrackMeta } from "~/mod/features/utils/player";
import { getCustomLyrics, setCustomLyrics, deleteCustomLyrics } from "~/mod/features/lyrics/storage";
import { LYRICS_SETTINGS_KEYS } from "~/mod/features/lyrics/settings";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { Button } from "@ui/components/ui/button";
import { If } from "@ui/components/ui/if";
import { Alert } from "@ui/components/ui/alert";
import { toast } from "sonner";

import { Info, Music2, RefreshCw, Save, Trash2 } from "lucide-react";

interface CurrentTrack {
  id: string;
  title: string;
  artists: string;
}

function readCurrentTrack(): CurrentTrack | null {
  const meta = getTrackMeta();
  if (meta.isErr()) return null;

  const track = meta.value;
  return {
    id: String(track.id),
    title: String(track.title ?? ""),
    artists: Array.isArray(track.artists)
      ? track.artists
          .map((artist: { name?: string }) => artist?.name)
          .filter(Boolean)
          .join(", ")
      : "",
  };
}

export function Lyrics() {
  const [enabled, setEnabled] = useState(true);
  const [preferSynced, setPreferSynced] = useState(true);
  const [unlockNonMusic, setUnlockNonMusic] = useState(false);

  const [track, setTrack] = useState<CurrentTrack | null>(null);
  const [customText, setCustomText] = useState("");
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const refreshTrack = useCallback(async () => {
    setIsLoadingTrack(true);

    try {
      const current = readCurrentTrack();
      setTrack(current);

      if (current) {
        const existing = await getCustomLyrics(current.id);
        setCustomText(existing?.text ?? "");
      } else {
        setCustomText("");
      }
    } finally {
      setIsLoadingTrack(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [savedEnabled, savedPreferSynced, savedUnlockNonMusic] = await Promise.all([
        window.yandexMusicMod.getStorageValue(LYRICS_SETTINGS_KEYS.enabled),
        window.yandexMusicMod.getStorageValue(LYRICS_SETTINGS_KEYS.preferSynced),
        window.yandexMusicMod.getStorageValue(LYRICS_SETTINGS_KEYS.unlockNonMusic),
      ]);

      setEnabled(savedEnabled !== false);
      setPreferSynced(savedPreferSynced !== false);
      setUnlockNonMusic(savedUnlockNonMusic === true);

      void refreshTrack();
    })();
  }, [refreshTrack]);

  const handleSave = async () => {
    if (!track) return;

    const text = customText.trim();
    if (!text) {
      toast.error("Введите текст песни");
      return;
    }

    setIsSaving(true);

    try {
      await setCustomLyrics({
        trackId: track.id,
        title: track.title,
        artists: track.artists,
        text,
      });

      toast.success("Свой текст сохранён", {
        description:
          "Он будет показан вместо текста из LRCLib. Обновите трек (переключите его), чтобы увидеть изменения.",
      });
    } catch (error) {
      console.error("[Lyrics] Failed to save custom lyrics:", error);
      toast.error("Не удалось сохранить текст");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!track) return;

    try {
      await deleteCustomLyrics(track.id);
      setCustomText("");
      toast.success("Свой текст удалён");
    } catch (error) {
      console.error("[Lyrics] Failed to delete custom lyrics:", error);
      toast.error("Не удалось удалить текст");
    }
  };

  return (
    <ExpandableCard title="Тексты песен" icon={<Music2 className="h-4 w-4" />}>
      <div className="flex flex-col gap-5 pt-2 px-3">
        <Alert variant="default" className="cursor-default">
          <Info />
          <div className="text-sm text-muted-foreground">
            Тексты берутся из открытой базы LRCLib и не требуют подписки Плюс. Если трека нет в базе — добавьте свой
            текст ниже.
          </div>
        </Alert>

        <div className="flex items-center gap-3">
          <Switch
            id="lyrics-toggle"
            checked={enabled}
            onCheckedChange={(value) => {
              setEnabled(value);
              window.yandexMusicMod.setStorageValue(LYRICS_SETTINGS_KEYS.enabled, value);
            }}
          />
          <Label htmlFor="lyrics-toggle" className="cursor-pointer">
            Показывать тексты песен
          </Label>
        </div>

        <If condition={enabled}>
          <div className="flex items-center gap-3">
            <Switch
              id="lyrics-prefer-synced-toggle"
              checked={preferSynced}
              onCheckedChange={(value) => {
                setPreferSynced(value);
                window.yandexMusicMod.setStorageValue(LYRICS_SETTINGS_KEYS.preferSynced, value);
              }}
            />
            <Label htmlFor="lyrics-prefer-synced-toggle" className="cursor-pointer">
              Предпочитать синхронизированный текст
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="lyrics-unlock-non-music-toggle"
              checked={unlockNonMusic}
              onCheckedChange={(value) => {
                setUnlockNonMusic(value);
                window.yandexMusicMod.setStorageValue(LYRICS_SETTINGS_KEYS.unlockNonMusic, value);
              }}
            />
            <Label htmlFor="lyrics-unlock-non-music-toggle" className="cursor-pointer">
              Искать тексты для подкастов и другого не-музыкального контента
            </Label>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Свой текст для текущего трека</span>
                <span className="text-muted-foreground text-xs">
                  {track ? `${track.artists} — ${track.title}` : "Трек не найден в плеере"}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => void refreshTrack()}
                disabled={isLoadingTrack}
                title="Обновить текущий трек"
              >
                <RefreshCw className={isLoadingTrack ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </Button>
            </div>

            <textarea
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-40 w-full resize-y rounded-md border px-3 py-2 font-mono text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={
                "Вставьте текст песни.\n\nМожно вставить и LRC с таймкодами вида [00:12.34]текст — тогда текст будет синхронизирован."
              }
              value={customText}
              onChange={(event) => setCustomText(event.target.value)}
              disabled={!track}
            />

            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => void handleSave()}
                disabled={!track || isSaving}
              >
                <Save className="h-4 w-4" />
                Сохранить
              </Button>

              <Button variant="outline" size="sm" onClick={() => void handleDelete()} disabled={!track || isSaving}>
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            </div>
          </div>
        </If>
      </div>
    </ExpandableCard>
  );
}
