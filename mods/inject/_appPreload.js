// функция скачивания файла на уровне электрона, которая становится доступной в объекте window страницы приложения
const https = require("https");
const fs = require("fs");
const process = require("process");
const { contextBridge, ipcRenderer } = require("electron");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Не проверять сертификаты

contextBridge.exposeInMainWorld("_ModDownloader", {
  saveFolder: process.env.USERPROFILE + "\\YandexMod Download",
  
  save(url, name, openFolder = true) {
    console.log("Backend get download request: ", url);
    const self = this;

    if (!fs.existsSync(self.saveFolder)) {
      fs.mkdirSync(self.saveFolder, { recursive: true });
    }

    const filePath = self.saveFolder + "\\" + name;
    if (!fs.existsSync(filePath)) {
      const file = fs.createWriteStream(filePath);
      const request = https.get(url, function(response) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("Download Completed");
          if (openFolder) require("child_process").exec('start "" "' + self.saveFolder + '"');
        });
      });
    } else {
      console.log(`File ${filePath} already exists, skip`);
    }
  },
  
  openFolder() {
    require("child_process").exec('start "" "' + this.saveFolder + '"');
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
