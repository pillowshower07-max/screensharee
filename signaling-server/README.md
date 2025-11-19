# ProtectedRTC Signaling Server

WebSocket-based signaling server for coordinating WebRTC peer connections.

## Features

- Room-based peer coordination
- WebSocket signaling with Socket.IO
- SDP offer/answer exchange
- ICE candidate forwarding
- Connection health monitoring

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Server runs on port 3000 (configurable via PORT environment variable).

## Production

Build TypeScript:
```bash
npm run build
```

Run production server:
```bash
npm start
```

## API Endpoints

### HTTP

- `GET /health` - Server health check
- `GET /rooms` - List active rooms

### WebSocket Events

**Client → Server:**
- `join-room` - Join a room
- `leave-room` - Leave current room
- `offer` - Send WebRTC offer to peer
- `answer` - Send WebRTC answer to peer
- `ice-candidate` - Send ICE candidate to peer

**Server → Client:**
- `room-joined` - Confirmation of room join
- `participant-joined` - New participant joined
- `participant-left` - Participant left
- `offer` - Received offer from peer
- `answer` - Received answer from peer
- `ice-candidate` - Received ICE candidate from peer

## Configuration

Environment variables:
- `PORT` - Server port (default: 3000)

## Deployment

### Using PM2

```bash
npm install -g pm2
npm run build
pm2 start dist/server.js --name protectedrtc
pm2 startup
pm2 save
```

### Using Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Nginx WebSocket Proxy

```nginx
server {
    listen 443 ssl;
    server_name signal.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## STUN/TURN Configuration

The server provides STUN server information to clients:
- Default: `stun:stun.l.google.com:19302`

For production, add authenticated TURN server for better NAT traversal.

## Monitoring

Health check endpoint:
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "rooms": 2,
  "timestamp": "2025-01-19T12:00:00.000Z"
}
```

## License

MIT License
