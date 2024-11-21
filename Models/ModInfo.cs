namespace YandexMusicPatcherGui.Models
{
    public class ModInfo
    {
        public ModInfo(string tag, bool enabled)
        {
            Tag = tag;
            Enabled = enabled;
        }

        public string Tag { get; set; }
        public bool Enabled { get; set; }
    }
}