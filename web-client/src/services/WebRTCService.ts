import { io, Socket } from 'socket.io-client';

export interface Participant {
  id: string;
  username: string;
  stream?: MediaStream;
}

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

const defaultConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export class WebRTCService {
  private socket: Socket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private config: WebRTCConfig;
  
  public roomId: string | null = null;
  public participantId: string | null = null;
  public username: string | null = null;
  public participants: Map<string, Participant> = new Map();
  
  public onParticipantJoined?: (participant: Participant) => void;
  public onParticipantLeft?: (participantId: string) => void;
  public onStreamAdded?: (participantId: string, stream: MediaStream) => void;
  public onConnectionStatusChanged?: (status: ConnectionStatus) => void;

  constructor(config?: Partial<WebRTCConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('Connected to signaling server');
          this.onConnectionStatusChanged?.('connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from signaling server');
          this.onConnectionStatusChanged?.('disconnected');
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          this.onConnectionStatusChanged?.('disconnected');
          reject(error);
        });

        this.setupSignalingListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupSignalingListeners() {
    if (!this.socket) return;

    this.socket.on('room-joined', ({ roomId, participantId, participants }) => {
      console.log('Joined room:', roomId);
      this.roomId = roomId;
      this.participantId = participantId;
      
      participants.forEach((p: { id: string; username: string }) => {
        this.participants.set(p.id, { id: p.id, username: p.username });
        this.createPeerConnection(p.id, true);
      });
    });

    this.socket.on('participant-joined', async ({ participantId, username }) => {
      console.log('Participant joined:', username);
      const participant: Participant = { id: participantId, username };
      this.participants.set(participantId, participant);
      this.onParticipantJoined?.(participant);
    });

    this.socket.on('participant-left', ({ participantId }) => {
      console.log('Participant left:', participantId);
      this.closePeerConnection(participantId);
      this.participants.delete(participantId);
      this.onParticipantLeft?.(participantId);
    });

    this.socket.on('offer', async ({ senderId, offer }) => {
      console.log('Received offer from:', senderId);
      await this.handleOffer(senderId, offer);
    });

    this.socket.on('answer', async ({ senderId, answer }) => {
      console.log('Received answer from:', senderId);
      await this.handleAnswer(senderId, answer);
    });

    this.socket.on('ice-candidate', async ({ senderId, candidate }) => {
      await this.handleIceCandidate(senderId, candidate);
    });
  }

  async joinRoom(roomId: string, username: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to signaling server');
    }

    this.username = username;
    this.onConnectionStatusChanged?.('connecting');
    
    this.socket.emit('join-room', { roomId, username });
  }

  private async createPeerConnection(peerId: string, initiator: boolean) {
    const pc = new RTCPeerConnection(this.config);
    this.peerConnections.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          targetId: peerId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received track from:', peerId);
      const participant = this.participants.get(peerId);
      if (participant) {
        participant.stream = event.streams[0];
        this.onStreamAdded?.(peerId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        pc.addTrack(track, this.screenStream!);
      });
    }

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (this.socket) {
        this.socket.emit('offer', {
          targetId: peerId,
          offer: pc.localDescription
        });
      }
    }
  }

  private async handleOffer(senderId: string, offer: RTCSessionDescriptionInit) {
    let pc = this.peerConnections.get(senderId);
    
    if (!pc) {
      await this.createPeerConnection(senderId, false);
      pc = this.peerConnections.get(senderId)!;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.socket) {
      this.socket.emit('answer', {
        targetId: senderId,
        answer: pc.localDescription
      });
    }
  }

  private async handleAnswer(senderId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(senderId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleIceCandidate(senderId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(senderId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  async startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: constraints?.video !== undefined ? constraints.video : { width: 1280, height: 720 },
        audio: constraints?.audio !== undefined ? constraints.audio : true
      });

      this.localStream = stream;
      
      this.peerConnections.forEach(pc => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      });

      return stream;
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: false
      });

      this.screenStream = stream;
      
      this.peerConnections.forEach(pc => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      });

      stream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      return stream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  stopCamera() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }

  toggleMicrophone(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleCamera(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  private closePeerConnection(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.emit('leave-room');
    }
    
    this.stopCamera();
    this.stopScreenShare();
    
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.participants.clear();
    
    this.roomId = null;
    this.participantId = null;
  }

  disconnect() {
    this.leaveRoom();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
