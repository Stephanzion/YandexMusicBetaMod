// блокировка запросов аналитики
const { session } = require("electron");

session.defaultSession.webRequest.onBeforeRequest({ urls: ["https://yandex.ru/clck/*", "https://mc.yandex.ru/*"] }, (details, callback) => {
  callback({ cancel: true });
});

// Яндекс Музыка\resources\app\main\index.js
// прикрепляется к строчке: const window = await (0, createWindow_js_1.createWindow)()
