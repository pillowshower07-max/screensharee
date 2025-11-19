# ProtectedRTC Desktop Client

Windows WPF application that hosts the WebRTC client with capture protection.

## Requirements

- Windows 10 (version 2004 or later) or Windows 11
- .NET 8 SDK
- WebView2 Runtime (usually pre-installed on Windows 11)

## Building

### Using Visual Studio 2022

1. Open `ProtectedRTC.csproj`
2. Restore NuGet packages (Build → Restore NuGet Packages)
3. Build (Ctrl+Shift+B)
4. Run (F5)

### Using Command Line

```bash
dotnet restore
dotnet build
dotnet run
```

## Publishing

Create a standalone executable:

```bash
dotnet publish -c Release -r win-x64 --self-contained
```

Output: `bin/Release/net8.0-windows/win-x64/publish/ProtectedRTC.exe`

## Configuration

The app looks for `web-client-url.txt` in the same directory as the executable.

Example `web-client-url.txt`:
```
http://localhost:5000
```

Or use the Settings menu (⚙️ button) in the application.

## How Capture Protection Works

The application uses Windows API `SetWindowDisplayAffinity` with flag `WDA_EXCLUDEFROMCAPTURE`:

```csharp
[DllImport("user32.dll")]
private static extern bool SetWindowDisplayAffinity(IntPtr hWnd, uint dwAffinity);

// Apply protection
SetWindowDisplayAffinity(windowHandle, 0x00000011);
```

This tells Windows to exclude this window from:
- Print Screen captures
- Desktop Duplication API
- Screen sharing applications
- Screenshot tools

## Testing Protection

1. **Screenshot Test**: Press PrintScreen → Paste in Paint → Window appears black
2. **Snipping Tool**: Try to capture → Window appears black or excluded
3. **Screen Share**: Share screen in Teams/Zoom → Window hidden to remote viewers

## Troubleshooting

### "Protection: INACTIVE" Warning

- Ensure Windows 10 version 2004+ or Windows 11
- Try running as Administrator
- Check Windows version with `winver` command

### WebView2 Errors

- Download WebView2 Runtime from [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/)
- Install "Evergreen Standalone Installer"

### Build Errors

```bash
dotnet clean
dotnet restore
dotnet build
```

## Project Structure

```
desktop-client/
├── ProtectedRTC.csproj      # Project file
├── App.xaml                 # Application definition
├── App.xaml.cs             # Application code
├── MainWindow.xaml         # Main window UI
├── MainWindow.xaml.cs      # Main window logic + protection
├── SettingsWindow.xaml     # Settings UI
└── SettingsWindow.xaml.cs  # Settings logic
```

## Key Features

- ✅ WebView2 integration for hosting web client
- ✅ SetWindowDisplayAffinity capture protection
- ✅ Protection status verification
- ✅ Settings panel for configuration
- ✅ Visual protection status indicator

## License

MIT License
