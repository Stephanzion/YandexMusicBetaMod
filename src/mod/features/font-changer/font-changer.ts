import styleCss from "./style.css?inline";
const stylesheetName = "yandex-music-mod-font-changer-style";

async function updateFont() {
  const savedFont = (await window.yandexMusicMod.getStorageValue("font-changer/savedFont")) || "JetBrains Mono";
  const fontChangerEnabled = await window.yandexMusicMod.getStorageValue("font-changer/enabled");

  console.log("[font-changer]", {
    savedFont,
    fontChangerEnabled,
  });

  document.getElementById(stylesheetName)?.remove();

  if (!fontChangerEnabled) return;

  const styleSheet = document.createElement("style");
  styleSheet.id = stylesheetName;
  styleSheet.innerHTML = styleCss
    .replaceAll("{{font}}", savedFont)
    .replaceAll("{{font-url}}", encodeURIComponent(savedFont.replaceAll(" ", "+")));
  document.head.appendChild(styleSheet);
}

window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
  if (key.includes("font-changer")) updateFont();
});

updateFont();
