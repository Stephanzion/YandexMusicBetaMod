namespace YandexMusicPatcherGui
{
    partial class Main
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Main));
            label1 = new Label();
            groupBoxMods = new GroupBox();
            tableLayoutPanel1 = new TableLayoutPanel();
            airCheckBox6 = new ReaLTaiizor.Controls.AirCheckBox();
            airCheckBox4 = new ReaLTaiizor.Controls.AirCheckBox();
            airCheckBox3 = new ReaLTaiizor.Controls.AirCheckBox();
            airCheckBox2 = new ReaLTaiizor.Controls.AirCheckBox();
            airCheckBox1 = new ReaLTaiizor.Controls.AirCheckBox();
            airCheckBox5 = new ReaLTaiizor.Controls.AirCheckBox();
            airCheckBox7 = new ReaLTaiizor.Controls.AirCheckBox();
            airCheckBox8 = new ReaLTaiizor.Controls.AirCheckBox();
            label2 = new Label();
            button1 = new ReaLTaiizor.Controls.Button();
            button2 = new ReaLTaiizor.Controls.Button();
            buttonReport = new ReaLTaiizor.Controls.Button();
            richTextBox1 = new RichTextBox();
            airCheckBox10 = new ReaLTaiizor.Controls.AirCheckBox();
            airCheckBox9 = new ReaLTaiizor.Controls.AirCheckBox();
            tableLayoutPanel3 = new TableLayoutPanel();
            groupBoxMods.SuspendLayout();
            tableLayoutPanel1.SuspendLayout();
            tableLayoutPanel3.SuspendLayout();
            SuspendLayout();
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.Font = new Font("Segoe UI Semibold", 9.75F, FontStyle.Bold, GraphicsUnit.Point);
            label1.Location = new Point(15, 1);
            label1.Name = "label1";
            label1.Size = new Size(177, 28);
            label1.TabIndex = 2;
            label1.Text = "Доступные моды";
            // 
            // groupBoxMods
            // 
            groupBoxMods.Controls.Add(tableLayoutPanel1);
            groupBoxMods.Controls.Add(label2);
            groupBoxMods.Controls.Add(label1);
            groupBoxMods.Location = new Point(19, 10);
            groupBoxMods.Margin = new Padding(0);
            groupBoxMods.Name = "groupBoxMods";
            groupBoxMods.Padding = new Padding(2);
            groupBoxMods.Size = new Size(372, 400);
            groupBoxMods.TabIndex = 3;
            groupBoxMods.TabStop = false;
            // 
            // tableLayoutPanel1
            // 
            tableLayoutPanel1.ColumnCount = 1;
            tableLayoutPanel1.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            tableLayoutPanel1.Controls.Add(airCheckBox6, 0, 1);
            tableLayoutPanel1.Controls.Add(airCheckBox4, 0, 5);
            tableLayoutPanel1.Controls.Add(airCheckBox3, 0, 3);
            tableLayoutPanel1.Controls.Add(airCheckBox2, 0, 2);
            tableLayoutPanel1.Controls.Add(airCheckBox1, 0, 0);
            tableLayoutPanel1.Controls.Add(airCheckBox5, 0, 4);
            tableLayoutPanel1.Controls.Add(airCheckBox7, 0, 6);
            tableLayoutPanel1.Controls.Add(airCheckBox8, 0, 7);
            tableLayoutPanel1.Location = new Point(12, 32);
            tableLayoutPanel1.Name = "tableLayoutPanel1";
            tableLayoutPanel1.RowCount = 8;
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 12.5F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 12.5F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 12.5F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 12.5F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 12.5F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 12.5F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 12.5F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 12.5F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Absolute, 20F));
            tableLayoutPanel1.Size = new Size(342, 303);
            tableLayoutPanel1.TabIndex = 13;
            //
            // airCheckBox6
            // 
            airCheckBox6.AccessibleDescription = "Название, автор и обложка трека, которого вы сейчас слушаете, будет видна в вашем профиле Discord";
            airCheckBox6.Checked = false;
            airCheckBox6.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox6.Dock = DockStyle.Fill;
            airCheckBox6.Font = new Font("Segoe UI", 8F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox6.Image = null;
            airCheckBox6.Location = new Point(3, 40);
            airCheckBox6.Name = "airCheckBox6";
            airCheckBox6.NoRounding = false;
            airCheckBox6.Size = new Size(336, 17);
            airCheckBox6.TabIndex = 18;
            airCheckBox6.Tag = "discordRPC";
            airCheckBox6.Text = "Интеграция с Discord";
            airCheckBox6.Transparent = false;
            // 
            // airCheckBox4
            // 
            airCheckBox4.AccessibleDescription = "Включает верхнюю панель с возможностью запустить DevTools";
            airCheckBox4.Checked = false;
            airCheckBox4.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox4.Dock = DockStyle.Fill;
            airCheckBox4.Font = new Font("Segoe UI", 8F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox4.Image = null;
            airCheckBox4.Location = new Point(3, 188);
            airCheckBox4.Name = "airCheckBox4";
            airCheckBox4.NoRounding = false;
            airCheckBox4.Size = new Size(336, 17);
            airCheckBox4.TabIndex = 17;
            airCheckBox4.Tag = "useDevTools";
            airCheckBox4.Text = "Включить консоль разработчика";
            airCheckBox4.Transparent = false;
            // 
            // airCheckBox3
            // 
            airCheckBox3.AccessibleDescription = "Позволяет скачивать любой трек в mp3, нажав на иконку ↓ рядом с названием трека";
            airCheckBox3.Checked = false;
            airCheckBox3.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox3.Dock = DockStyle.Fill;
            airCheckBox3.Font = new Font("Segoe UI", 8F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox3.Image = null;
            airCheckBox3.Location = new Point(3, 114);
            airCheckBox3.Name = "airCheckBox3";
            airCheckBox3.NoRounding = false;
            airCheckBox3.Size = new Size(336, 17);
            airCheckBox3.TabIndex = 14;
            airCheckBox3.Tag = "useDownloader";
            airCheckBox3.Text = "Иконка \"скачать\"";
            airCheckBox3.Transparent = false;
            // 
            // airCheckBox2
            // 
            airCheckBox2.AccessibleDescription = "Отключает аналитику и лишнюю слежку. Не влияет на производительность";
            airCheckBox2.Checked = false;
            airCheckBox2.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox2.Dock = DockStyle.Fill;
            airCheckBox2.Font = new Font("Segoe UI", 8F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox2.Image = null;
            airCheckBox2.Location = new Point(3, 77);
            airCheckBox2.Name = "airCheckBox2";
            airCheckBox2.NoRounding = false;
            airCheckBox2.Size = new Size(336, 17);
            airCheckBox2.TabIndex = 13;
            airCheckBox2.Tag = "disableTracking";
            airCheckBox2.Text = "Отключить аналитику";
            airCheckBox2.Transparent = false;
            // 
            // airCheckBox1
            // 
            airCheckBox1.AccessibleDescription = "Позволяет пользоваться программой без подписки Яндекс Плюс";
            airCheckBox1.BackColor = Color.WhiteSmoke;
            airCheckBox1.Checked = false;
            airCheckBox1.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox1.Dock = DockStyle.Fill;
            airCheckBox1.Font = new Font("Segoe UI", 8F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox1.Image = null;
            airCheckBox1.Location = new Point(3, 3);
            airCheckBox1.Name = "airCheckBox1";
            airCheckBox1.NoRounding = false;
            airCheckBox1.Size = new Size(336, 17);
            airCheckBox1.TabIndex = 12;
            airCheckBox1.Tag = "usePlusUnlocker";
            airCheckBox1.Text = "Без Яндекс Плюс";
            airCheckBox1.Transparent = false;
            // 
            // airCheckBox5
            // 
            airCheckBox5.AccessibleDescription = "Меняет все шрифты в приложении на моноширинные";
            airCheckBox5.Checked = false;
            airCheckBox5.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox5.Dock = DockStyle.Fill;
            airCheckBox5.Font = new Font("Segoe UI", 8F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox5.Image = null;
            airCheckBox5.Location = new Point(3, 151);
            airCheckBox5.Name = "airCheckBox5";
            airCheckBox5.NoRounding = false;
            airCheckBox5.Size = new Size(336, 17);
            airCheckBox5.TabIndex = 16;
            airCheckBox5.Tag = "useJetBrainsFont";
            airCheckBox5.Text = "Заменить шрифт на JetBrains Mono";
            airCheckBox5.Transparent = false;
            // 
            // airCheckBox7
            // 
            airCheckBox7.AccessibleDescription = "Удалить видео-заставку при запуске приложения";
            airCheckBox7.Checked = false;
            airCheckBox7.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox7.Dock = DockStyle.Fill;
            airCheckBox7.Font = new Font("Segoe UI", 8F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox7.Image = null;
            airCheckBox7.Location = new Point(3, 225);
            airCheckBox7.Name = "airCheckBox7";
            airCheckBox7.NoRounding = false;
            airCheckBox7.Size = new Size(336, 17);
            airCheckBox7.TabIndex = 19;
            airCheckBox7.Tag = "removeSplash";
            airCheckBox7.Text = "Удалить видео-заставку";
            airCheckBox7.Transparent = false;
            // 
            // airCheckBox8
            // 
            airCheckBox8.AccessibleDescription = "Пропустить загрузку новой версии и перепатчить текущую";
            airCheckBox8.Checked = false;
            airCheckBox8.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox8.Dock = DockStyle.Fill;
            airCheckBox8.Font = new Font("Segoe UI", 8F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox8.Image = null;
            airCheckBox8.Location = new Point(3, 262);
            airCheckBox8.Name = "airCheckBox8";
            airCheckBox8.NoRounding = false;
            airCheckBox8.Size = new Size(336, 17);
            airCheckBox8.TabIndex = 20;
            airCheckBox8.Tag = "skipDownload";
            airCheckBox8.Text = "Вместо загрузки новой версии перепатчить";
            airCheckBox8.Transparent = false;
            // 
            // label2
            // 
            label2.BackColor = Color.WhiteSmoke;
            label2.Dock = DockStyle.Bottom;
            label2.Font = new Font("Segoe UI", 9F, FontStyle.Regular, GraphicsUnit.Point);
            label2.ForeColor = SystemColors.ControlDarkDark;
            label2.Location = new Point(2, 338);
            label2.Margin = new Padding(0);
            label2.Name = "label2";
            label2.Padding = new Padding(5);
            label2.Size = new Size(368, 60);
            label2.TabIndex = 5;
            label2.Text = "Наведите мышкой на мод чтобы узнать подробности";
            // 
            // button1
            // 
            button1.BackColor = Color.Transparent;
            button1.BorderColor = Color.FromArgb(63, 104, 249);
            button1.EnteredBorderColor = Color.FromArgb(37, 84, 248);
            button1.EnteredColor = Color.FromArgb(37, 84, 248);
            button1.Font = new Font("Segoe UI", 9.75F, FontStyle.Regular, GraphicsUnit.Point);
            button1.Image = null;
            button1.ImageAlign = ContentAlignment.MiddleLeft;
            button1.InactiveColor = Color.FromArgb(63, 104, 249);
            button1.Location = new Point(21, 413);
            button1.Name = "button1";
            button1.PressedBorderColor = Color.FromArgb(13, 64, 247);
            button1.PressedColor = Color.FromArgb(13, 64, 247);
            button1.Size = new Size(169, 51);
            button1.TabIndex = 11;
            button1.Text = "Установить мод";
            button1.TextAlignment = StringAlignment.Center;
            button1.Click += button1_Click;
            // 
            // button2
            // 
            button2.BackColor = Color.Transparent;
            button2.BorderColor = Color.FromArgb(215, 215, 218);
            button2.Enabled = false;
            button2.EnteredBorderColor = Color.FromArgb(37, 84, 248);
            button2.EnteredColor = Color.FromArgb(37, 84, 248);
            button2.Font = new Font("Segoe UI", 9.75F, FontStyle.Regular, GraphicsUnit.Point);
            button2.Image = null;
            button2.ImageAlign = ContentAlignment.MiddleLeft;
            button2.InactiveColor = Color.FromArgb(215, 215, 218);
            button2.Location = new Point(196, 413);
            button2.Name = "button2";
            button2.PressedBorderColor = Color.FromArgb(13, 64, 247);
            button2.PressedColor = Color.FromArgb(13, 64, 247);
            button2.Size = new Size(195, 51);
            button2.TabIndex = 11;
            button2.Text = "Запустить Яндекс Музыку";
            button2.TextAlignment = StringAlignment.Center;
            button2.Click += button2_Click;
            // 
            // buttonReport
            // 
            buttonReport.BackColor = Color.Transparent;
            buttonReport.BackgroundImageLayout = ImageLayout.Zoom;
            buttonReport.BorderColor = Color.FromArgb(30, 30, 30);
            buttonReport.CausesValidation = false;
            buttonReport.EnteredBorderColor = Color.FromArgb(45, 45, 45);
            buttonReport.EnteredColor = Color.FromArgb(45, 45, 45);
            buttonReport.Font = new Font("Segoe UI", 9.75F, FontStyle.Regular, GraphicsUnit.Point);
            buttonReport.Image = (Image)resources.GetObject("buttonReport.Image");
            buttonReport.ImageAlign = ContentAlignment.MiddleLeft;
            buttonReport.ImeMode = ImeMode.Alpha;
            buttonReport.InactiveColor = Color.FromArgb(30, 30, 30);
            buttonReport.Location = new Point(21, 581);
            buttonReport.Name = "buttonReport";
            buttonReport.PressedBorderColor = Color.FromArgb(15, 15, 15);
            buttonReport.PressedColor = Color.FromArgb(15, 15, 15);
            buttonReport.Size = new Size(370, 48);
            buttonReport.TabIndex = 19;
            buttonReport.Text = "Сообщить об ошибке  ";
            buttonReport.TextAlignment = StringAlignment.Center;
            buttonReport.Click += button3_Click;
            // 
            // richTextBox1
            // 
            richTextBox1.BackColor = SystemColors.Control;
            richTextBox1.BorderStyle = BorderStyle.None;
            richTextBox1.Font = new Font("Segoe UI", 9F, FontStyle.Regular, GraphicsUnit.Point);
            richTextBox1.ForeColor = SystemColors.WindowFrame;
            richTextBox1.Location = new Point(21, 475);
            richTextBox1.Name = "richTextBox1";
            richTextBox1.ReadOnly = true;
            richTextBox1.Size = new Size(370, 91);
            richTextBox1.TabIndex = 20;
            richTextBox1.Text = "";
            // 
            // airCheckBox10
            // 
            airCheckBox10.AccessibleDescription = "Включает верхнюю панель с возможностью запустить DevTools";
            airCheckBox10.Checked = false;
            airCheckBox10.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox10.Dock = DockStyle.Fill;
            airCheckBox10.Font = new Font("Segoe UI", 9.75F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox10.Image = null;
            airCheckBox10.Location = new Point(3, 26);
            airCheckBox10.Name = "airCheckBox10";
            airCheckBox10.NoRounding = false;
            airCheckBox10.Size = new Size(194, 17);
            airCheckBox10.TabIndex = 17;
            airCheckBox10.Tag = "useDevTools";
            airCheckBox10.Text = "Включить консоль разработчика";
            airCheckBox10.Transparent = false;
            // 
            // airCheckBox9
            // 
            airCheckBox9.AccessibleDescription = "Название, автор и обложка трека, которого вы сейчас слушаете, будет видна в вашем профиле Discord";
            airCheckBox9.Checked = false;
            airCheckBox9.Customization = "7e3t//Ly8v/r6+v/5ubm/+vr6//f39//p6en/zw8PP8=";
            airCheckBox9.Dock = DockStyle.Fill;
            airCheckBox9.Font = new Font("Segoe UI", 9.75F, FontStyle.Regular, GraphicsUnit.Point);
            airCheckBox9.Image = null;
            airCheckBox9.Location = new Point(3, 23);
            airCheckBox9.Name = "airCheckBox9";
            airCheckBox9.NoRounding = false;
            airCheckBox9.Size = new Size(194, 17);
            airCheckBox9.TabIndex = 18;
            airCheckBox9.Tag = "discordRPC";
            airCheckBox9.Text = "Интеграция с Discord";
            airCheckBox9.Transparent = false;
            // 
            // tableLayoutPanel3
            // 
            tableLayoutPanel3.ColumnCount = 1;
            tableLayoutPanel3.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            tableLayoutPanel3.Controls.Add(airCheckBox9, 0, 1);
            tableLayoutPanel3.Location = new Point(0, 0);
            tableLayoutPanel3.Name = "tableLayoutPanel3";
            tableLayoutPanel3.RowCount = 2;
            tableLayoutPanel3.RowStyles.Add(new RowStyle(SizeType.Absolute, 20F));
            tableLayoutPanel3.RowStyles.Add(new RowStyle(SizeType.Absolute, 20F));
            tableLayoutPanel3.Size = new Size(200, 100);
            tableLayoutPanel3.TabIndex = 0;
            // 
            // Main
            // 
            AutoScaleDimensions = new SizeF(11F, 28F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = Color.White;
            ClientSize = new Size(420, 647);
            Controls.Add(richTextBox1);
            Controls.Add(buttonReport);
            Controls.Add(button2);
            Controls.Add(button1);
            Controls.Add(groupBoxMods);
            Font = new Font("Segoe UI", 9.75F, FontStyle.Regular, GraphicsUnit.Point);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            Icon = (Icon)resources.GetObject("$this.Icon");
            Name = "Main";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Yandex Music Patcher";
            groupBoxMods.ResumeLayout(false);
            groupBoxMods.PerformLayout();
            tableLayoutPanel1.ResumeLayout(false);
            tableLayoutPanel3.ResumeLayout(false);
            ResumeLayout(false);
        }

        #endregion
        private Label label1;
        private GroupBox groupBoxMods;
        private Label label2;
        private ReaLTaiizor.Controls.Button button1;
        private ReaLTaiizor.Controls.Button button2;
        private ReaLTaiizor.Controls.Button buttonReport;
        private RichTextBox richTextBox1;
        private TableLayoutPanel tableLayoutPanel1;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox6;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox4;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox3;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox2;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox1;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox5;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox7;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox8;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox10;
        private ReaLTaiizor.Controls.AirCheckBox airCheckBox9;
        private TableLayoutPanel tableLayoutPanel3;
    }
}