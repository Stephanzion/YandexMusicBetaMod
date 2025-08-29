electron_1.contextBridge.exposeInMainWorld("yandexMusicMod", {
  getStorageValue: (key: string) => electron_1.ipcRenderer.invoke("yandexMusicMod.getStorageValue", key),
  setStorageValue: (key: string, value: any) =>
    electron_1.ipcRenderer.send("yandexMusicMod.setStorageValue", key, value),
  onStorageChanged: (cb: Function) => {
    const listener = (_e, key, value) => cb(key, value);
    electron_1.ipcRenderer.on("yandexMusicMod.storageValueUpdated", listener);
    return () => electron_1.ipcRenderer.removeListener("yandexMusicMod.storageValueUpdated", listener);
  },
  downloadTrack: (downloadInfo: any, trackMeta: any, customDownloadPath?: string) =>
    electron_1.ipcRenderer.invoke("yandexMusicMod.downloadTrack", downloadInfo, trackMeta, customDownloadPath),
  openDownloadDirectory: () => electron_1.ipcRenderer.send("yandexMusicMod.openDownloadDirectory"),
  selectDownloadFolder: () => electron_1.ipcRenderer.invoke("yandexMusicMod.selectDownloadFolder"),
  openFolder: (folderPath: string) => electron_1.ipcRenderer.invoke("yandexMusicMod.openFolder", folderPath),
});
