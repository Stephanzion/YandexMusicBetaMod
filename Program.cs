namespace YandexMusicPatcherGui
{
    internal static class Program
    {
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            ApplicationConfiguration.Initialize();
            Application.Run(new Main());
        }

        public static Models.Config Config = null;
        public const string ModPath = "YandexMusic";
        public const string Version = "2.0.5";
    }
}