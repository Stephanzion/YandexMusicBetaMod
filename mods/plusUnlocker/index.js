// Заменить hasPlus на true, когда яндекс получает информацию о текущем пользователе
window.YandexApiOnResponse("api.music.yandex.net/account/about", async function (response) {
  response.data.hasPlus = true;
  console.log(`[PlusUnlocker] Change hasPlus value:`, response.data);
  return response.data;
});

// Автоматически нажать на кнопку входа чтобы не смущать пользователя сообщением о том, что необходим плюс
setInterval(function () {
  var loginButton = document.querySelector('button[class*="WelcomePage_loginButton__"]');
  if (loginButton) loginButton.click();
}, 500);

// Притворяется приложением для андройда. Когда приложение пытается получить текст трека, запрос
// получает новый заголовок "x-yandex-music-client" а также оригинальная sign заменяется подписью
// андроид приложения. По какой то причине в приложении для смартфона проверка на плюс не происходит.
window.YandexApiOnRequest("/lyrics?", async function (request) {
  request.headers.set("x-yandex-music-client", "YandexMusicAndroid/13");
  var url = new URL(request.url);
  var pathSegments = url.pathname.split("/");
  var trackId = pathSegments[2];
  var timestamp = url.searchParams.get("timeStamp");
  var oldSign = url.searchParams.get("sign");
  var newSign = await getLyricsSign(`${trackId}${timestamp}`);
  url.searchParams.set("sign", newSign);

  const newRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    integrity: request.integrity,
    keepalive: request.keepalive,
    signal: request.signal,
  });

  console.log(`[PlusUnlocker] Patch getLyrics url:`, {
    url: newRequest.url,
    trackId: trackId,
    timestamp: timestamp,
    oldSign: oldSign,
    newSign: newSign,
  });

  return newRequest;
});

async function getLyricsSign(a) {
  let t = "p93jhgh689SBReK6ghtw62"; // секретный ключ для android приложений
  (n = new TextEncoder()), (i = n.encode(t));
  return crypto.subtle
    .importKey(
      "raw",
      i,
      {
        name: "HMAC",
        hash: {
          name: "SHA-256",
        },
      },
      !0,
      ["sign", "verify"]
    )
    .then(async (e) => {
      let t = n.encode(a);
      return crypto.subtle.sign("HMAC", e, t).then((e) => btoa(String.fromCharCode(...new Uint8Array(e))));
    });
}
