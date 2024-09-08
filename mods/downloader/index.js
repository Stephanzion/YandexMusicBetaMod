var TracksDatabase = [];
var OAuthToken = localStorage.oauth ? "OAuth " + JSON.parse(localStorage.oauth).value : null;

setInterval(UpdateTracksUI, 300);

// Перехватывает все fetch`и, и ищет в них информацию о треках. Таким образом изменение структуры api
// должно с меньшей вероятностью поломать мод. Главное чтобы в объекте были ключевые слова,
/// имеющие отношение к треку (title, artists и тд)
window.AddYandexApiFetchHandler("api.music.yandex.net", function (response) {
  HandleJsonResponse(response.data);
  return null;
});

// Когда ответ от api получен, ищет вложенные объекты, похожие на информацию о треках, и добавляет в TracksDatabase.
// После этого по нажатию на кнопку скачать, мод сопоставит название и авторов трека с информацией о них в TracksDatabase. Получит id трека и сможет его скачать.
function HandleJsonResponse(data) {
  FilterTracksFromJson(data);
}

function FilterTracksFromJson(data) {
  function getNestedObjects(obj) {
    let result = [];
    function recurse(current) {
      if (typeof current === "object" && current !== null) {
        let keys = Object.keys(current);
        let hasMultipleElements = keys.some((key) => Array.isArray(current[key]) || (typeof current[key] === "object" && current[key] !== null));

        if (hasMultipleElements) {
          result.push(current);
        }

        keys.forEach((key) => {
          if (typeof current[key] === "object" && current[key] !== null) {
            recurse(current[key]);
          }
        });
      }
    }
    recurse(obj);
    return result;
  }

  let nestedObjects = getNestedObjects(data);
  for (let i = 0; i < nestedObjects.length; i++) {
    if (Object.keys(nestedObjects[i]).filter((x) => x.includes("title") || x.includes("type") || x.includes("artists") || x.includes("realId")).length == 4) {
      if (nestedObjects[i].type == "music") {
        var artists = [];
        for (var j = 0; j < nestedObjects[i].artists.length; j++) {
          if (nestedObjects[i].artists[j].decomposed) nestedObjects[i].artists.push(nestedObjects[i].artists[j].decomposed[1]);
          artists.push(nestedObjects[i].artists[j].name);
        }
        TracksDatabase.push({
          title: nestedObjects[i].title,
          artists: nestedObjects[i].artists.map((x) => x.name),
          id: nestedObjects[i].realId,
        });
      }
    }
  }
}

function UpdateTracksUI() {
  // add playlist page
  var trackElements = QueryTrackElements('div[data-test-id="TRACK_PLAYLIST"]');
  // add album page
  trackElements = trackElements.concat(QueryTrackElements('div[data-test-id="TRACK_ALBUM"]'));
  // todo: add podcasts page (not working)
  trackElements = trackElements.concat(QueryTrackElements('div[data-test-id="TRACK_PODCAST"]'));
  // add history page
  trackElements = trackElements.concat(QueryTrackElements('div[data-test-id="SEARCH_HISTORY_PAGE"] div[class*="MixedEntitiesListItem_root__"]:has(div[class*="Meta_metaContainer__"])'));
  // add mini history page
  trackElements = trackElements.concat(QueryTrackElements('div[class*="HorizontalCardContainer_root__"][class*="MixedEntitiesListItem_root__"]:has(div[class*="Meta_metaContainer__"])'));

  for (var i = 0; i < trackElements.length; i++) {
    var title = trackElements[i].querySelector('span[data-test-id="TRACK_TITLE"]');
    if (!title) continue;
    title = title.innerText;

    var artists = [...trackElements[i].querySelectorAll('a[data-test-id="SEPARATED_ARTIST_TITLE"]')].map((x) => x.innerText.trim());
    if (artists.length == 0) artists = [document.querySelector('a[data-test-id="SEPARATED_ARTIST_TITLE"]').innerText.trim()];

    artists = [...new Set(artists)];

    var dbTrack = TracksDatabase.find((x) => x.title.toLowerCase().trim() == title.toLowerCase().trim() && x.artists.sort().join(",") == artists.sort().join(","));

    if (!dbTrack) {
      console.error("Track not found in database:", title, artists);
      return;
    }
    console.log("New track in database:", title, artists, dbTrack);

    trackElements[i].setAttribute("track_id", dbTrack.id);
    trackElements[i].classList.add("has_download");
    AddDownloadButton(trackElements[i].querySelector('div[class*="ControlsBar_root__"]'), dbTrack.id);
  }
}

function QueryTrackElements(query) {
  return [...document.querySelectorAll(`${query}:not([class*="has_download"]):not(:has(button.downloadButton))`)];
}

function AddDownloadButton(parentElement, trackId) {
  if (parentElement.querySelector("button.downloadButton")) return;
  var button = document.createElement("button");
  button.style.padding = "10px;";
  button.className = document.querySelector('button[data-test-id="LIKE_BUTTON"]').className + " downloadButton";
  button.innerHTML = '<img src="/_next/static/yandex_mod/downloader/img/icon.png" style="height: 17px;">';
  button.onclick = async function (e) {
    button.classList.add("rotating");
    button.querySelector("img").src = "/_next/static/yandex_mod/downloader/img/icon-loading.png";
    console.log("Download track requested:", trackId, OAuthToken);
    var downloadUrl = await downloader.GetTrackUrl(trackId, OAuthToken);
    var track = TracksDatabase.find((x) => x.id == trackId);
    var filename = `${track.artists.join(", ").replace(/[/\\?%*:|"<>]/g, "-")} - ${track.title.replace(/[/\\?%*:|"<>]/g, "-")}`;
    if (filename.length > 200) filename = filename.substring(0, 200);
    _ModDownloadUrl.save(downloadUrl, `${filename}.mp3`);
    button.classList.remove("rotating");
    button.querySelector("img").src = "/_next/static/yandex_mod/downloader/img/icon.png";
  };
  parentElement.appendChild(button);
}
