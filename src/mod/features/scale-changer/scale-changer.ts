const stylesheetName = "yandex-music-mod-scale-changer-style";

async function updateScale() {
  const savedScale = (await window.yandexMusicMod.getStorageValue("scale-changer/savedScale")) || 1;

  console.log("[scale-changer]", {
    savedScale,
  });

  document.getElementById(stylesheetName)?.remove();

  const styleSheet = document.createElement("style");
  styleSheet.id = stylesheetName;
  styleSheet.innerHTML = `div[class*="DefaultLayout_root_"] {
  zoom: ${savedScale} !important;
}
`;
  document.head.appendChild(styleSheet);
}

window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
  if (key.includes("scale-changer")) updateScale();
});

updateScale();
