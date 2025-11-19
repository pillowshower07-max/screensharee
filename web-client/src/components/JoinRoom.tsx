import { useState } from 'react';
import { ConnectionStatus } from '../services/WebRTCService';
import './JoinRoom.css';

interface JoinRoomProps {
  onJoinRoom: (roomId: string, username: string) => void;
  connectionStatus: ConnectionStatus;
}

function JoinRoom({ onJoinRoom, connectionStatus }: JoinRoomProps) {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && username.trim() && connectionStatus === 'connected') {
      onJoinRoom(roomId.trim(), username.trim());
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    return `status-indicator ${connectionStatus}`;
  };

  return (
    <div className="join-room-container">
      <div className="join-room-card">
        <h1>ProtectedRTC</h1>
        <p className="subtitle">Capture-Resistant Video Calls</p>
        
        <div className={getStatusClass()}>
          <span className="status-dot"></span>
          <span>{getStatusText()}</span>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="username">Your Name</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <input
              id="roomId"
              type="text"
              placeholder="Enter room ID or create one"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="join-button"
            disabled={connectionStatus !== 'connected'}
          >
            Join Room
          </button>
        </form>

        <div className="info-text">
          <p>Share the same Room ID with others to join the same call.</p>
          <p className="warning">⚠️ For Windows desktop protection, use the WPF client.</p>
        </div>
      </div>
    </div>
  );
}

export default JoinRoom;
