using System;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using Microsoft.Web.WebView2.Core;

namespace ProtectedRTC
{
    public partial class MainWindow : Window
    {
        private const uint WDA_EXCLUDEFROMCAPTURE = 0x00000011;
        private bool isProtectionEnabled = false;
        private string webClientUrl = "http://localhost:5000";

        [DllImport("user32.dll")]
        private static extern bool SetWindowDisplayAffinity(IntPtr hWnd, uint dwAffinity);

        [DllImport("user32.dll")]
        private static extern uint GetWindowDisplayAffinity(IntPtr hWnd, out uint dwAffinity);

        public MainWindow()
        {
            InitializeComponent();
            InitializeWebView();
        }

        private async void InitializeWebView()
        {
            try
            {
                await webView.EnsureCoreWebView2Async(null);
                
                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                
                var userDataFolder = System.IO.Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "ProtectedRTC"
                );
                
                LoadWebClient();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Failed to initialize WebView2:\n{ex.Message}\n\nPlease ensure WebView2 Runtime is installed.",
                    "Initialization Error",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
            }
        }

        private void LoadWebClient()
        {
            try
            {
                string url = System.IO.File.Exists("web-client-url.txt") 
                    ? System.IO.File.ReadAllText("web-client-url.txt").Trim() 
                    : webClientUrl;

                if (Uri.TryCreate(url, UriKind.Absolute, out Uri? validUri))
                {
                    webView.Source = validUri;
                }
                else
                {
                    webView.Source = new Uri(webClientUrl);
                }
            }
            catch
            {
                webView.Source = new Uri(webClientUrl);
            }
        }

        private async void Window_Loaded(object sender, RoutedEventArgs e)
        {
            await ApplyCaptureProtection();
        }

        private async System.Threading.Tasks.Task ApplyCaptureProtection()
        {
            try
            {
                var windowHandle = new WindowInteropHelper(this).Handle;
                
                if (windowHandle == IntPtr.Zero)
                {
                    UpdateProtectionStatus(false, "Window handle not available");
                    return;
                }

                bool success = SetWindowDisplayAffinity(windowHandle, WDA_EXCLUDEFROMCAPTURE);
                
                if (success)
                {
                    uint affinity;
                    GetWindowDisplayAffinity(windowHandle, out affinity);
                    
                    if (affinity == WDA_EXCLUDEFROMCAPTURE)
                    {
                        isProtectionEnabled = true;
                        UpdateProtectionStatus(true, "Protection: ACTIVE");
                        
                        await Dispatcher.InvokeAsync(() =>
                        {
                            MessageBox.Show(
                                "✓ Capture Protection Enabled\n\n" +
                                "This window is now excluded from screen capture.\n" +
                                "Test it by:\n" +
                                "• Taking a screenshot (PrintScreen)\n" +
                                "• Using Snipping Tool\n" +
                                "• Sharing your screen in Teams/Zoom\n\n" +
                                "The ProtectedRTC window should appear black or be excluded.",
                                "Protection Active",
                                MessageBoxButton.OK,
                                MessageBoxImage.Information
                            );
                        });
                    }
                    else
                    {
                        UpdateProtectionStatus(false, "Protection verification failed");
                    }
                }
                else
                {
                    UpdateProtectionStatus(false, "SetWindowDisplayAffinity failed");
                    
                    await Dispatcher.InvokeAsync(() =>
                    {
                        MessageBox.Show(
                            "Failed to enable capture protection.\n\n" +
                            "This feature requires:\n" +
                            "• Windows 10 version 2004 or later\n" +
                            "• Windows 11\n\n" +
                            "The application will continue to work, but screen capture protection will not be active.",
                            "Protection Warning",
                            MessageBoxButton.OK,
                            MessageBoxImage.Warning
                        );
                    });
                }
            }
            catch (Exception ex)
            {
                UpdateProtectionStatus(false, $"Error: {ex.Message}");
                
                await Dispatcher.InvokeAsync(() =>
                {
                    MessageBox.Show(
                        $"Error applying capture protection:\n{ex.Message}",
                        "Protection Error",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error
                    );
                });
            }
        }

        private void UpdateProtectionStatus(bool enabled, string message)
        {
            Dispatcher.Invoke(() =>
            {
                ProtectionStatusText.Text = enabled ? "🔒 " + message : "⚠️ " + message;
                ProtectionStatusBadge.Background = enabled 
                    ? new System.Windows.Media.SolidColorBrush(
                        System.Windows.Media.Color.FromRgb(0x2d, 0x50, 0x16))
                    : new System.Windows.Media.SolidColorBrush(
                        System.Windows.Media.Color.FromRgb(0x85, 0x64, 0x04));
                ProtectionStatusText.Foreground = enabled
                    ? new System.Windows.Media.SolidColorBrush(
                        System.Windows.Media.Color.FromRgb(0x90, 0xee, 0x90))
                    : new System.Windows.Media.SolidColorBrush(
                        System.Windows.Media.Color.FromRgb(0xff, 0xc1, 0x07));
            });
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            var settingsWindow = new SettingsWindow(this);
            settingsWindow.Owner = this;
            settingsWindow.ShowDialog();
        }

        public void ReloadWebClient()
        {
            LoadWebClient();
        }

        public string GetWebClientUrl()
        {
            return webView.Source?.ToString() ?? webClientUrl;
        }

        public bool IsProtectionEnabled()
        {
            return isProtectionEnabled;
        }
    }
}
