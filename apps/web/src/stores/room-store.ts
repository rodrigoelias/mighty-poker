import { create } from 'zustand';
import type { RoomState } from '@mighty-poker/core';

interface RoomStoreState {
  room: RoomState | null;
  participantId: string | null;
  token: string | null;
  connected: boolean;
  error: string | null;

  // Actions
  setRoom: (room: RoomState) => void;
  setIdentity: (participantId: string, roomId: string, token: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Derived
  myVote: () => string | null;
}

const initialState = {
  room: null,
  participantId: null,
  token: null,
  connected: false,
  error: null,
};

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  ...initialState,

  setRoom: (room) => set({ room }),

  setIdentity: (participantId, _roomId, token) => set({ participantId, token }),

  setConnected: (connected) => set({ connected }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),

  myVote: () => {
    const { room, participantId } = get();
    if (!room || !participantId) return null;
    const vote = room.currentRound.votes.find((v) => v.participantId === participantId);
    return vote?.value ?? null;
  },
}));
