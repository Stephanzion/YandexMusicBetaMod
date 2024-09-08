using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace YandexMusicPatcherGui.Models
{
    public class ModInfo
    {
        public ModInfo(string tag, string desciption, bool enabled)
        {
            Tag = tag;
            Desciption = desciption;
            Enabled = enabled;
        }

        public string Tag { get; set; }
        public string Desciption { get; set; }
        public bool Enabled { get; set; }
    }
}