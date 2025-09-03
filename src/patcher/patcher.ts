import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "url";
import asar from "asar";
import { prettifyDirectory } from "./prettier";
const _7z = require("7zip-min");
import { $ } from "bun";

import { downloadBuild } from "./api";
import type { AppBuild } from "~/types/AppBuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __projectRoot = path.resolve(__dirname, "..", "..");

export async function processBuild(build: AppBuild) {
  const buildDir = path.resolve(path.join(__projectRoot, ".versions", build.version));
  const tempDir = path.join(buildDir, "temp");
  const buildBinaryPath = path.join(tempDir, "build.bin");
  const extractDir = path.join(tempDir, "extracted");
  const buildSourceDir = path.join(buildDir, "src");
  const buildModdedDir = path.join(buildDir, "mod");
  const modSorcesDir = path.join(__projectRoot, "src/mod");
  const modCompiledDir = path.join(__projectRoot, "src/mod/dist");
  const progressArray: string[] = [];

  const logProgress = (message: string) => {
    progressArray.push(message);
    console.log(progressArray.at(-1));
  };

  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }

  fs.mkdirSync(buildDir, { recursive: true });
  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(buildSourceDir, { recursive: true });
  fs.mkdirSync(buildModdedDir, { recursive: true });

  logProgress(`[1] Downloading build ${build.version}`);

  const downloadResult = await downloadBuild(build, buildBinaryPath);

  if (downloadResult.isErr()) {
    logProgress(`❌ Failed to download build ${build.version}: ${downloadResult.error}`);
    return;
  } else {
    logProgress(`✔️   Done`);
  }

  logProgress(`[2] Extracting build ${build.version} to ${extractDir}`);

  try {
    await _7z.unpack(buildBinaryPath, extractDir);
    logProgress(`✔️   Done`);
  } catch (error) {
    logProgress(`❌ Failed to extract build ${build.version}: ${error}`);
    return;
  }

  logProgress(`[3] Find and extract app.asar`);

  const appAsarPath = path.resolve(path.join(extractDir, "resources", "app.asar"));
  const appIconPath = path.resolve(path.join(extractDir, "resources", "assets", "icon.ico"));

  if (appAsarPath) {
    logProgress(`✔️   Found app.asar`);
  } else {
    logProgress(`❌ app.asar was not found inside the extracted installer for ${build.version}`);
    return;
  }

  if (appIconPath) {
    logProgress(`✔️   Found app icon`);
    fs.copyFileSync(appIconPath, path.join(buildDir, "icon.ico"));
  } else {
    logProgress(`❌ app icon was not found inside the extracted installer for ${build.version}`);
    return;
  }

  try {
    asar.extractAll(appAsarPath, buildSourceDir);
    logProgress(`✔️   Extracted app.asar`);
  } catch (error) {
    logProgress(`❌ Failed to extract app.asar: ${error}`);
    return;
  }

  try {
    fs.mkdirSync(path.join(buildDir, "src", "assets"));
    fs.copyFileSync(appIconPath, path.join(buildDir, "src", "assets", "icon.ico"));
    fs.copyFileSync(path.join(__projectRoot, "yaicon.png"), path.join(buildDir, "src", "assets", "icon.png"));
    logProgress(`✔️   Extracted app icons`);
  } catch (error) {
    logProgress(`❌ Failed to extract app.asar: ${error}`);
    return;
  }

  logProgress(`[4] Cleaning up temporary files`);

  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    logProgress(`✔️   Done`);
  } catch (error) {
    logProgress(`❌ Failed to clean up temporary files: ${error}`);
    return;
  }

  logProgress(`[5] Copy sources before modding`);

  try {
    fs.cpSync(buildSourceDir, buildModdedDir, { recursive: true });
    logProgress(`✔️   Done`);
  } catch (error) {
    logProgress(`❌ Failed to copy sources before modding: ${error}`);
    return;
  }

  logProgress(`[6] Patching app.asar`);

  // Key files for patching
  const staticFiles = {
    packageJson: path.join(buildModdedDir, "package.json"),
    configJs: path.join(buildModdedDir, "main", "config.js"),
    mainJs: path.join(buildModdedDir, "main", "index.js"),
    preloadJs: path.join(buildModdedDir, "main", "lib", "preload.js"),
    createWindowJs: path.join(buildModdedDir, "main", "lib", "createWindow.js"),
    updaterJs: path.join(buildModdedDir, "main", "lib", "updater.js"),
    systemMenuJs: path.join(buildModdedDir, "main", "lib", "systemMenu.js"),
  };

  logProgress(`🛠️  Locate static files [${Object.keys(staticFiles).join(", ")}]`);

  for (const file of Object.keys(staticFiles) as (keyof typeof staticFiles)[]) {
    if (fs.existsSync(staticFiles[file])) {
      logProgress(`✔️   Found ${file}`);
    } else {
      logProgress(`❌ ${file} was not found inside the sources for ${build.version}`);
      return;
    }
  }

  logProgress(`🛠️  Patch package.json`);

  let packageJsonContents = JSON.parse(fs.readFileSync(staticFiles.packageJson, "utf8"));
  const bannedDependencies = ["@yandex-chats/signer"];
  packageJsonContents.dependencies = Object.fromEntries(
    Object.entries(packageJsonContents.dependencies).filter(([key]) => !bannedDependencies.includes(key)),
  );
  packageJsonContents.devDependencies = Object.fromEntries(
    Object.entries(packageJsonContents.devDependencies).filter(([key]) => !bannedDependencies.includes(key)),
  );
  packageJsonContents.common.REFRESH_EVENT_TRIGGER_TIME_MS = 999_999_999;
  packageJsonContents.common.UPDATE_POLL_INTERVAL_MS = 999_999_999;
  packageJsonContents.common.SUPPORT_URL = "<empty>";
  packageJsonContents.name = "YandexMusicMod";
  packageJsonContents.author = "Stephanzion [github.com/Stephanzion]";
  packageJsonContents.meta.PRODUCT_NAME = "Yandex Music Mod";
  packageJsonContents.meta.PRODUCT_NAME_LOCALIZED = "Yandex Music Mod";
  packageJsonContents.meta.APP_ID = "ru.yandex.desktop.music.mod";
  packageJsonContents.meta.COPYRIGHT = "Stephanzion [github.com/Stephanzion]";
  packageJsonContents.meta.TRADEMARK = "Stephanzion [github.com/Stephanzion]";
  packageJsonContents.appConfig.enableDevTools = true;
  packageJsonContents.appConfig.enableAutoUpdate = false;
  packageJsonContents.appConfig.enableUpdateByProbability = false;
  packageJsonContents.appConfig.systemDefaultLanguage = "ru";
  packageJsonContents.build = {
    appId: "ru.yandex.desktop.music.mod",
    productName: "Яндекс Музыка",
    win: {
      icon: "assets/icon.ico",
    },
    mac: {
      icon: "assets/icon.ico",
    },
    linux: {
      icon: "assets/icon.png",
    },
    extraResources: [
      {
        from: "assets/",
        to: "assets/",
        filter: ["**/*"],
      },
    ],
  };

  logProgress(`🛠️  Merge dependencies`);

  const rootPackageJsonContents = JSON.parse(fs.readFileSync(path.join(__projectRoot, "package.json"), "utf8"));

  if (!packageJsonContents.dependencies) packageJsonContents.dependencies = {};
  for (const key of Object.keys(rootPackageJsonContents.dependencies)) {
    packageJsonContents.dependencies[key] = rootPackageJsonContents.dependencies[key];
  }

  if (!packageJsonContents.devDependencies) packageJsonContents.devDependencies = {};
  for (const key of Object.keys(rootPackageJsonContents.devDependencies)) {
    packageJsonContents.devDependencies[key] = rootPackageJsonContents.devDependencies[key];
  }

  fs.writeFileSync(staticFiles.packageJson, JSON.stringify(packageJsonContents, null, 2));

  logProgress(`✔️   Done`);

  logProgress(`🛠️  Enable devtools`);

  const configJsContents = fs
    .readFileSync(staticFiles.configJs, "utf8")
    .replaceAll("enableDevTools: false", "enableDevTools: true")
    .replaceAll("enableDevTools:false", "enableDevTools: true")
    .replaceAll("enableAutoUpdate: true", "enableAutoUpdate: false")
    .replaceAll("enableAutoUpdate:true", "enableAutoUpdate: false");
  fs.writeFileSync(staticFiles.configJs, configJsContents);

  // Чтение конфига на предмет настройки devtools/systemToolbar которая включает панель инструментов
  const systemMenuJsContents =
    `
    const fs = require("fs");
    const path = require("path");
    const electron = require("electron");
    const appFolder = electron.app.getPath("userData");
    const settingsFilePath = path.join(appFolder, "mod_settings.json");
    let enableSystemToolbar = false;
    try {
      enableSystemToolbar = JSON.parse(fs.readFileSync(settingsFilePath, "utf8"))["devtools/systemToolbar"];
    } catch (e) {}\n` +
    fs
      .readFileSync(staticFiles.systemMenuJs, "utf8")
      .replaceAll("deviceInfo_js_1.devicePlatform === platform_js_1.Platform.MACOS", "enableSystemToolbar");
  fs.writeFileSync(staticFiles.systemMenuJs, systemMenuJsContents);

  // Чтение конфига на предмет настройки devtools/systemToolbar которая отключает системную рамку окна а также включает возможность открыть devtools
  let createWindowJsContents =
    `
    const fs = require("fs");
    const path = require("path");
    const electron = require("electron");
    const appFolder = electron.app.getPath("userData");
    const settingsFilePath = path.join(appFolder, "mod_settings.json");
    let enableSystemToolbar = false;
    try {
      enableSystemToolbar = JSON.parse(fs.readFileSync(settingsFilePath, "utf8"))["devtools/systemToolbar"];
    } catch (e) {}\n` +
    fs
      .readFileSync(staticFiles.createWindowJs, "utf8")
      .replaceAll("config_js_1.config.app.enableDevTools", "true")
      .replaceAll("titleBarStyle: 'hidden'", "titleBarStyle: !enableSystemToolbar && 'hidden'")
      .replaceAll("titleBarStyle:'hidden'", "titleBarStyle: !enableSystemToolbar && 'hidden'")
      .replaceAll("minWidth: 768", "minWidth: 360")
      .replaceAll("minHeight: 650", "minHeight: 550")
      .replaceAll("show: false", "show: true");

  // Автоматически открывать devtools при запуске приложения
  if (process.env.AUTO_OPEN_DEVTOOLS?.toLowerCase() === "true")
    createWindowJsContents = createWindowJsContents.replaceAll(
      "return window",
      "window.webContents.openDevTools();\n" + "return window",
    );

  fs.writeFileSync(staticFiles.createWindowJs, createWindowJsContents);

  logProgress(`✔️   Done`);

  logProgress(`🛠️  Disable metrics/analytics`);

  const blockedAnalyticsUrls = [
    "https://yandex.ru/clck/*",
    "https://mc.yandex.ru/*",
    "https://api.music.yandex.net/dynamic-pages/trigger/*",
    "https://log.strm.yandex.ru/*",
    "https://api.acquisition-gwe.plus.yandex.net/*",
    "https://api.events.plus.yandex.net/*",
    "https://events.plus.yandex.net/*",
    "https://plus.yandex.net/*",
    "https://yandex.ru/ads/*",
    "https://strm.yandex.ru/ping",
  ];

  let mainJsContents = fs.readFileSync(staticFiles.mainJs, "utf8").replaceAll(
    "createWindow)();",
    "createWindow)();" +
      `
      const { session } = require("electron");
      session.defaultSession.webRequest.onBeforeRequest(
        {
          urls: ${JSON.stringify(blockedAnalyticsUrls)},
        },
        (details, callback) => {
          callback({ cancel: true });
        },
      );

      session.defaultSession.webRequest.onBeforeSendHeaders(
      {
        urls: ["https://api.music.yandex.net/*"],
      },
      (details, callback) => {
        const bannedHeaders = ["x-yandex-music-device", "x-request-id"];
        bannedHeaders.forEach((header) => {
          details.requestHeaders[header] = undefined;
        });
        callback({ requestHeaders: details.requestHeaders });
      },
    );

`,
  );

  logProgress(`✔️   Done`);

  logProgress(`🛠️  Remove startup video intro`);

  const splashScreenPath = path.join(buildModdedDir, "app", "media", "splash_screen");
  if (fs.existsSync(splashScreenPath)) {
    fs.rmSync(splashScreenPath, { recursive: true, force: true });
    logProgress(`✔️   Done`);
  } else {
    logProgress(`❌ Splash screen was not found inside the sources for ${build.version}`);
    return;
  }

  logProgress(`🛠️  Copy mods to build`);

  const modPreloadScript = path.join(modSorcesDir, "preload.ts");
  const modMainScript = path.join(modSorcesDir, "main.js");

  console.log(`\n---- 🚧 Building renderer.js ----`);

  await $`bun ui:build`;

  console.log(`\n---- 🚧 Building preload.js ----`);

  let buildResult = await Bun.build({
    target: "browser",
    format: "cjs",
    sourcemap: "linked",
    minify: false,
    entrypoints: [modPreloadScript],
    outdir: modCompiledDir,
  });

  let preloadJsContents =
    fs.readFileSync(staticFiles.preloadJs, "utf8") +
    `\n\n// yandexMusicMod preload.js\n(async () => {
        ${fs.readFileSync(path.join(modCompiledDir, "preload.js"), "utf8")}
      })();`;

  mainJsContents += `\n\n// yandexMusicMod main.js\n(async () => { 
        ${fs.readFileSync(modMainScript, "utf8")}
      })();`;

  logProgress(`🛠️  Copy discordRPC script to index.js`);

  mainJsContents = mainJsContents.replaceAll(
    'mod_require("discordRPC");',
    `\n\n// yandexMusicMod preload.js\n(async () => {
        ${fs.readFileSync(path.join(__projectRoot, "src/mod/features/utils/discordRPC.js"), "utf8")} 
      })();`,
  );

  logProgress(`✔️   Done`);

  fs.cpSync(path.join(modCompiledDir), path.join(buildModdedDir, "app", "yandexMusicMod"), {
    recursive: true,
  });

  let modRendererContents = fs.readFileSync(path.join(buildModdedDir, "app", "yandexMusicMod", "renderer.js"), "utf8");

  modRendererContents = `(function () {\n${modRendererContents}\n})()`;

  fs.writeFileSync(path.join(buildModdedDir, "app", "yandexMusicMod", "renderer.js"), modRendererContents);

  const appPath = path.join(buildModdedDir, "app");
  const htmlFiles = (fs.readdirSync(appPath, { recursive: true }) as string[]).filter((file) => file.endsWith(".html"));

  for (const htmlFile of htmlFiles) {
    const fullHtmlPath = path.join(appPath, htmlFile);
    console.log("patching html file", fullHtmlPath);
    const htmlFileContents = fs.readFileSync(fullHtmlPath, "utf8");
    fs.writeFileSync(
      fullHtmlPath,
      htmlFileContents.replace(
        "<head>",
        `<head><script src="/yandexMusicMod/renderer.js"></script>
        <link rel="stylesheet" href="/yandexMusicMod/renderer.css">`,
      ),
    );
  }

  fs.writeFileSync(staticFiles.mainJs, mainJsContents);
  fs.writeFileSync(staticFiles.preloadJs, preloadJsContents);

  logProgress(`✔️   Done`);

  logProgress(`🛠️  Prettify all files in ${buildModdedDir}`);

  await prettifyDirectory(buildModdedDir);

  logProgress(`✔️   Done`);

  logProgress(`🛠️  Build modded app`);

  await $`bun install`.cwd(buildModdedDir);

  // await $`bunx electron .`.cwd(buildModdedDir);

  await $`bunx electron-builder`.cwd(buildModdedDir);

  logProgress(`✔️   Done`);

  return progressArray;
}
