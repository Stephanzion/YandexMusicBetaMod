using Newtonsoft.Json;
using System.Diagnostics;
using System.Resources;
using System.Windows.Forms;
using YandexMusicPatcherGui.Models;
using YandexMusicPatcherGui.Properties;

#pragma warning disable CS4014

namespace YandexMusicPatcherGui
{
    public partial class Main : Form
    {
        private static RichTextBox _LogTextBox = null;

        public Main()
        {
            InitializeComponent();
            CheckForIllegalCrossThreadCalls = false;
            Init();
            CheckForUpdates();
            Log("Запуск...");
        }

        private void Init()
        {
            MaximumSize = Size;
            MinimumSize = Size;
            MaximizeBox = false;

            if (!File.Exists("config.json"))
                File.WriteAllText("config.json",
                    JsonConvert.SerializeObject(Models.Config.Default(), Formatting.Indented));
            try
            {
                Program.Config = JsonConvert.DeserializeObject<Models.Config>(File.ReadAllText("config.json"));
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка при чтении файла конфигурации\n\n{ex.Message}", "Ошибка",
                    MessageBoxButtons.OK);
                Environment.Exit(1);
            }

            // если после обновления базовый конфиг содержит новые моды - сбросить кофиг пользователя
            var defaultMods = Config.Default().Mods;
            for (var i = 0; i < defaultMods.Count; i++)
                if (!Program.Config.Mods.Exists(x => x.Tag == defaultMods[i].Tag))
                {
                    File.WriteAllText("config.json",
                        JsonConvert.SerializeObject(Models.Config.Default(), Formatting.Indented));
                    Program.Config = JsonConvert.DeserializeObject<Models.Config>(File.ReadAllText("config.json"));
                }


            _LogTextBox = richTextBox1;

            Patcher.Onlog += ((s, e) => Log($"Patcher - {e}"));

            var _mouseInCheckbox = false;

            foreach (ReaLTaiizor.Controls.AirCheckBox checkbox in tableLayoutPanel1.Controls
                         .OfType<ReaLTaiizor.Controls.AirCheckBox>())
            {
                checkbox.Checked = Program.Config.Mods.First(x => x.Tag == checkbox.Tag.ToString()).Enabled;
                checkbox.MouseEnter += (s, e) =>
                {
                    var checkbox = (ReaLTaiizor.Controls.AirCheckBox)s;
                    label2.Text = checkbox.AccessibleDescription;
                    _mouseInCheckbox = true;
                };
                checkbox.MouseLeave += (s, e) => { _mouseInCheckbox = false; };
                checkbox.CheckedChanged += (s) =>
                {
                    var cb = (ReaLTaiizor.Controls.AirCheckBox)s;
                    var tag = cb.Tag.ToString();

                    if (tag == "usePlusUnlocker")
                    {
                        if (!cb.Checked)
                            cb.Checked = true;
                        return;
                    }

                    var changedModIndex = Program.Config.Mods.FindIndex(x => x.Tag == tag);
                    if (changedModIndex == -1)
                        return;
                    Program.Config.Mods[changedModIndex].Enabled = cb.Checked;
                    File.WriteAllText("config.json",
                        JsonConvert.SerializeObject(Program.Config, Formatting.Indented));
                };
            }

            MouseMove += (s, e) =>
            {
                if (!_mouseInCheckbox) label2.Text = "Наведите мышкой на мод чтобы узнать подробности";
            };

            UpdateButtonsState();
        }

        private void UpdateButtonsState()
        {
            if (Patcher.IsModInstalled())
            {
                button1.Text = "Обновить мод";
                button2.Enabled = true;
                button2.InactiveColor = Color.FromArgb(63, 104, 249);
                button2.BorderColor = Color.FromArgb(63, 104, 249);
            }
            else
            {
                button1.Text = "Установить мод";
                button2.Enabled = false;
                button2.InactiveColor = Color.FromArgb(215, 215, 218);
                button2.BorderColor = Color.FromArgb(215, 215, 218);
            }
        }

