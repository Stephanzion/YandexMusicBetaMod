using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;
using YandexMusicPatcherGui.Models;

namespace YandexMusicPatcherGui
{
    public static class Patcher
    {
        public static event EventHandler<string> Onlog;

        /// <summary>
        /// Проверяет, установлен ли мод
        /// </summary>
        public static bool IsModInstalled()
        {
            if (!Directory.Exists(Program.ModPath))
                return false;

            var filesToCheck = new string[]
                {
                    "Яндекс Музыка.exe",
                    "resources/app.asar"
                }
                .Select(x => Path.GetFullPath(Path.Combine(Program.ModPath, x)));

            return filesToCheck.ToList().TrueForAll(x => File.Exists(x));
        }

        /// <summary>
        /// Устанавливает моды. Копирует js моды в папку ресурсов приложeния а также патчит некоторые существующие js файлы
        /// </summary>
        public static async Task InstallMods(string appPath)
        {
            Onlog?.Invoke("Patcher", $"Копирую моды...");

            var newModsPath = Path.GetFullPath(Path.Combine(appPath, "app/_next/static/yandex_mod"));

            Utils.CopyFilesRecursively(Path.GetFullPath("mods"), newModsPath);

            Onlog?.Invoke("Patcher", $"Устанавливаю моды...");

            // Вставить конфиг патчера в скрипт инициализации патчера в приложении
            ReplaceFileContents(Path.Combine(newModsPath, "index.js"), "//%PATCHER_CONFIG_OVERRIDE%",
                "modConfig = " +
                JsonConvert.SerializeObject(Program.Config.Mods.ToDictionary(x => x.Tag, x => x.Enabled),
                    Formatting.Indented));

            // Добавить _appIndex.js в исходный index.js приложения
            if (Program.Config.HasMod("disableTracking"))
                ReplaceFileContents(Path.Combine(appPath, "main/index.js"),
                    "createWindow_js_1.createWindow)();",
                    "createWindow_js_1.createWindow)();\n\n" + File.ReadAllText("mods/inject/_appIndex.js"));

            // Установка интеграции с дискордом
            if (Program.Config.HasMod("discordRPC"))
            {
                ReplaceFileContents(Path.Combine(appPath, "main/index.js"),
                  "createWindow_js_1.createWindow)();",
                  "createWindow_js_1.createWindow)();\n\n" + File.ReadAllText("mods/inject/discordRPC.js"));

                Onlog?.Invoke("Patcher", "Устанавливаю зависимости для интеграции с discord");
              
                var processStartInfo = new ProcessStartInfo("7zip\\7z.exe");
                processStartInfo.Arguments = $"x \"{Path.GetFullPath("mods/DiscordRPC/Lib/node_modules.zip")}\" -o{Path.Combine(appPath, "node_modules")} -y";
                processStartInfo.RedirectStandardInput = true;
                processStartInfo.RedirectStandardOutput = true;
                processStartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                processStartInfo.UseShellExecute = false;
                processStartInfo.CreateNoWindow = true;
                var process = new Process() { StartInfo = processStartInfo };
                process.Start();
                await process.WaitForExitAsync();

            }

            // Добавить _appPreload.js в исходный preload.js приложения
            File.WriteAllText(Path.Combine(appPath, "main/lib/preload.js"),
                File.ReadAllText(Path.Combine(appPath, "main/lib/preload.js")) + File.ReadAllText("mods/inject/_appPreload.js"));

            // Ручной инжект инициализатора модов в html страницы, тк электроновский preload скипт не всегда работает
            foreach (var file in Directory.GetFiles(Path.Combine(appPath, "app"), "*.html",
                         SearchOption.AllDirectories))
            {
                File.WriteAllText(file, File.ReadAllText(file)
                    .Replace("<!DOCTYPE html><html><head>",
                        $"<!DOCTYPE html><html><head><script>{File.ReadAllText("mods/inject/_appIndexHtml.js")}</script>"));
            }

            // включить верхнее меню
            File.WriteAllText(Path.Combine(appPath, "main/lib/systemMenu.js"),
                File.ReadAllText(Path.Combine(appPath, "main/lib/systemMenu.js"))
                    .Replace("if (node_os_1.default.platform() === platform_js_1.Platform.MACOS)",
                        $"if ({Program.Config.HasMod("useDevTools").ToString().ToLower()})")
                    .Replace("if (config_js_1.config.enableDevTools)",
                        $"if ({Program.Config.HasMod("useDevTools").ToString().ToLower()})")
            );

            // включить консоль разработчика, отключить CORS, отключить автообновления
            File.WriteAllText(Path.Combine(appPath, "main/config.js"),
                File.ReadAllText(Path.Combine(appPath, "main/config.js"))
                    .Replace("enableDevTools: false",
                        $"enableDevTools: {Program.Config.HasMod("useDevTools").ToString().ToLower()}")
                    .Replace("enableWebSecurity: true", "enableWebSecurity: false")
                    .Replace("enableAutoUpdate: true", "enableAutoUpdate: false")
                    .Replace("bypassCSP: false", "bypassCSP: true")
            );

            // включить системную рамку окна
            if (Program.Config.HasMod("useDevTools"))
                File.WriteAllText(Path.Combine(appPath, "main/lib/createWindow.js"),
                    File.ReadAllText(Path.Combine(appPath, "main/lib/createWindow.js"))
                        .Replace("titleBarStyle: 'hidden',", "//titleBarStyle: 'hidden',"));

            // удалить видео-заставку
            Directory.Delete(Path.Combine(appPath, "app/media/splash_screen"), true);

            Onlog?.Invoke("Patcher", $"Моды установлены");
        }

