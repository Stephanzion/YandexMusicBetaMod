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
  
  async save(url, name, openFolder = true, albumName = null) {
    console.log("Backend get download request: ", url);

    const savePath = this.genSavePath(albumName);
    const tempFilePath = savePath + "\\" + this.genSafeName(name) + "~";
    const finalFilePath = savePath + "\\" + this.genSafeName(name);

    // Удаляем старый временный файл, если есть
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    const maxAttempts = parseInt(localStorage.getItem('downloadMaxAttempts') || '3');
    
    let attempts = 0;
    let success = false;

    const downloadWithRetry = async () => {
      while (attempts < maxAttempts && !success) {
        attempts++;
        console.log(`Download attempt ${attempts} of ${maxAttempts}`);

        try {
          const file = fs.createWriteStream(tempFilePath);
          await new Promise((resolve, reject) => {
            const request = https.get(url, function(response) {
              response.pipe(file);
              
              file.on("finish", async () => {
                file.close();
                // Даем время на освобождение файлового дескриптора
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Пытаемся переименовать файл с несколькими попытками
                let renameAttempts = 0;
                const maxRenameAttempts = 5;
                let renameSuccess = false;
                
                while (renameAttempts < maxRenameAttempts && !renameSuccess) {
                  renameAttempts++;
                  try {
                    // Проверяем существует ли временный файл
                    if (fs.existsSync(tempFilePath)) {
                      fs.renameSync(tempFilePath, finalFilePath);
                      renameSuccess = true;
                      console.log("Download Completed: ", finalFilePath);
                    } else {
                      console.error("Temp file not found:", tempFilePath);
                      break;
                    }
                  } catch (renameError) {
                    console.error(`Rename attempt ${renameAttempts} failed:`, renameError);
                    if (renameAttempts >= maxRenameAttempts) {
                      console.error("Failed to rename file after", maxRenameAttempts, "attempts");
                      // Оставляем файл с тильдой, чтобы не потерять данные
                      break;
                    }
                    // Ждем перед следующей попыткой
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }
                
                if (renameSuccess && openFolder) {
                  require("child_process").exec('start "" "' + savePath + '"');
                }
                success = renameSuccess;
                resolve();
              });

              file.on("error", (err) => {
                file.close();
                reject(err);
              });
            });

            request.on("error", (err) => {
              file.close();
              reject(err);
            });
          });
        } catch (error) {
          console.error(`Download attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) {
            throw error;
          }
          // Ждем перед следующей попыткой
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    };

    if (!fs.existsSync(finalFilePath)) {
      return downloadWithRetry();
    } else {
      console.log(`File ${finalFilePath} already exists, skip`);
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