        public static void Log(object data)
        {
            if (data != null)
                _LogTextBox.Text += $"[ {DateTime.Now.ToString("HH:mm:ss")} ] {data.ToString()}\n";
            _LogTextBox.SelectionStart = _LogTextBox.Text.Length;
            _LogTextBox.ScrollToCaret();
        }

        private async Task CheckForUpdates()
        {
            var version = await YandexMusicPatcherGui.Update.GetLastVersion();
            if (version != null)
                if (version != "error")
                    if (version != Program.Version)
                    {
                        DialogResult willUpdate = MessageBox.Show($"Доступно обновление v{version}!\nСкачать?",
                            "Обновление", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
                        if (willUpdate == DialogResult.OK)
                        {
                            Process myProcess = new Process();
                            myProcess.StartInfo.UseShellExecute = true;
                            myProcess.StartInfo.FileName =
                                "https://github.com/Stephanzion/YandexMusicBetaMod/releases/latest";
                            myProcess.Start();
                        }
                    }
        }

        private async void button1_Click(object sender, EventArgs e)
        {
            Task.Run(async () =>
            {
                try
                {
                    button1.Enabled = false;
                    button2.Enabled = false;
                    var color = Color.FromArgb(215, 215, 218);
                    button1.InactiveColor = color;
                    button1.BorderColor = color;
                    button2.InactiveColor = color;
                    button2.BorderColor = color;

                    Process.GetProcesses().Where(x => x.ProcessName == "Яндекс Музыка").ToList().ForEach(x => x.Kill());

                    await Task.Delay(500);

                    if (Directory.Exists("temp"))
                        Directory.Delete("temp", true);

                    if (Directory.Exists(Program.ModPath))
                        Directory.Delete(Program.ModPath, true);

                    await Patcher.DownloadLastestMusic();
                    await Patcher.Asar.Unpack($"{Program.ModPath}/resources/app.asar",
                        $"{Program.ModPath}/resources/app");
                    File.Delete($"{Program.ModPath}/resources/app.asar");
                    await Patcher.InstallMods($"{Program.ModPath}/resources/app");
                    await Patcher.Asar.Pack($"{Program.ModPath}/resources/app/*",
                        $"{Program.ModPath}/resources/app.asar");

                    Utils.CreateDesktopShortcut("Яндекс Музыка",
                        Path.GetFullPath(Path.Combine(Program.ModPath, "Яндекс Музыка.exe")));

                    Log($"Готово!");
                    MessageBox.Show($"Яндекс Музыка установлена и пропатчена!\nЯрлык создан на рабочем столе.",
                        "Успех");
                }
                catch (Exception ex)
                {
                    Log($"Ошибка запуска патчера:\n\n" + ex.ToString());
                    MessageBox.Show($"Ошибка запуска патчера:\n\n" + ex.ToString(), "Ошибка", MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                }
                finally
                {
                    button1.Enabled = true;
                    button2.Enabled = true;
                    var color = Color.FromArgb(63, 104, 249);
                    button1.InactiveColor = color;
                    button1.BorderColor = color;
                    button2.InactiveColor = color;
                    button2.BorderColor = color;

                    UpdateButtonsState();
                }
            });
        }

        private void button3_Click(object sender, EventArgs e)
        {
            Process myProcess = new Process();
            myProcess.StartInfo.UseShellExecute = true;
            myProcess.StartInfo.FileName = "https://github.com/Stephanzion/YandexMusicBetaMod/issues/new";
            myProcess.Start();
        }

        private void button2_Click(object sender, EventArgs e)
        {
            try
            {
                Process.Start(Path.Combine(Program.ModPath, "Яндекс Музыка.exe"));
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка запуска Музыки:\n\n" + ex.ToString(), "Ошибка", MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
    }
}