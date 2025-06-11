setInterval(() => {
  if ((location.href.includes("/album?albumId=") || location.href.includes("/playlists?playlistUuid=")) && (document.querySelector('div[class*="PageHeaderAlbum_controls__"]') || document.querySelector('div[class*="PageHeaderPlaylist_mainControls__"]'))) {
    AddAlbumDownloadButton();
  }
}, 300);

function ShowDownloadSettingsModal() {
  // Check if modal already exists
  if (document.getElementById('downloadSettingsModal')) return;

  const modal = document.createElement('div');
  modal.id = 'downloadSettingsModal';
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
  modalContent.style.width = '400px';
  modalContent.style.maxWidth = '90%';

  const title = document.createElement('h3');
  title.textContent = 'Настройки загрузки';
  title.style.marginTop = '0';
  title.style.color = '#fff';

  const defaultDirCheckbox = document.createElement('input');
  defaultDirCheckbox.type = 'checkbox';
  defaultDirCheckbox.id = 'defaultDirCheckbox';
  defaultDirCheckbox.checked = localStorage.getItem('useDefaultDownloadDir') !== 'false';
  
  const defaultDirLabel = document.createElement('label');
  defaultDirLabel.htmlFor = 'defaultDirCheckbox';
  defaultDirLabel.textContent = 'Использовать директорию по умолчанию';
  defaultDirLabel.style.color = '#fff';
  defaultDirLabel.style.marginLeft = '8px';

  const defaultDirPath = document.createElement('div');
  defaultDirPath.id = 'defaultDirPath';
  defaultDirPath.textContent = _ModDownloader.saveFolder;
  defaultDirPath.style.color = '#aaa';
  defaultDirPath.style.margin = '8px 0 16px 24px';
  defaultDirPath.style.fontSize = '14px';

  const customDirLabel = document.createElement('label');
  customDirLabel.textContent = 'Пользовательская директория:';
  customDirLabel.style.color = '#fff';
  customDirLabel.style.display = 'block';
  customDirLabel.style.marginBottom = '8px';

  const customDirInput = document.createElement('input');
  customDirInput.type = 'text';
  customDirInput.id = 'customDirInput';
  customDirInput.value = localStorage.getItem('customDownloadDir') || '';
  _ModDownloader.setSaveFolder(customDirInput.value);

  customDirInput.disabled = defaultDirCheckbox.checked;
  customDirInput.style.width = '100%';
  customDirInput.style.padding = '8px';
  customDirInput.style.borderRadius = '4px';
  customDirInput.style.border = '1px solid #444';
  customDirInput.style.backgroundColor = '#2d2d2d';
  customDirInput.style.color = '#fff';
  customDirInput.style.marginBottom = '16px';

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'flex-end';
  buttonContainer.style.marginTop = '20px';

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Сохранить';
  saveButton.style.padding = '8px 16px';
  saveButton.style.borderRadius = '4px';
  saveButton.style.border = 'none';
  saveButton.style.backgroundColor = '#3a3a3a';
  saveButton.style.color = '#fff';
  saveButton.style.cursor = 'pointer';
  saveButton.style.marginLeft = '8px';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Закрыть';
  closeButton.style.padding = '8px 16px';
  closeButton.style.borderRadius = '4px';
  closeButton.style.border = 'none';
  closeButton.style.backgroundColor = '#3a3a3a';
  closeButton.style.color = '#fff';
  closeButton.style.cursor = 'pointer';

  // Event listeners
  defaultDirCheckbox.addEventListener('change', function() {
    customDirInput.disabled = this.checked;
    browseButton.disabled = this.checked;
  });

  // Set initial disabled state
  customDirInput.disabled = defaultDirCheckbox.checked;

  saveButton.addEventListener('click', function() {
    if (!defaultDirCheckbox.checked && customDirInput.value) {
      _ModDownloader.setSaveFolder(customDirInput.value);
      localStorage.setItem('customDownloadDir', customDirInput.value);
    }
    localStorage.setItem('useDefaultDownloadDir', defaultDirCheckbox.checked);
    modal.remove();
  });

  closeButton.addEventListener('click', function() {
    modal.remove();
  });

  // Build modal structure
  modalContent.appendChild(title);
  modalContent.appendChild(defaultDirCheckbox);
  modalContent.appendChild(defaultDirLabel);
  modalContent.appendChild(defaultDirPath);
  modalContent.appendChild(customDirLabel);
  modalContent.appendChild(customDirInput);
  buttonContainer.appendChild(closeButton);
  buttonContainer.appendChild(saveButton);
  modalContent.appendChild(buttonContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

function AddAlbumDownloadButton() {
  if (document.querySelector('div[class*="PageHeaderAlbum_controls__"] button.downloadButton')) return;
  if (document.querySelector('div[class*="PageHeaderPlaylist_mainControls__"] button.downloadButton')) return;

  // Create download button
  var button = document.createElement("button");
  button.style.padding = "10px;";
  button.className = document.querySelector('button[data-test-id*="_HEADER_CONTEXT_MENU_BUTTON"]').className + " downloadButton";
  button.innerHTML = '<img src="/_next/static/yandex_mod/downloader/img/icon.png" style="height: 18px;">';

  // Create settings button
  var settingsButton = document.createElement("button");
  settingsButton.style.padding = "10px;";
  settingsButton.style.marginLeft = "5px";
  settingsButton.className = document.querySelector('button[data-test-id*="_HEADER_CONTEXT_MENU_BUTTON"]').className + " settingsButton";
  settingsButton.innerHTML = '<svg style="height:18px;width:18px" viewBox="0 0 24 24"><path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg>';
  settingsButton.onclick = function() {
    ShowDownloadSettingsModal();
  };
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

  if (document.querySelector('div[class*="PageHeaderAlbum_controls__"]'))
  {
    var albumControls = document.querySelector('div[class*="PageHeaderAlbum_controls__"]');
    albumControls.appendChild(button);
    albumControls.appendChild(settingsButton);
  }

  if (document.querySelector('div[class*="PageHeaderPlaylist_mainControls__"]'))
  {
    var playlistControls = document.querySelector('div[class*="PageHeaderPlaylist_mainControls__"]');
    playlistControls.appendChild(button);
    playlistControls.appendChild(settingsButton);
  }
}
