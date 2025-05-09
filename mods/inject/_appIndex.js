// блокировка запросов аналитики и рекламы
const { session } = require("electron");

session.defaultSession.webRequest.onBeforeRequest({
    urls: ["https://yandex.ru/clck/*", "https://mc.yandex.ru/*", "https://api.music.yandex.net/dynamic-pages/trigger/*"] }, (details, callback) => {
  callback({ cancel: true });
});

// Яндекс Музыка\resources\app\main\index.js
// прикрепляется к строчке: const window = await (0, createWindow_js_1.createWindow)()
