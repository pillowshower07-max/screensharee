import { useEffect, useRef } from 'react';
import './VideoTile.css';

interface VideoTileProps {
  stream: MediaStream | null | undefined;
  username: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

function VideoTile({ stream, username, isLocal = false, isMuted = false, isCameraOff = false }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`video-element ${isCameraOff ? 'hidden' : ''}`}
      />
      
      {(!stream || isCameraOff) && (
        <div className="video-placeholder">
          <div className="avatar">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      
      <div className="video-overlay">
        <div className="username-label">
          {username} {isLocal && '(You)'}
        </div>
        <div className="status-icons">
          {isMuted && (
            <div className="status-icon mic-muted" title="Microphone muted">
              🔇
            </div>
          )}
          {isCameraOff && (
            <div className="status-icon camera-off" title="Camera off">
              📷
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoTile;
