// разблокировка экспериментальных функций
window.YandexApiOnResponse("api.music.yandex.net/account/experiments/details", async function (response) {
  response.data.WebNextUGC = { group: "on", value: { title: "on" } };
  console.log(`[ExperimentUnlocker] Enabled track upload`);
  console.log(`[ExperimentUnlocker] Updated data: `, response.data);
  return response.data;
});
