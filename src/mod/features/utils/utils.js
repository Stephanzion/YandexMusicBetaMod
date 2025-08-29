const YandexApiOnRequestHandlers = [];
const YandexApiOnResponseHandlers = [];
const originalFetch = window.fetch;

// отключить попытку отправки аналитики. Она и так заблочена, но без этого будет сыпать ошибками в консоль
navigator.sendBeacon = function (...args) {
  return true;
};

(function () {
  const originalAppendChild = document.head.appendChild;

  document.head.appendChild = function (element) {
    // Проверяем, что это script элемент
    if (element instanceof HTMLScriptElement) {
      const src = element.src || "";

      // Проверяем URL
      if (
        src.includes("https://yandex.ru/ads/system/adsdk.js") ||
        src.includes("https://mc.yandex.ru/metrika/tag.js")
      ) {
        console.log("Заблокирована попытка добавить Yandex скрипт:", src);
        return true; // Возвращаем true как указано в требованиях
      }
    }

    // Для всех остальных элементов используем оригинальный метод
    return originalAppendChild.call(this, element);
  };
})();

export function initFetchInterceptor() {
  window.fetch = function (...args) {
    var request = [...args][0];

    // отключить попытку отправки аналитики. Она и так заблочена, но без этого будет сыпать ошибками в консоль
    if (
      request &&
      request.url &&
      (request.url.includes("log.strm.yandex.ru") ||
        request.url.includes("api.music.yandex.net/dynamic-pages/trigger/polling"))
    ) {
      return new Promise((resolve) => resolve(new Response()));
    }

    if (request && request.url && request.url.startsWith("https://api.music.yandex.net"))
      return yandexApiFetch(...args);

    try {
      return originalFetch(...args);
    } catch (e) {}
  };
}

const yandexApiFetch = async function (...args) {
  let [resource, config] = args;

  console.log(`[YandexApiFetch] new request: ${resource.url}`, resource.headers);

  if (YandexApiOnRequestHandlers.find((x) => resource.url.includes(x.url))) {
    for (var i = 0; i < YandexApiOnRequestHandlers.length; i++) {
      if (!resource.url.includes(YandexApiOnRequestHandlers[i].url)) continue;
      var requestOverride = await YandexApiOnRequestHandlers[i].handler(resource);
      if (!requestOverride) continue;
      args.resource = requestOverride;
      resource = requestOverride;
    }
  }

  if (YandexApiOnResponseHandlers.find((x) => resource.url.includes(x.url))) {
    const response = await originalFetch(resource);
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();

    let resp = data;

    for (var i = 0; i < YandexApiOnResponseHandlers.length; i++) {
      if (resource.url.includes(YandexApiOnResponseHandlers[i].url)) {
        resp = await YandexApiOnResponseHandlers[i].handler({
          url: resource.url,
          data: resp,
        });
      }
    }

    if (resp) {
      const modifiedResponse = new Response(JSON.stringify(resp));
      return modifiedResponse;
    }

    return new Response(JSON.stringify(data));
  }

  return originalFetch(resource);
};

export const onYandexApiRequest = function (urlMatch, handler) {
  YandexApiOnRequestHandlers.push({
    url: urlMatch,
    handler: handler,
  });
};

export const onYandexApiResponse = function (urlMatch, handler) {
  YandexApiOnResponseHandlers.push({
    url: urlMatch,
    handler: handler,
  });
};
