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

            config.Mods.Add(new("usePlusUnlocker", true));
            config.Mods.Add(new("discordRPC", true));
            config.Mods.Add(new("disableTracking", true));
            config.Mods.Add(new("useDownloader", true));
            config.Mods.Add(new("useJetBrainsFont", false));
            config.Mods.Add(new("useDevTools", false));

            return config;
        }

        public bool HasMod(string modTag)
            => Mods == null ? false : Mods.Exists(x => x.Tag == modTag & x.Enabled);
    }
}