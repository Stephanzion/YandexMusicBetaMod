var downloader = {};

downloader.secretKey = "kzqU4XhfCaY6B6JTHODeq5";

//hmac sign
downloader.getSign = async function getSign(e) {
  let { secretKey: t, data: a } = e,
    n = new TextEncoder(),
    i = n.encode(t);
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
      return crypto.subtle.sign("HMAC", e, t).then((e) => btoa(String.fromCharCode(...new Uint8Array(e))).slice(0, -1));
    });
};

downloader.GetTrackUrl = async function (trackId, token) {
  var selectedQuality = JSON.parse(localStorage.ymPlayerQuality).value;
  var availableQualites = {
    high_quality: "lossless",
    balanced: "nq",
    efficient: "lq",
  };
  selectedQuality = availableQualites[selectedQuality];

  var ts = Math.floor(Date.now() / 1e3);

  var sign = await downloader.getSign({
    data: `${ts}${trackId}${selectedQuality}flacaache-aacmp3raw`,
    secretKey: downloader.secretKey,
  });

  var headers = new Headers();
  headers.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) YandexMusic/5.14.0 Chrome/118.0.5993.129 Electron/27.0.4 Safari/537.36");
  headers.append("X-Yandex-Music-Client", "YandexMusicDesktopAppWindows/5.14.0");
  headers.append("X-Yandex-Music-Frontend", "new");
  headers.append("X-Yandex-Music-Without-Invocation-Info", "1");
  headers.append("Authorization", token);

  var req = await fetch(`https://api.music.yandex.net/get-file-info?ts=${ts}&trackId=${trackId}&quality=${selectedQuality}&codecs=${encodeURIComponent("flac,aac,he-aac,mp3")}&transports=raw&sign=${encodeURIComponent(sign)}`, { method: "GET", headers: headers });
  var resp = await req.json();

  return resp.downloadInfo.urls[0];
};

downloader.Log = function (e, j = null) {
  console.log(`[Downloader] ${e}`, j);
};
