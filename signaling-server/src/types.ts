export interface Participant {
  id: string;
  username: string;
  roomId: string;
}

export interface Room {
  id: string;
  participants: Map<string, Participant>;
}

export interface SignalingMessage {
  targetId: string;
  offer?: any;
  answer?: any;
  candidate?: any;
}
