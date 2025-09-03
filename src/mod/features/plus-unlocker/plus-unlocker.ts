import { onYandexApiResponse, onYandexApiRequest } from "~/mod/features/utils/utils";
import { getTrackUrl, getTracksInfo, QualityEnum } from "~/mod/features/utils/downloader";

// Заменить hasPlus на true, когда яндекс получает информацию о текущем пользователе
onYandexApiResponse("api.music.yandex.net/account/about", async function (response: any) {
  const data = response.data;
  data.hasPlus = true;
  console.log(`[PlusUnlocker] Change hasPlus value:`, data);
  return data;
});

// Убрать рекламу яндекса в виде контента в подборках
onYandexApiResponse("/editorial-promotion", async function (response: any) {
  console.log(`[PlusUnlocker] Remove promotions:`, response.data);
  const result = { promotions: [] };
  return result;
});

// Не знаю, что это, но как то связано с плюсом, так что убрал
onYandexApiResponse("/proxy/plus-red-alert/v1/alerts", async function (response: any) {
  console.log(`[PlusUnlocker] Remove plus-red-alert:`, response.data);
  const result = { alerts: [] };
  return result;
});

// Убрать рекламу из треков
onYandexApiResponse("api.music.yandex.net/get-file-info", async function (response: any) {
  const url: string = response.url;
  const data = response.data;

  const trackId: string | null = new URLSearchParams(url).get("trackId");
  if (!trackId) return data;

  if (data.downloadInfo.trackId === trackId) {
    return data;
  } else {
    const trackData = await getTrackUrl(trackId, data.downloadInfo.quality as QualityEnum);

    if (trackData.isErr()) {
      console.error("[PlusUnlocker] Error getting track url for ad bypass :", trackData.error);
      return data;
    } else {
      console.log(`[PlusUnlocker] Ad bypassed for track ${trackId}`, trackData.value);
      const result = { downloadInfo: trackData.value };
      return result;
    }
  }
});

// Убрать рекламу из обложек треков (разраб яндекса если ты это читаешь - как же ты заморочился паскуда)
onYandexApiResponse("api.music.yandex.net", async (response: any) => {
  function walk(obj: any, cb: (node: any, path: (string | number)[]) => void, path: (string | number)[] = []): void {
    if (obj && typeof obj === "object") {
      if (Array.isArray(obj)) {
        obj.forEach((item: any, idx: number) => walk(item, cb, [...path, idx]));
      } else {
        cb(obj, path);
        Object.values(obj).forEach((value: any) => walk(value, cb, path));
      }
    }
  }

  const source: any = response.data;

  const ids: string[] = [];
  walk(source, (node: any) => {
    if (node && "id" in node && "realId" in node && "coverUri" in node && "ogImage" in node && node.type === "music") {
      ids.push(node.id as string);
    }
  });

  if (ids.length === 0) return source;

  const trackMetaResponse = await getTracksInfo(ids, true);
  if (trackMetaResponse.isErr()) {
    console.error("[PlusUnlocker] Error getting new images:", trackMetaResponse.error);
    return source;
  }

  const trackMetas = trackMetaResponse.value;
  const metaById = new Map<string, any>(trackMetas.map((m: any) => [m.id, m]));

  walk(source, (node: any) => {
    if (node && "id" in node && "realId" in node && "coverUri" in node && "ogImage" in node) {
      const meta = metaById.get(node.id as string);
      if (!meta) return;

      node.coverUri = meta.coverUri;
      node.ogImage = meta.ogImage;
    }
  });

  console.log("[PlusUnlocker] Ads in image bypassed for tracks", ids, source);

  return source;
});

// Автоматически нажать на кнопку входа чтобы не смущать пользователя сообщением о том, что необходим плюс
setInterval(function (): void {
  const loginButton: HTMLButtonElement | null = window.document.querySelector(
    'button[class*="WelcomePage_loginButton__"]',
  ) as HTMLButtonElement | null;
  if (loginButton) loginButton.click();
}, 500);

onYandexApiRequest("/lyrics?", async function (request: any) {
  request.headers.set("x-yandex-music-client", "YandexMusicAndroid/24023621");
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
  ((n = new TextEncoder()), (i = n.encode(t)));
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
      ["sign", "verify"],
    )
    .then(async (e) => {
      let t = n.encode(a);
      return crypto.subtle.sign("HMAC", e, t).then((e) => btoa(String.fromCharCode(...new Uint8Array(e))));
    });
}
