setInterval(() => {
  if ((location.href.includes("/album?albumId=") || location.href.includes("/playlists?playlistUuid=")) && (document.querySelector('div[class*="PageHeaderAlbum_controls__"]') || document.querySelector('div[class*="PageHeaderPlaylist_mainControls__"]'))) {
    AddAlbumDownloadButton();
  }
}, 300);

function AddAlbumDownloadButton() {
  if (document.querySelector('div[class*="PageHeaderAlbum_controls__"] button.downloadButton')) return;
  if (document.querySelector('div[class*="PageHeaderPlaylist_mainControls__"] button.downloadButton')) return;

  var button = document.createElement("button");
  button.style.padding = "10px;";
  button.className = document.querySelector('button[data-test-id*="_HEADER_CONTEXT_MENU_BUTTON"]').className + " downloadButton";
  button.innerHTML = '<img src="/_next/static/yandex_mod/downloader/img/icon.png" style="height: 18px;">';
  button.onclick = async function (e) {
    if (button.querySelector("img").src.includes("loading")) return;
    button.querySelector("img").src = "/_next/static/yandex_mod/downloader/img/icon-loading.png";
    button.classList.add("rotating");

    var playlistType = location.href.includes("/album?albumId=") ? "album" : "playlist";
    var playlistId = playlistType === "album" ? location.href.split("albumId=")[1] : location.href.split("playlistUuid=")[1];
    console.log("Download playlist requested:", playlistId, OAuthToken);

    var trackIds = [];

    if (playlistType === "album") {
      var trackIds = await downloader.GetAlbumTracks(playlistId);
      console.log("[Downloader] get album tracks", playlistId, trackIds);
    } else if (playlistType === "playlist") {
      var trackIds = await downloader.GetPlaylistTracks(playlistId);
      console.log("[Downloader] get album tracks", playlistId, trackIds);
    }

    var tracks = [];

    const chunkSize = 50;
    for (var i = 0; i < trackIds.length; i += chunkSize) {
      const chunk = trackIds.slice(i, i + chunkSize);
      console.log("[Downloader] get tracks info", chunk);
      var newTracks = await downloader.GetTracksInfo(chunk);
      tracks.push(...newTracks);
    }

    console.log("[Downloader] got tracks", tracks);

    for (var i = 0; i < tracks.length; i++) {
      console.log("Download track requested:", tracks[i].id, OAuthToken);
      var downloadUrl = await downloader.GetTrackUrl(tracks[i].id, OAuthToken);
      var filename = `${tracks[i].artists.join(", ").replace(/[/\\?%*:|"<>]/g, "-")} - ${tracks[i].title.replace(/[///\\?%*:|"<>]/g, "-")}`;
      _ModDownloader.save(downloadUrl, `${filename}.mp3`, false);
    }

    _ModDownloader.openFolder();

    button.classList.remove("rotating");
    button.querySelector("img").src = "/_next/static/yandex_mod/downloader/img/icon.png";
  };
  if (document.querySelector('div[class*="PageHeaderAlbum_controls__"]')) document.querySelector('div[class*="PageHeaderAlbum_controls__"]').appendChild(button);
  if (document.querySelector('div[class*="PageHeaderPlaylist_mainControls__"]')) document.querySelector('div[class*="PageHeaderPlaylist_mainControls__"]').appendChild(button);
}
