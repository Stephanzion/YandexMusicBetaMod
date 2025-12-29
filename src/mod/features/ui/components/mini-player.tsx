import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { Button } from "@ui/components/ui/button";
import { Progress } from "@ui/components/ui/progress";

import { Play, Pause, SkipBack, SkipForward, X, GripHorizontal } from "lucide-react";

import { getTrackMeta, getProgress, isPlaying } from "~/mod/features/utils/player";

interface TrackMeta {
  id: string;
  title: string;
  version?: string;
  artists: Array<{ id: string; name: string }>;
  coverUri?: string;
  durationMs: number;
}

interface PlaybackState {
  position: number;
  duration: number;
  progress: number;
}

const PLAYER_SELECTOR = 'section[data-test-id="PLAYERBAR_DESKTOP"]';
const PLAY_BUTTON_SELECTOR = 'button[data-test-id="PLAY_BUTTON"]';
const PAUSE_BUTTON_SELECTOR = 'button[data-test-id="PAUSE_BUTTON"]';
const PREV_BUTTON_SELECTOR = 'button[data-test-id="PREV_BUTTON"]';
const NEXT_BUTTON_SELECTOR = 'button[data-test-id="NEXT_BUTTON"]';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function MiniPlayerWindow({ onClose }: { onClose: () => void }) {
  const [trackMeta, setTrackMeta] = useState<TrackMeta | null>(null);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const updatePlayerState = useCallback(() => {
    const trackMetaResult = getTrackMeta();
    const progressResult = getProgress();
    const isPlayingResult = isPlaying();

    if (trackMetaResult.isOk()) {
      setTrackMeta(trackMetaResult.value);
    }

    if (progressResult.isOk()) {
      setPlayback(progressResult.value);
    }

    if (isPlayingResult.isOk()) {
      setPlaying(isPlayingResult.value);
    }
  }, []);

  useEffect(() => {
    updatePlayerState();
    const interval = setInterval(updatePlayerState, 500);
    return () => clearInterval(interval);
  }, [updatePlayerState]);

  // Load saved position
  useEffect(() => {
    (async () => {
      const savedX = await window.yandexMusicMod.getStorageValue("miniPlayer/positionX");
      const savedY = await window.yandexMusicMod.getStorageValue("miniPlayer/positionY");
      if (savedX !== null && savedY !== null) {
        setPosition({ x: savedX, y: savedY });
      }
    })();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const newX = Math.max(0, Math.min(window.innerWidth - 320, dragRef.current.initialX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.initialY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        dragRef.current = null;
        // Save position
        window.yandexMusicMod.setStorageValue("miniPlayer/positionX", position.x);
        window.yandexMusicMod.setStorageValue("miniPlayer/positionY", position.y);
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position]);

  const handlePlayPause = useCallback(() => {
    const player = document.querySelector(PLAYER_SELECTOR);
    if (!player) return;

    if (playing) {
      const pauseButton = player.querySelector(PAUSE_BUTTON_SELECTOR) as HTMLButtonElement;
      pauseButton?.click();
    } else {
      const playButton = player.querySelector(PLAY_BUTTON_SELECTOR) as HTMLButtonElement;
      playButton?.click();
    }
  }, [playing]);

  const handlePrev = useCallback(() => {
    const player = document.querySelector(PLAYER_SELECTOR);
    if (!player) return;
    const prevButton = player.querySelector(PREV_BUTTON_SELECTOR) as HTMLButtonElement;
    prevButton?.click();
  }, []);

  const handleNext = useCallback(() => {
    const player = document.querySelector(PLAYER_SELECTOR);
    if (!player) return;
    const nextButton = player.querySelector(NEXT_BUTTON_SELECTOR) as HTMLButtonElement;
    nextButton?.click();
  }, []);

  const coverUrl = trackMeta?.coverUri
    ? `https://${trackMeta.coverUri.replaceAll("%%", "100x100")}`
    : null;

  const artistsText = trackMeta?.artists?.map((a) => a.name).join(", ") || "";
  const titleText = trackMeta?.version
    ? `${trackMeta.title} ${trackMeta.version}`
    : trackMeta?.title || "";

  return createPortal(
    <div
      className="fixed z-[99999] flex items-center gap-3 rounded-xl bg-[var(--ym-background-color-primary-enabled-basic)] border border-[var(--ym-outline-color-primary-disabled)] shadow-2xl p-3 select-none"
      style={{
        left: position.x,
        top: position.y,
        width: "320px",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Drag handle */}
      <div
        className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal className="w-4 h-4 text-[var(--ym-controls-color-primary-text-enabled_variant)] opacity-50" />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-1 right-1 p-1 rounded-full hover:bg-[var(--ym-surface-color-primary-enabled-list)] transition-colors"
      >
        <X className="w-3 h-3 text-[var(--ym-controls-color-primary-text-enabled_variant)]" />
      </button>

      {/* Cover art */}
      <div className="mt-4 flex-shrink-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={titleText}
            className="w-14 h-14 rounded-lg object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-[var(--ym-surface-color-primary-enabled-list)] flex items-center justify-center">
            <Play className="w-6 h-6 text-[var(--ym-controls-color-primary-text-enabled_variant)]" />
          </div>
        )}
      </div>

      {/* Track info and controls */}
      <div className="flex-1 min-w-0 mt-4">
        <div className="truncate text-sm font-medium text-[var(--ym-controls-color-primary-text-enabled_default)]">
          {titleText || "Нет трека"}
        </div>
        <div className="truncate text-xs text-[var(--ym-controls-color-primary-text-enabled_variant)]">
          {artistsText || "—"}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-[var(--ym-controls-color-primary-text-enabled_variant)] w-8 text-right">
            {playback ? formatTime(playback.position) : "0:00"}
          </span>
          <Progress
            value={playback?.progress ?? 0}
            className="flex-1 h-1"
          />
          <span className="text-[10px] text-[var(--ym-controls-color-primary-text-enabled_variant)] w-8">
            {playback ? formatTime(playback.duration) : "0:00"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-1 mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrev}
          >
            <SkipBack className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePlayPause}
          >
            {playing ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNext}
          >
            <SkipForward className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function MiniPlayer() {
  const [miniPlayerEnabled, setMiniPlayerEnabled] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  useEffect(() => {
    (async () => {
      const enabled = await window.yandexMusicMod.getStorageValue("miniPlayer/enabled");
      setMiniPlayerEnabled(enabled === true);
    })();

    const unsubscribe = window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
      if (key === "miniPlayer/enabled") {
        setMiniPlayerEnabled(value === true);
        if (!value) {
          setShowMiniPlayer(false);
        }
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const handleToggleMiniPlayer = useCallback(() => {
    if (miniPlayerEnabled) {
      setShowMiniPlayer((prev) => !prev);
    }
  }, [miniPlayerEnabled]);

  return (
    <>
      <ExpandableCard title="Мини-плеер">
        <div className="flex flex-col gap-5 pt-2 px-3">
          <div className="flex items-center gap-3">
            <Switch
              id="mini-player-toggle"
              checked={miniPlayerEnabled}
              onCheckedChange={(enabled) => {
                setMiniPlayerEnabled(enabled);
                window.yandexMusicMod.setStorageValue("miniPlayer/enabled", enabled);
                if (!enabled) {
                  setShowMiniPlayer(false);
                }
              }}
            />
            <Label htmlFor="mini-player-toggle" className="cursor-pointer">
              Включить мини-плеер
            </Label>
          </div>

          {miniPlayerEnabled && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleToggleMiniPlayer}
            >
              {showMiniPlayer ? "Скрыть мини-плеер" : "Показать мини-плеер"}
            </Button>
          )}
        </div>
      </ExpandableCard>

      {showMiniPlayer && miniPlayerEnabled && (
        <MiniPlayerWindow onClose={() => setShowMiniPlayer(false)} />
      )}
    </>
  );
}
