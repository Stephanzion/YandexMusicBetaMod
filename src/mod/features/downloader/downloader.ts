(async () => {
  const systemToolbarEnabled = (await window.yandexMusicMod.getStorageValue("devtools/systemToolbar")) || true;

  if (systemToolbarEnabled) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "yandex-music-mod-devtools-style";
    styleSheet.innerHTML = systemToolbarCss;
    document.head.appendChild(styleSheet);
  }
})();
