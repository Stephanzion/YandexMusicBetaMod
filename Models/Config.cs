namespace YandexMusicPatcherGui.Models
{
    public class Config
    {
        public List<ModInfo>? Mods { get; set; }

        public static Config Default()
        {
            var config = new Config()
            {
                Mods = new()
            };

            config.Mods.Add(new("usePlusUnlocker", true, "Позволяет пользоваться программой без подписки Яндекс Плюс"));
            config.Mods.Add(new("discordRPC", true, "Название, автор и обложка трека будет видна в Discord"));
            config.Mods.Add(new("disableTracking", true, "Отключает аналитику и лишнюю слежку"));
            config.Mods.Add(new("useDownloader", true, "Позволяет скачивать любой трек в mp3"));
            config.Mods.Add(new("useJetBrainsFont", false, "Меняет все шрифты на моноширинные"));
            config.Mods.Add(new("useDevTools", false, "Включает консоль разработчика"));
            config.Mods.Add(new("removeSplash", false, "Удаляет видео-заставку при запуске"));
            config.Mods.Add(new("skipDownload", false, "Пропускает загрузку новой версии"));

            return config;
        }

        public bool HasMod(string modTag)
            => Mods == null ? false : Mods.Exists(x => x.Tag == modTag & x.Enabled);
    }
}