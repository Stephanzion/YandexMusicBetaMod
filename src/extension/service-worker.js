chrome.webRequest.onBeforeRequest.addListener(
    function () {
        return { cancel: true };
    },
    {
        urls: ["https://mc.yandex.ru/*", "https://yandex.ru/clck/*"],
    },
    ["blocking"]
);
