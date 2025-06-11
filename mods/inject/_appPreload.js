// функция скачивания файла на уровне электрона, которая становится доступной в объекте window страницы приложения
const https = require("https");
const fs = require("fs");
const process = require("process");
const { contextBridge, ipcRenderer } = require("electron");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Не проверять сертификаты

contextBridge.exposeInMainWorld("_ModDownloader", {
  saveFolder: process.env.USERPROFILE + "\\YandexMod Download",
  
  save(url, name, openFolder = true, albumName = null) {
    console.log("Backend get download request: ", url);
    const self = this;

    let savePath = self.saveFolder;
    
    // Если включена опция сохранения в подпапку и передано имя альбома/плейлиста
    if (localStorage.getItem('useAlbumDir') === 'true' && albumName) {
      savePath = savePath + "\\" + albumName.replace(/[/\\?%*:|"<>]/g, "-");
    }

    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    const filePath = savePath + "\\" + name;
    if (!fs.existsSync(filePath)) {
      const file = fs.createWriteStream(filePath);
      const request = https.get(url, function(response) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("Download Completed");
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
  
  setSaveFolder(path) {
    this.saveFolder = path;
    if (!fs.existsSync(this.saveFolder)) {
      fs.mkdirSync(this.saveFolder, { recursive: true });
    }
  },
});

// Яндекс Музыка\resources\app\main\lib\preload.js
// прикрепляется вниз оригинального файла
