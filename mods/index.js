console.log('\n\nY88b   d88P     d8888 888b    888 8888888b.  8888888888 Y88b   d88P \n Y88b d88P     d88888 8888b   888 888  "Y88b 888         Y88b d88P  \n  Y88o88P     d88P888 88888b  888 888    888 888          Y88o88P   \n   Y888P     d88P 888 888Y88b 888 888    888 8888888       Y888P    \n    888     d88P  888 888 Y88b888 888    888 888           d888b    \n    888    d88P   888 888  Y88888 888    888 888          d88888b   \n    888   d8888888888 888   Y8888 888  .d88P 888         d88P Y88b  \n    888  d88P     888 888    Y888 8888888P"  8888888888 d88P   Y88b \n                                                                    \n                                                                    \n                                                                    \n                  888b     d888  .d88888b.  8888888b.               \n                  8888b   d8888 d88P" "Y88b 888  "Y88b              \n                  88888b.d88888 888     888 888    888              \n                  888Y88888P888 888     888 888    888              \n                  888 Y888P 888 888     888 888    888              \n                  888  Y8P  888 888     888 888    888              \n                  888   "   888 Y88b. .d88P 888  .d88P              \n                  888       888  "Y88888P"  8888888P"\n\n');
console.log("\n[Yandex Mod] Source code: https://github.com/Stephanzion/YandexMusicBetaMod\n\n");

// Скрипт загружает файлы мода исходя из конфига, выбранного в патчере
(async function () {
  var modConfig = {
    usePlusUnlocker: false,
    useDownloader: false,
    useJetBrainsFont: false,
    useDevTools: true,
  };

  //%PATCHER_CONFIG_OVERRIDE%

  // строчка выше заменится на конфиг пользователя

  var modScripts = [],
    modStyles = [];

  if (modConfig.usePlusUnlocker) {
    modScripts.push("/_next/static/yandex_mod/plusUnlocker/index.js");
  }
  if (modConfig.useDownloader) {
    modStyles.push("/_next/static/yandex_mod/downloader/index.css");
    modScripts.push("/_next/static/yandex_mod/downloader/api.js");
    modScripts.push("/_next/static/yandex_mod/downloader/index.js");
    modScripts.push("/_next/static/yandex_mod/downloader/album.js");
  }
  if (modConfig.useJetBrainsFont) {
    modStyles.push("/_next/static/yandex_mod/jetbrains/index.css");
  }
  if (modConfig.useDevTools) {
    modStyles.push("/_next/static/yandex_mod/topbar/index.css");
  }

  modScripts.push("/_next/static/yandex_mod/experiments/index.js");

  modStyles = [...new Set(modStyles)];
  modScripts = [...new Set(modScripts)];

  console.log("[Yandex Mod] Init mod config", modConfig);

  console.log("[Yandex Mod] Init mod files", modScripts.concat(modStyles));

  loadScripts();
  loadStyles();

  function loadStyles() {
    if (modStyles.length == 0) return;
    var style = document.createElement("link");
    style.href = modStyles[0];
    style.rel = "stylesheet";
    style.onload = loadStyles;
    modStyles = modStyles.slice(1);
    document.head.appendChild(style);
  }

  function loadScripts() {
    if (modScripts.length == 0) return;
    var script = document.createElement("script");
    script.src = modScripts[0];
    script.onload = loadScripts;
    modScripts = modScripts.slice(1);
    document.head.appendChild(script);
  }
})();

(async function () {
  // Переопределенная функция fetch, которая используется в приложении для получения данных через апи.

  var YandexApiOnRequestHandlers = [];
  var YandexApiOnResponseHandlers = [];
  const originalFetch = window.fetch;

  window.fetch = function (...args) {
    var request = [...args][0];
    if (request && request.url && request.url.startsWith("https://api.music.yandex.net")) return _YandexApiFetch(...args);
    return originalFetch(...args);
  };

  window._YandexApiFetch = async function (...args) {
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

      for (var i = 0; i < YandexApiOnResponseHandlers.length; i++) {
        if (!resource.url.includes(YandexApiOnResponseHandlers[i].url)) continue;
        var resp = await YandexApiOnResponseHandlers[i].handler({
          url: resource.url,
          data: data,
        });
        if (resp) {
          const modifiedResponse = new Response(JSON.stringify(resp));
          return modifiedResponse;
        }
      }
      return new Response(JSON.stringify(data));
    }

    return originalFetch(resource);
  };

  window.YandexApiOnRequest = function (urlMatch, handler) {
    YandexApiOnRequestHandlers.push({
      url: urlMatch,
      handler: handler,
    });
  };
  window.YandexApiOnResponse = function (urlMatch, handler) {
    YandexApiOnResponseHandlers.push({
      url: urlMatch,
      handler: handler,
    });
  };
})();
