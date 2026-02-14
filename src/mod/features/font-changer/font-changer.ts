import availableFonts from "@ui/assets/fonts/fonts.json";

const stylesheetName = "yandex-music-mod-font-changer-style";

async function updateFont() {
  const savedFontValue = await window.yandexMusicMod.getStorageValue("font-changer/savedFont");
  const fontChangerEnabled = await window.yandexMusicMod.getStorageValue("font-changer/enabled");
  const savedFont = availableFonts.find((font) => font.name === savedFontValue) || availableFonts[0];

  console.log("[font-changer]", {
    savedFont,
    fontChangerEnabled,
  });

  document.getElementById(stylesheetName)?.remove();

  if (!fontChangerEnabled) return;

  if (!savedFont) {
    console.error("[font-changer]", "No font found");
    return;
  }

  const styleSheet = document.createElement("style");
  styleSheet.id = stylesheetName;
  styleSheet.innerHTML = `* {
  font-family: "${savedFont.family}" !important;
}
${savedFont?.extraStylesheet || ""}
`;
  document.head.appendChild(styleSheet);
}

window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
  if (key.includes("font-changer")) updateFont();
});

updateFont();
