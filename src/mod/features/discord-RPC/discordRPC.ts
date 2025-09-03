import { getTrackMeta, getProgress, isPlaying } from "~/mod/features/utils/player";
import posthog from "posthog-js";

let isRpcEnabled = true;
let showModButton = true;

// Функция для получения состояния плеера из окна приложения. Её вызывает main процесс - src\mod\main.js
window.__getPlayerState = () => {
  const trackMetaRequest = getTrackMeta();
  const playbackRequest = getProgress();
  const isPlayingRequest = isPlaying();

  if (trackMetaRequest.isErr()) {
    if (trackMetaRequest.error !== "upgrade_promocode") {
      posthog.captureException("Error getting track meta:", { trackMetaRequest: trackMetaRequest.error });
      console.error("Error getting track meta:", trackMetaRequest.error);
    }
    return {
      enabled: isRpcEnabled,
      showModButton: showModButton,
      data: null,
    };
  }

  if (playbackRequest.isErr()) {
    posthog.captureException("Error getting player progress:", { playbackRequest: playbackRequest.error });
    console.error("Error getting player progress:", playbackRequest.error);
    return {
      enabled: isRpcEnabled,
      showModButton: showModButton,
      data: null,
    };
  }

  if (isPlayingRequest.isErr()) {
    posthog.captureException("Error getting isPlaying:", { isPlayingRequest: isPlayingRequest.error });
    console.error("Error getting isPlaying:", isPlayingRequest.error);
    return {
      enabled: isRpcEnabled,
      showModButton: showModButton,
      data: null,
    };
  }

  return {
    enabled: isRpcEnabled,
    showModButton: showModButton,
    data: {
      trackMeta: trackMetaRequest.value,
      playback: playbackRequest.value,
      isPlaying: isPlayingRequest.value,
    },
  };
};

window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
  if (key === "discordRPC/enabled" && value !== isRpcEnabled) isRpcEnabled = value;
  if (key === "discordRPC/showModButton" && value !== showModButton) showModButton = value;
});

(async () => {
  isRpcEnabled = (await window.yandexMusicMod.getStorageValue("discordRPC/enabled")) === false ? false : true;
  showModButton = (await window.yandexMusicMod.getStorageValue("discordRPC/showModButton")) === false ? false : true;
})();
