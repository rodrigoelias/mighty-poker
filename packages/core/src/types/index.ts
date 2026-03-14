export type RoomStatus = 'waiting' | 'voting' | 'revealed';
export type ParticipantRole = 'facilitator' | 'participant';
export type RoundStatus = 'idle' | 'voting' | 'revealed';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  connected: boolean;
}

export interface Vote {
  participantId: string;
  value: string;
}

export interface VotingRound {
  status: RoundStatus;
  votes: Vote[];
  startedAt?: number;
  revealedAt?: number;
}

export interface RoomState {
  id: string;
  name: string;
  deck: string[];
  participants: Participant[];
  currentRound: VotingRound;
  createdAt: number;
}
