import { useState, useEffect, useRef } from 'react';
import { WebRTCService, type Participant } from '../services/WebRTCService';
import VideoTile from './VideoTile';
import ControlBar from './ControlBar';
import './CallInterface.css';

interface CallInterfaceProps {
  webrtcService: WebRTCService;
  participants: Map<string, Participant>;
  onLeaveRoom: () => void;
}

function CallInterface({ webrtcService, participants, onLeaveRoom }: CallInterfaceProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startMediaDevices();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startMediaDevices = async () => {
    try {
      const stream = await webrtcService.startCamera();
      setLocalStream(stream);
      setError(null);
    } catch (err) {
      console.error('Error starting media devices:', err);
      setError('Failed to access camera/microphone. Please grant permissions.');
    }
  };

  const handleToggleMic = () => {
    const newState = !isMicEnabled;
    setIsMicEnabled(newState);
    webrtcService.toggleMicrophone(newState);
  };

  const handleToggleCamera = () => {
    const newState = !isCameraEnabled;
    setIsCameraEnabled(newState);
    webrtcService.toggleCamera(newState);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      webrtcService.stopScreenShare();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await webrtcService.startScreenShare();
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } catch (err) {
        console.error('Error starting screen share:', err);
        setError('Failed to start screen sharing.');
      }
    }
  };

  const handleLeaveRoom = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    onLeaveRoom();
  };

  const participantsList = Array.from(participants.values());

  return (
    <div className="call-interface">
      <div className="call-header">
        <div className="room-info">
          <h2>Room: {webrtcService.roomId}</h2>
          <span className="participant-count">
            {participantsList.length + 1} participant{participantsList.length !== 0 ? 's' : ''}
          </span>
        </div>
        <div className="protection-status">
          <span className="protection-badge">🔒 Protection: Web Mode</span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="video-grid">
        <VideoTile
          stream={localStream}
          username={webrtcService.username || 'You'}
          isLocal={true}
          isMuted={!isMicEnabled}
          isCameraOff={!isCameraEnabled}
        />
        
        {participantsList.map(participant => (
          <VideoTile
            key={participant.id}
            stream={participant.stream}
            username={participant.username}
            isLocal={false}
          />
        ))}
      </div>

      <ControlBar
        isMicEnabled={isMicEnabled}
        isCameraEnabled={isCameraEnabled}
        isScreenSharing={isScreenSharing}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        onLeaveRoom={handleLeaveRoom}
      />
    </div>
  );
}

export default CallInterface;
