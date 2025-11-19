import { useState, useEffect, useRef } from 'react';
import { WebRTCService, type ConnectionStatus, type Participant } from './services/WebRTCService';
import JoinRoom from './components/JoinRoom';
import CallInterface from './components/CallInterface';
import './App.css';

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3000';

function App() {
  const [isInRoom, setIsInRoom] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const webrtcService = useRef<WebRTCService | null>(null);

  useEffect(() => {
    const service = new WebRTCService();
    
    service.onConnectionStatusChanged = (status) => {
      setConnectionStatus(status);
    };

    service.onParticipantJoined = () => {
      setParticipants(new Map(service.participants));
    };

    service.onParticipantLeft = () => {
      setParticipants(new Map(service.participants));
    };

    service.onStreamAdded = () => {
      setParticipants(new Map(service.participants));
    };

    webrtcService.current = service;

    service.connect(SIGNALING_SERVER).catch((error) => {
      console.error('Failed to connect to signaling server:', error);
    });

    return () => {
      service.disconnect();
    };
  }, []);

  const handleJoinRoom = async (roomId: string, username: string) => {
    if (webrtcService.current) {
      try {
        await webrtcService.current.joinRoom(roomId, username);
        setIsInRoom(true);
      } catch (error) {
        console.error('Failed to join room:', error);
        alert('Failed to join room. Please try again.');
      }
    }
  };

  const handleLeaveRoom = () => {
    if (webrtcService.current) {
      webrtcService.current.leaveRoom();
      setIsInRoom(false);
      setParticipants(new Map());
    }
  };

  return (
    <div className="app">
      {!isInRoom ? (
        <JoinRoom 
          onJoinRoom={handleJoinRoom}
          connectionStatus={connectionStatus}
        />
      ) : (
        <CallInterface 
          webrtcService={webrtcService.current!}
          participants={participants}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
