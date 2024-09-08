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
            config.Mods.Add(new("usePlusUnlocker", "Позволяет пользоваться программой без подписки Яндекс Плюс", true));
            config.Mods.Add(new("disableTracking",
                "Отключает аналитику и лишнюю слежку. Не влияет на производительность",
                true));
            config.Mods.Add(new("useDownloader",
                "Позволяет скачивать любой трек в mp3, нажав на иконку \u2193 рядом с названием трека", true));
            config.Mods.Add(new("useJetBrainsFont", "Меняет все шрифты в приложении на моноширинные", false));
            config.Mods.Add(new("useDevTools", "Включает верхнюю панель с возможностью запустить DevTools", false));


            return config;
        }

        public bool HasMod(string modTag)
            => Mods == null ? false : Mods.Exists(x => x.Tag == modTag & x.Enabled);
    }
}