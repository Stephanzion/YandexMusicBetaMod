async function updateQuality() {
  const enabled = (await window.yandexMusicMod.getStorageValue("autoBestQuality/enabled")) === false ? false : true;

  console.log("[auto-best-quality] enabled", enabled);

  if (!enabled) return;

  if (window.localStorage.ymPlayerQuality) {
    const data = JSON.parse(window.localStorage.ymPlayerQuality);
    if (!data) return;
    const isNotHighQuality = data.value !== "high_quality";
    data.value = "high_quality";
    data.expires = "2077-01-01T11:29:20.427Z";
    window.localStorage.setItem("ymPlayerQuality", JSON.stringify(data));
    console.log("[auto-best-quality] setting best quality", data);
    if (isNotHighQuality) window.location.reload();
  }
}

window.yandexMusicMod.onStorageChanged((key: string, value: any) => {
  if (key.includes("autoBestQuality")) updateQuality();
});

updateQuality();
