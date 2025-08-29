import systemToolbarCss from "./systemToolbar.css?inline";

(async () => {
  const systemToolbarEnabled = await window.yandexMusicMod.getStorageValue("devtools/systemToolbar");

  console.log("[devtools] systemToolbarEnabled", systemToolbarEnabled);

  if (systemToolbarEnabled) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "yandex-music-mod-devtools-style";
    styleSheet.innerHTML = systemToolbarCss;
    document.head.appendChild(styleSheet);
  }
})();
