// функция скачивания файла на уровне электрона, которая становится доступной в объекте window страницы приложения
const https = require("https");
const fs = require("fs");
const process = require("process");
const { contextBridge, ipcRenderer } = require("electron");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Не проверять сертификаты
const saveFolderDefault = process.env.USERPROFILE + "\\YandexMod Download"

contextBridge.exposeInMainWorld("_ModDownloader", {
  saveFolder: saveFolderDefault,

  fileExists(filePath) {
    return fs.existsSync(filePath);
  },

  getSaveFolderDefault() {
    return saveFolderDefault;
  },

  genSafeName(name) {
    return name.replace(/[/\\?%*:|"<>]/g, "-");
  },

  genSavePath(albumName = null) {
    let savePath = this.saveFolder;

    if (!savePath || savePath === 'undefined')
      throw "Critical logic error with path (genSavePath): " + savePath;

    // Если включена опция сохранения в подпапку и передано имя альбома/плейлиста
    if (localStorage.getItem('useAlbumDir') === 'true' && albumName)
      savePath += "\\" + this.genSafeName(albumName);

    if (!fs.existsSync(savePath))
      fs.mkdirSync(savePath, { recursive: true });

    if (!savePath)
      throw "Critical logic error with savePath: " + albumName;

    return savePath;
  },
  
  save(url, name, openFolder = true, albumName = null) {
    console.log("Backend get download request: ", url);

    const savePath = this.genSavePath(albumName);
    const filePath = savePath + "\\" + this.genSafeName(name);
    if (!fs.existsSync(filePath)) {
      const file = fs.createWriteStream(filePath);
      const request = https.get(url, function(response) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("Download Completed: ", filePath);
          if (openFolder) require("child_process").exec('start "" "' + savePath + '"');
        });
      });
    } else {
      console.log(`File ${filePath} already exists, skip`);
    }
  },
  
  openFolder(subFolder = '') {
    if (localStorage.getItem('useAlbumDir') !== 'true')
      subFolder = '';
    require("child_process").exec('start "" "' + this.saveFolder + (subFolder ? '\\' + subFolder : '') + '"');
  },
  
  setSaveFolder(savePath) {
    if (!savePath || savePath === 'undefined')
      this.saveFolder = saveFolderDefault;
    else
    {
      this.saveFolder = savePath;
      if (!fs.existsSync(this.saveFolder))
        fs.mkdirSync(this.saveFolder, {recursive: true});
    }
    console.info("Set saveFolder: " + savePath);
  },
});

// Яндекс Музыка\resources\app\main\lib\preload.js
// прикрепляется вниз оригинального файла
