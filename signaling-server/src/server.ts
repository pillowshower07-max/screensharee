import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { Participant, Room } from './types.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      participants: new Map()
    });
  }
  return rooms.get(roomId)!;
}

function removeParticipantFromRoom(socketId: string) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.participants.has(socketId)) {
      const participant = room.participants.get(socketId)!;
      room.participants.delete(socketId);
      
      if (room.participants.size === 0) {
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit('participant-left', {
          participantId: socketId,
          username: participant.username
        });
      }
      
      console.log(`Participant ${participant.username} left room ${roomId}`);
      return { roomId, participant };
    }
  }
  return null;
}

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, username }: { roomId: string; username: string }) => {
    console.log(`${username} joining room: ${roomId}`);
    
    const room = getOrCreateRoom(roomId);
    
    const participant: Participant = {
      id: socket.id,
      username,
      roomId
    };
    
    room.participants.set(socket.id, participant);
    socket.join(roomId);
    
    const otherParticipants = Array.from(room.participants.values())
      .filter(p => p.id !== socket.id)
      .map(p => ({ id: p.id, username: p.username }));
    
    socket.emit('room-joined', {
      roomId,
      participantId: socket.id,
      participants: otherParticipants
    });
    
    socket.to(roomId).emit('participant-joined', {
      participantId: socket.id,
      username
    });
    
    console.log(`Room ${roomId} now has ${room.participants.size} participants`);
  });

  socket.on('offer', ({ targetId, offer }: { targetId: string; offer: any }) => {
    console.log(`Forwarding offer from ${socket.id} to ${targetId}`);
    io.to(targetId).emit('offer', {
      senderId: socket.id,
      offer
    });
  });

  socket.on('answer', ({ targetId, answer }: { targetId: string; answer: any }) => {
    console.log(`Forwarding answer from ${socket.id} to ${targetId}`);
    io.to(targetId).emit('answer', {
      senderId: socket.id,
      answer
    });
  });

  socket.on('ice-candidate', ({ targetId, candidate }: { targetId: string; candidate: any }) => {
    io.to(targetId).emit('ice-candidate', {
      senderId: socket.id,
      candidate
    });
  });

  socket.on('leave-room', () => {
    removeParticipantFromRoom(socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    removeParticipantFromRoom(socket.id);
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/rooms', (req, res) => {
  const roomsList = Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    participantCount: room.participants.size
  }));
  res.json({ rooms: roomsList });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 ProtectedRTC Signaling Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`\n   STUN server: stun:stun.l.google.com:19302\n`);
});
