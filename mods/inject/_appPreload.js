// функция скачивания файла на уровне электрона, которая становится доступной в объекте window страницы приложения
const https = require("https");
const fs = require("fs");
const process = require("process");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Не проверять сертификаты

electron_1.contextBridge.exposeInMainWorld("_ModDownloadUrl", {
  save(url, name) {
    console.log("Backend get download request: ", url);

    const saveFolder = process.env.USERPROFILE + "\\YandexMod Download";
    if (!fs.existsSync(saveFolder)) {
      fs.mkdirSync(saveFolder, { recursive: true });
    }

    const file = fs.createWriteStream(saveFolder + "\\" + name);
    const request = https.get(url, function (response) {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
        require("child_process").exec('start "" "' + saveFolder + '"');
      });
    });
  },
});

// Яндекс Музыка\resources\app\main\lib\preload.js
// прикрепляется к строчке: electron_1.contextBridge.exposeInMainWorld("PLATFORM", node_os_1.default.platform());
