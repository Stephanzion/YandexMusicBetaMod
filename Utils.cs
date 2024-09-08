using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace YandexMusicPatcherGui
{
    public static class Utils
    {
        /// <summary>
        /// Копирует файлы и папки. Взято из https://stackoverflow.com/a/3822913/8393275
        /// </summary>
        public static void CopyFilesRecursively(string sourcePath, string targetPath)
        {
            //Now Create all of the directories
            foreach (string dirPath in Directory.GetDirectories(sourcePath, "*", SearchOption.AllDirectories))
            {
                Directory.CreateDirectory(dirPath.Replace(sourcePath, targetPath));
            }

            //Copy all the files & Replaces any files with the same name
            foreach (string newPath in Directory.GetFiles(sourcePath, "*.*", SearchOption.AllDirectories))
            {
                File.Copy(newPath, newPath.Replace(sourcePath, targetPath), true);
            }
        }

        /// <summary>
        /// Создает ярлык на рабочем столе, используется дремучая библиотека, но вроде работает.
        /// </summary>
        public static void CreateDesktopShortcut(string linkName, string path)
        {
            string deskDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            var lnkPath = Path.Combine(deskDir, linkName + ".lnk");

            var shell = new IWshRuntimeLibrary.WshShell();
            var shortcut =
                shell.CreateShortcut(lnkPath);
            shortcut.TargetPath = Path.GetFullPath(path);
            shortcut.Save();
        }
    }
}