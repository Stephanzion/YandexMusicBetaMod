using System.Text.RegularExpressions;

namespace YandexMusicPatcherGui.InternalMods
{
    public static class WhiteTheme
    {
        public static event EventHandler<string> Onlog;

        /// <summary>
        /// Заменяет темную тему на светлую. Изначально планировалось что тема будет меняться
        /// автоматически в зависимости от выбранной темы в системе, но по какой то причине это не работает.
        /// Патч проходит в 2 этапа, сначала патчер регексом меняет скрипт, отвечающий за определение
        /// актуальной цветовой схемы, выбранной в системе так, чтобы она всегда была светлая. Затем меняет
        /// файлы стилей приложения так, чтобы поменять стили отвечающие за светлую и темную тему местами.
        /// Алгоритм работы громоздкий, но работает только так. Возможно удастся найти лучшее решение в будущем.
        /// </summary>
        public static void Enable(string appPath)
        {
            var cssFolderPath = Path.GetFullPath(Path.Combine(appPath, "app/_next/static/css"));
            var jsChunksFolderPath = Path.GetFullPath(Path.Combine(appPath, "app/_next/static/chunks"));

            if (!Directory.Exists(cssFolderPath))
            {
                Onlog?.Invoke("WhiteTheme", $"Folder not found: {cssFolderPath}");
                return;
            }

            if (!Directory.Exists(jsChunksFolderPath))
            {
                Onlog?.Invoke("WhiteTheme", $"Folder not found: {jsChunksFolderPath}");
                return;
            }

            foreach (var file in Directory.GetFiles(jsChunksFolderPath))
            {
                var data = File.ReadAllText(file);

                var match = Regex.Match(data, "switch\\([a-zA-Z\\d]+\\){case [a-zA-Z\\d]+\\.[a-zA-Z\\d]+.Dark",
                    RegexOptions.Multiline);

                if (match.Success)
                    Onlog?.Invoke("WhiteTheme", $"Changed css file: {Path.GetFileName(file)}");
                else
                    continue;

                data = data.Replace(match.Value, $"return \"light\";{match.Value}");

                File.WriteAllText(file, data);
            }

            foreach (var file in Directory.GetFiles(cssFolderPath))
            {
                var data = File.ReadAllText(file);

                if (data.Contains("@media(prefers-color-scheme:dark)"))
                    Onlog?.Invoke("WhiteTheme", $"Changed css file: {Path.GetFileName(file)}");
                else
                    continue;

                data = data.Replace("@media(prefers-color-scheme:dark)", "%dark-rule%");
                data = data.Replace("@media(prefers-color-scheme:light)", "%light-rule%");
                data = data.Replace("%dark-rule%", "@media(prefers-color-scheme:light)");
                data = data.Replace("%light-rule%", "@media(prefers-color-scheme:dark)");

                data = data.Replace(".ym-dark-theme", "%dark-rule%");
                data = data.Replace(".ym-light-theme", "%light-rule%");
                data = data.Replace("%dark-rule%", ".ym-light-theme");
                data = data.Replace("%light-rule%", ".ym-dark-theme");

                File.WriteAllText(file, data);
            }
        }
    }
}