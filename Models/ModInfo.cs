using System;
using System.Collections.Generic;

namespace YandexMusicPatcherGui.Models
{
    public class ModInfo
    {
        public ModInfo(string tag, bool enabled, string description = "")
        {
            Tag = tag;
            Enabled = enabled;
            Description = description;
        }

        public string Tag { get; set; }
        public bool Enabled { get; set; }
        public string Description { get; set; }
    }
}