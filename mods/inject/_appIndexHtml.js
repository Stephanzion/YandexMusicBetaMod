// инициализация всех остальных патчей при каждом обновлении страницы в приложении
window.document.addEventListener("DOMContentLoaded", () => {
  if (window.ModInitState) return;
  var script = document.createElement("script");
  script.src = "/_next/static/yandex_mod/index.js";
  document.head.appendChild(script);
  window.ModInitState = true;
});

// YandexMusic\resources\app\app\index.html
// прикрепляется к строчке: <!DOCTYPE html><html><head>
