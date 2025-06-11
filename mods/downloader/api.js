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

// Получить прямую ссылку на трек
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

  console.log('GetTrackUrl response: ', resp);
  return resp.downloadInfo.urls[0];
};
// Получить треки из альбома
downloader.GetAlbumTracks = async function (id) {
  var headers = new Headers();
  headers.append("X-Yandex-Music-Client", "YandexMusicDesktopAppWindows/5.14.0");
  headers.append("X-Yandex-Music-Frontend", "new");
  headers.append("X-Yandex-Music-Without-Invocation-Info", "1");
  headers.append("Authorization", window.OAuthToken);

  var req = await fetch(`https://api.music.yandex.net/albums/${id}/with-tracks?resumeStream=false&richTracks=false&withListeningFinished=false`, { method: "GET", headers: headers });
  var resp = await req.json();
  console.log('GetAlbumTracks response: ', resp);

  return resp.volumes.flatMap((volume) => volume.map((x) => x.id));
};
// Получить треки из плейлиста
downloader.GetPlaylistTracks = async function (id) {
  var headers = new Headers();
  headers.append("X-Yandex-Music-Client", "YandexMusicDesktopAppWindows/5.14.0");
  headers.append("X-Yandex-Music-Frontend", "new");
  headers.append("X-Yandex-Music-Without-Invocation-Info", "1");
  headers.append("Authorization", window.OAuthToken);

  var req = await fetch(`https://api.music.yandex.net/playlist/${id}?resumeStream=false&richTracks=false`, { method: "GET", headers: headers });
  var resp = await req.json();
  console.log('GetPlaylistTracks response: ', resp);

  return resp.tracks.map((x) => x.id);
};
// Получить треки по айди
downloader.GetTracksInfo = async function (trackIds) {
  var headers = new Headers();
  headers.append("X-Yandex-Music-Client", "YandexMusicDesktopAppWindows/5.14.0");
  headers.append("X-Yandex-Music-Frontend", "new");
  headers.append("X-Yandex-Music-Without-Invocation-Info", "1");
  headers.append("Authorization", window.OAuthToken);

  var queryTracks = trackIds.join(",");

  var req = await fetch(`https://api.music.yandex.net/tracks?trackIds=${queryTracks}&removeDuplicates=false&withProgress=true`, { method: "GET", headers: headers });
  var resp = await req.json();
  console.log('GetTracksInfo response: ', resp);

  return resp.map((x) => {
    return {
      title: x.title,
      artists: x.type.includes("podcast") && x.albums && x.albums.length ? x.albums.map((x) => x.title) : x.artists.map((x) => x.name),
      id: x.id,
      type: x.type,
    };
  });
};

downloader.Log = function (e, ...args) {
  console.log(`[Downloader] ${e}`, ...args);
};
