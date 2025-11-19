using System.IO;
using System.Windows;

namespace ProtectedRTC
{
    public partial class SettingsWindow : Window
    {
        private MainWindow? mainWindow;

        public SettingsWindow(MainWindow main)
        {
            InitializeComponent();
            mainWindow = main;
            LoadSettings();
        }

        private void LoadSettings()
        {
            if (File.Exists("web-client-url.txt"))
            {
                WebClientUrlTextBox.Text = File.ReadAllText("web-client-url.txt").Trim();
            }
            else
            {
                WebClientUrlTextBox.Text = mainWindow?.GetWebClientUrl() ?? "http://localhost:5000";
            }

            if (mainWindow != null)
            {
                bool isProtected = mainWindow.IsProtectionEnabled();
                ProtectionStatusTextBlock.Text = isProtected
                    ? "✓ Protection Status: ACTIVE - Screen capture is blocked"
                    : "⚠ Protection Status: INACTIVE - Screen capture is not blocked";
                ProtectionStatusTextBlock.Foreground = isProtected
                    ? System.Windows.Media.Brushes.Green
                    : System.Windows.Media.Brushes.Orange;
            }
        }

        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string url = WebClientUrlTextBox.Text.Trim();
                
                if (string.IsNullOrWhiteSpace(url))
                {
                    MessageBox.Show(
                        "Please enter a valid URL.",
                        "Invalid URL",
                        MessageBoxButton.OK,
                        MessageBoxImage.Warning
                    );
                    return;
                }

                if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? validUri))
                {
                    MessageBox.Show(
                        "Please enter a valid URL (e.g., http://localhost:5000).",
                        "Invalid URL",
                        MessageBoxButton.OK,
                        MessageBoxImage.Warning
                    );
                    return;
                }

                File.WriteAllText("web-client-url.txt", url);
                
                mainWindow?.ReloadWebClient();
                
                MessageBox.Show(
                    "Settings saved successfully!\nWeb client will reload.",
                    "Success",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information
                );
                
                Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Error saving settings:\n{ex.Message}",
                    "Error",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
            }
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
