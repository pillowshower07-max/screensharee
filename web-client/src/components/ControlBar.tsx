import './ControlBar.css';

interface ControlBarProps {
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeaveRoom: () => void;
}

function ControlBar({
  isMicEnabled,
  isCameraEnabled,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeaveRoom
}: ControlBarProps) {
  return (
    <div className="control-bar">
      <div className="controls">
        <button
          className={`control-button ${!isMicEnabled ? 'inactive' : ''}`}
          onClick={onToggleMic}
          title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          <span className="icon">{isMicEnabled ? '🎤' : '🔇'}</span>
          <span className="label">Mic</span>
        </button>

        <button
          className={`control-button ${!isCameraEnabled ? 'inactive' : ''}`}
          onClick={onToggleCamera}
          title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          <span className="icon">{isCameraEnabled ? '📹' : '📷'}</span>
          <span className="label">Camera</span>
        </button>

        <button
          className={`control-button ${isScreenSharing ? 'active' : ''}`}
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <span className="icon">🖥️</span>
          <span className="label">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
        </button>

        <button
          className="control-button leave-button"
          onClick={onLeaveRoom}
          title="Leave room"
        >
          <span className="icon">📞</span>
          <span className="label">Leave</span>
        </button>
      </div>
    </div>
  );
}

export default ControlBar;
