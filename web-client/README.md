# ProtectedRTC Web Client

React-based WebRTC interface for video calling.

## Features

- Real-time video and audio calling
- Screen sharing
- Device selection (camera, microphone)
- Room-based sessions
- Responsive UI

## Development

Install dependencies:
```bash
npm install
```

Run development server:
```bash
npm run dev
```

Server runs on http://localhost:5000

## Configuration

Create `.env` file:
```env
VITE_SIGNALING_SERVER=http://localhost:3000
```

For production:
```env
VITE_SIGNALING_SERVER=https://signal.example.com
```

## Build

```bash
npm run build
```

Output: `dist/` folder

## Deployment

### Static Hosting

Deploy the `dist/` folder to:
- **Netlify**: Drag & drop or connect GitHub
- **Vercel**: Connect repository
- **AWS S3 + CloudFront**: Static website hosting
- **Nginx**: Serve static files

### Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name app.example.com;
    
    root /var/www/protectedrtc;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

Requires WebRTC support and getUserMedia/getDisplayMedia APIs.

## Components

### WebRTCService
Core service managing:
- WebSocket connection to signaling server
- RTCPeerConnection lifecycle
- Media stream handling
- Signaling message routing

### JoinRoom
Room joining interface with:
- Username input
- Room ID input
- Connection status indicator

### CallInterface
In-call interface with:
- Video tiles (local + remote)
- Media controls
- Connection status

### VideoTile
Individual participant video display:
- Video stream rendering
- Audio/video muted indicators
- Username overlay

### ControlBar
Media control buttons:
- Microphone toggle
- Camera toggle
- Screen share toggle
- Leave room

## Testing Locally

1. Start signaling server: `cd ../signaling-server && npm run dev`
2. Start web client: `npm run dev`
3. Open http://localhost:5000 in two browser tabs
4. Join the same room in both tabs

## Permissions

The app requires:
- Camera access (for video)
- Microphone access (for audio)
- Screen capture access (for screen sharing)

Grant when prompted by the browser.

## Troubleshooting

### "Disconnected" Status
- Ensure signaling server is running
- Check VITE_SIGNALING_SERVER URL
- Verify network connectivity

### No Video/Audio
- Grant camera/microphone permissions
- Check device privacy settings
- Try different browser
- Check if device is in use by another app

### Screen Share Not Working
- Use supported browser (Chrome, Edge, Firefox)
- Grant screen share permission when prompted
- Check for conflicting extensions

## License

MIT License
