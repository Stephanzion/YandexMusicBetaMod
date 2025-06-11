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
// Global variable to store failed downloads
downloader.failedDownloads = [];

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

  try {
    var req = await fetch(`https://api.music.yandex.net/get-file-info?ts=${ts}&trackId=${trackId}&quality=${selectedQuality}&codecs=${encodeURIComponent("flac,aac,he-aac,mp3")}&transports=raw&sign=${encodeURIComponent(sign)}`, { method: "GET", headers: headers });
    var resp = await req.json();

    console.log('GetTrackUrl response: ', resp);
    
    if (resp.name === 'track-download-info-error' && resp.message === 'no-rights') {
      throw new Error('no-rights');
    }
    
    if (!resp.downloadInfo || !resp.downloadInfo.urls) {
      throw new Error('invalid-response');
    }
    
    return resp.downloadInfo.urls[0];
  } catch (error) {
    console.error('Error getting track URL:', error);
    throw error;
  }
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

  return {
    trackIds: resp.volumes.flatMap((volume) => volume.map((x) => x.id)),
    title: resp.title
  };
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

  return {
    trackIds: resp.tracks.map((x) => x.id),
    title: resp.title
  };
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

// Show modal with failed downloads
downloader.ShowFailedDownloadsModal = function(failedTracks) {
  // Check if modal already exists
  if (document.getElementById('failedDownloadsModal')) return;

  const modal = document.createElement('div');
  modal.id = 'failedDownloadsModal';
  modal.style.position = 'fixed';
  modal.style.zIndex = '1000';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.4)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#1e1e1e';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.width = '500px';
  modalContent.style.maxWidth = '90%';
  modalContent.style.maxHeight = '70vh';
  modalContent.style.overflowY = 'auto';

  const title = document.createElement('h3');
  title.textContent = 'Треки, которые не удалось загрузить';
  title.style.marginTop = '0';
  title.style.color = '#fff';

  const tracksList = document.createElement('div');
  tracksList.style.marginTop = '15px';

  failedTracks.forEach(track => {
    const trackItem = document.createElement('div');
    trackItem.style.display = 'flex';
    trackItem.style.alignItems = 'center';
    trackItem.style.marginBottom = '10px';
    trackItem.style.padding = '8px';
    trackItem.style.backgroundColor = '#2d2d2d';
    trackItem.style.borderRadius = '4px';

    const crossIcon = document.createElement('span');
    crossIcon.textContent = '❌';
    crossIcon.style.marginRight = '10px';

    const trackText = document.createElement('span');
    trackText.textContent = `${track.artists.join(", ")} - ${track.title}`;
    trackText.style.color = '#fff';

    trackItem.appendChild(crossIcon);
    trackItem.appendChild(trackText);
    tracksList.appendChild(trackItem);
  });

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Закрыть';
  closeButton.style.padding = '8px 16px';
  closeButton.style.borderRadius = '4px';
  closeButton.style.border = 'none';
  closeButton.style.backgroundColor = '#3a3a3a';
  closeButton.style.color = '#fff';
  closeButton.style.cursor = 'pointer';
  closeButton.style.marginTop = '20px';
  closeButton.style.width = '100%';

  closeButton.addEventListener('click', function() {
    modal.remove();
  });

  modalContent.appendChild(title);
  modalContent.appendChild(tracksList);
  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
};
