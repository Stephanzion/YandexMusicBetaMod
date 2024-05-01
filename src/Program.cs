using Newtonsoft.Json;
using System.Diagnostics;
using System.Net;
using System.Net.Mime;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace YandexMusicPatcher
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            var updateUrl = "https://music-desktop-application.s3.yandex.net/stable/";

            var webClient = new WebClient();

            var yamlRaw = webClient.DownloadString($"{updateUrl}/latest.yml");

            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(UnderscoredNamingConvention.Instance)
                .Build();

            var update = deserializer.Deserialize<dynamic>(yamlRaw);

            if (Directory.Exists("temp"))
                Directory.Delete("temp", true);

            if (Directory.Exists("Яндекс Музыка"))
                Directory.Delete("Яндекс Музыка", true);

            Directory.CreateDirectory("temp");

            webClient.DownloadFile($"{updateUrl}/{(string)update["path"]}", "temp/stable.exe");

            var processStartInfo = new ProcessStartInfo("7zip\\7za.exe");
            processStartInfo.Arguments = $"x \"{Path.GetFullPath("temp/stable.exe")}\" -otemp/src";
            var process = new Process() { StartInfo = processStartInfo };
            process.Start();
            process.WaitForExit();

            File.Delete("temp/stable.exe");

            processStartInfo = new ProcessStartInfo("7zip\\7z.exe");
            processStartInfo.Arguments =
                $"x \"{Path.GetFullPath("temp/src/resources/app.asar")}\" -otemp/src/resources/app";
            process = new Process() { StartInfo = processStartInfo };
            process.Start();
            process.WaitForExit();

            File.Delete("temp/src/resources/app.asar");

            foreach (var file in Directory.GetFiles("temp/src/resources/app/main", "*", SearchOption.AllDirectories))
                File.WriteAllText(file, Replace(File.ReadAllText(file)));

            foreach (var file in Directory.GetFiles("temp/src/resources/app/build", "*", SearchOption.AllDirectories))
                File.WriteAllText(file, Replace(File.ReadAllText(file)));

            File.Delete("temp/src/resources/app/build/next-desktop/video/splash_screen.mp4");
            File.Delete("temp/src/resources/app/build/next-desktop/video/splash_screen.webm");

            processStartInfo.Arguments =
                $"a \"temp/src/resources/app.asar\" \"{Path.GetFullPath("temp/src/resources/app/*")}\"";
            process = new Process() { StartInfo = processStartInfo };
            process.Start();
            process.WaitForExit();

            Directory.Move("temp/src", "Яндекс Музыка");
            Directory.Delete("temp", true);

            var shell = new IWshRuntimeLibrary.WshShell();
            var shortcut =
                shell.CreateShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                    "Яндекс Музыка.lnk"));
            shortcut.TargetPath = Path.GetFullPath("Яндекс Музыка/Яндекс Музыка.exe");
            shortcut.Save();
        }


        public static string Replace(string source)
        {
            //index.js
            source = source.Replace("(0, safeRedirects_js_1.safeRedirects)(window);",
                "//(0, safeRedirects_js_1.safeRedirects)(window);");
            source = source.Replace("(0, logger_js_1.logWindowLifecycle)(window);",
                "//(0, logger_js_1.logWindowLifecycle)(window);");
            source = source.Replace("(0, handleMetrikaRequests_js_1.handleMetrikaRequests)(window);",
                "//(0, handleMetrikaRequests_js_1.handleMetrikaRequests)(window);");
            source = source.Replace("(0, handleCrash_js_1.handleCrash)();", "//(0, handleCrash_js_1.handleCrash)();");
            source = source.Replace("(0, singleInstance_js_1.checkForSingleInstance)();",
                "//(0, singleInstance_js_1.checkForSingleInstance)();");
            source = source.Replace("const window = await (0, createWindow_js_1.createWindow)();",
                "const window = await (0, createWindow_js_1.createWindow)();\nconst { session } = require(\"electron\");\nsession.defaultSession.loadExtension(" +
                JsonConvert.SerializeObject(Path.GetFullPath("extension")) + ", { allowFileAccess: true });");

            //config.js
            source = source.Replace("metrikaCounters: [95673848, 95673843],", "metrikaCounters: [],");
            source = source.Replace("enableDevTools: false", "enableDevTools: true");
            source = source.Replace("enableWebSecurity: true", "enableWebSecurity: false");
            source = source.Replace("enableAutoUpdate: true", "enableAutoUpdate: false");
            source = source.Replace("bypassCSP: false", "bypassCSP: true");

            //createWindow.js
            source = source.Replace("titleBarStyle: 'hidden',", "//titleBarStyle: 'hidden',");

            //menu.js
            source = source.Replace("if (node_os_1.default.platform() === platform_js_1.Platform.MACOS)", "if (true)");

            //global
            source = source.Replace("mc.yandex.ru", "<empty>");
            source = source.Replace("yandex.ru/clck", "<empty>/clck");

            //plus
            source = source.Replace("n.hasPlus", "true");
            source = source.Replace("e.hasPlus", "true");
            source = source.Replace("a.V5.maybe(a.V5.boolean)", "true");
            source = source.Replace("return!!e.account.hasPlus", "return true");
            source = source.Replace("f.hasPlus", "true");
            source = source.Replace("i.hasPlus", "true");


            return source;
        }

        private static void appShortcutToDesktop(string linkName, string path)
        {
            string deskDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);

            using (StreamWriter writer = new StreamWriter(deskDir + "\\" + linkName + ".url"))
            {
                writer.WriteLine("[InternetShortcut]");
                writer.WriteLine("URL=file:///" + path);
                writer.WriteLine("IconIndex=0");
                string icon = path.Replace('\\', '/');
                writer.WriteLine("IconFile=" + icon);
            }
        }
    }
}