        private static void ReplaceFileContents(string path, string replace, string replaceTo)
        {
            File.WriteAllText(path, File.ReadAllText(path).Replace(replace, replaceTo));
        }

        /// <summary>
        /// Скачивает последний билд музыки через ванильный механизм обновления, вытаскивает портативку из экзешника.
        /// </summary>
        public static async Task DownloadLastestMusic()
        {
            Directory.CreateDirectory("temp");

            var musicS3 = "https://music-desktop-application.s3.yandex.net";

            Onlog?.Invoke("Patcher", $"Получаю последний билд Музыки...");

            var webClient = new WebClient();
            var yamlRaw = webClient.DownloadString($"{musicS3}/stable/latest.yml");

            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(UnderscoredNamingConvention.Instance)
                .Build();

            var lastest = deserializer.Deserialize<dynamic>(yamlRaw);
            var lastestUrl = $"{musicS3}/stable/{(string)lastest["path"]}";

            Onlog?.Invoke("Patcher", $"Ссылка получена, скачиваю Музыку...");

            webClient.DownloadFile(lastestUrl, "temp/stable.exe");

            Onlog?.Invoke("Patcher", $"Распаковка...");

            var processStartInfo = new ProcessStartInfo("7zip\\7za.exe");
            processStartInfo.Arguments = $"x \"{Path.GetFullPath("temp/stable.exe")}\" -o{Program.ModPath} -y";
            processStartInfo.RedirectStandardInput = true;
            processStartInfo.RedirectStandardOutput = true;
            processStartInfo.WindowStyle = ProcessWindowStyle.Hidden;
            processStartInfo.UseShellExecute = false;
            processStartInfo.CreateNoWindow = true;
            var process = new Process() { StartInfo = processStartInfo };
            process.Start();
            await process.WaitForExitAsync();

            Onlog?.Invoke("Patcher", $"Распаковано");

            Directory.Delete("temp", true);
        }


        public static class Asar
        {
            /// <summary>
            /// Распаковывает app.asar
            /// </summary>
            public static async Task Unpack(string asarPath, string destPath)
            {
                Onlog?.Invoke("Patcher", $"Распаковка asar...");

                var processStartInfo = new ProcessStartInfo("7zip\\7z.exe");
                processStartInfo.Arguments = $"x \"{Path.GetFullPath(asarPath)}\" -o{destPath} -y";
                processStartInfo.RedirectStandardInput = true;
                processStartInfo.RedirectStandardOutput = true;
                processStartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                processStartInfo.UseShellExecute = false;
                processStartInfo.CreateNoWindow = true;
                var process = new Process() { StartInfo = processStartInfo };
                process.Start();
                await process.WaitForExitAsync();

                Onlog?.Invoke("Patcher", $"Распаковано");
            }

            /// <summary>
            /// Запаковывает app.asar
            /// </summary>
            public static async Task Pack(string asarFolderPath, string destPath)
            {
                Onlog?.Invoke("Patcher", $"Упаковываю обратно asar...");

                var processStartInfo = new ProcessStartInfo("7zip\\7z.exe");
                processStartInfo.Arguments =
                    $"a \"{Path.GetFullPath(destPath)}\" \"{Path.GetFullPath(asarFolderPath)}\"";
                processStartInfo.RedirectStandardInput = true;
                processStartInfo.RedirectStandardOutput = true;
                processStartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                processStartInfo.UseShellExecute = false;
                processStartInfo.CreateNoWindow = true;
                var process = new Process() { StartInfo = processStartInfo };
                process.Start();
                await process.WaitForExitAsync();

                Onlog?.Invoke("Patcher", $"Упаковано");
            }
        }
    }
}