window.TracksDatabase = [];
window.OAuthToken = localStorage.oauth ? "OAuth " + JSON.parse(localStorage.oauth).value : null;

setInterval(() => {
  try {
    AddTrackDownloadButton();
  } catch {}
}, 300);

// когда приложение запрашивает трек для воспроизведения, перехватываем запрос и получаем айди трека.
// Теперь можно получить информацию о треке по его айди и записать в массив. Когда пользователь
// нажмет кнопку скачать, сохраненный трек будет найден в массиве по названию и исполнителям
window.YandexApiOnRequest("/get-file-info", async function (request) {
  (async function () {
    var trackId = new URLSearchParams(request.url).get("trackId");
    if (!trackId) return;
    if (TracksDatabase.find((x) => x.id === trackId)) return;
    var tracks = await downloader.GetTracksInfo([trackId]);
    TracksDatabase.push(tracks[0]);
    downloader.Log("New track in database:", tracks[0]);
  })();
  return null;
});

const downloadSvg = '<svg style="height: 20px;width: 20px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M360 480c13.3 0 24-10.7 24-24s-10.7-24-24-24L24 432c-13.3 0-24 10.7-24 24s10.7 24 24 24l336 0zM174.5 344.4c4.5 4.8 10.9 7.6 17.5 7.6s12.9-2.7 17.5-7.6l128-136c9.1-9.7 8.6-24.8-1-33.9s-24.8-8.6-33.9 1L216 267.5l0-83.5 0-128c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 128 0 83.5L81.5 175.6c-9.1-9.7-24.3-10.1-33.9-1s-10.1 24.3-1 33.9l128 136z"/></svg>';
const loadingSvg = '<svg style="height: 20px;width: 20px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M215.1 26.3c3.6 12.7-3.7 26-16.5 29.7C111.6 80.9 48 161.1 48 256c0 114.9 93.1 208 208 208s208-93.1 208-208c0-94.9-63.6-175.1-150.6-200c-12.7-3.6-20.1-16.9-16.5-29.7s16.9-20.1 29.7-16.5C433.6 40.5 512 139.1 512 256c0 141.4-114.6 256-256 256S0 397.4 0 256C0 139.1 78.4 40.5 185.4 9.9c12.7-3.6 26 3.7 29.7 16.5z"/></svg>';

function AddTrackDownloadButton() {
  var player = document.querySelector('section[aria-labelledby="player-region"]');
  var buttons = player.querySelector('div[class*="PlayerBarDesktop_infoButtons__"]');
  if (buttons.querySelector("button.downloadButton")) return;
  if (buttons.children.length === 0) return;

  var button = document.createElement("button");
  button.style.padding = "10px;";
  button.className = buttons.querySelector('button[data-test-id="LIKE_BUTTON"]').className + " downloadButton";
  button.innerHTML = downloadSvg;
  buttons.appendChild(button);
  button.onclick = async function (e) {
    if (button.classList.contains("loading")) return;

    button.querySelector("svg").outerHTML = loadingSvg;
    button.classList.add("rotating");

    var playerTitleElement = player.querySelector('a[data-test-id="TRACK_TITLE"]') || player.querySelector('span[class*="Meta_title__"]');
    var playerTitle = playerTitleElement.innerText.trim();

    var playerArtists = [];

    if (player.querySelectorAll('a[data-test-id="SEPARATED_ARTIST_TITLE"]')) playerArtists = [...player.querySelectorAll('a[data-test-id="SEPARATED_ARTIST_TITLE"]')].map((x) => x.innerText.trim()).sort();
    if (player.querySelector('span[class*="Meta_albumTitle__"]')) playerArtists = [player.querySelector('span[class*="Meta_albumTitle__"]').innerText.trim()];

    var foundTrack = TracksDatabase.find((x) => x.title === playerTitle && JSON.stringify(x.artists.sort()) === JSON.stringify(playerArtists));

    if (!foundTrack) {
      console.error("Track not found:", playerTitle, playerArtists);
      downloader.Log("TracksDatabase:", TracksDatabase);
      button.querySelector("svg").outerHTML = downloadSvg;
      button.classList.remove("rotating");
      return;
    }

    downloader.Log("Download track requested:", foundTrack, OAuthToken);

    var downloadUrl = await downloader.GetTrackUrl(foundTrack.id, OAuthToken);
    var filename = `${foundTrack.artists.join(", ").replace(/[/\\?%*:|"<>]/g, "-")} - ${foundTrack.title.replace(/[/\\?%*:|"<>]/g, "-")}`;
    if (filename.length > 200) filename = filename.substring(0, 200);
    _ModDownloader.save(downloadUrl, `${filename}.mp3`);

    setTimeout(function () {
      button.querySelector("svg").outerHTML = downloadSvg;
      button.classList.remove("rotating");
    }, 1000);
  };
}
