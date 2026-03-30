import { create } from 'zustand';
import type { RoomState } from '@mighty-poker/core';

interface RoomStoreState {
  room: RoomState | null;
  participantId: string | null;
  token: string | null;
  connected: boolean;
  error: string | null;
  pendingVote: string | null;

  // Actions
  setRoom: (room: RoomState) => void;
  setIdentity: (participantId: string, roomId: string, token: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setPendingVote: (value: string | null) => void;
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
  pendingVote: null,
};

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  ...initialState,

  setRoom: (room) => {
    const { pendingVote, participantId } = get();
    if (pendingVote && participantId) {
      if (room.currentRound.status !== 'voting') {
        // Round ended or reset — clear optimistic vote
        set({ room, pendingVote: null });
        return;
      }
      const serverVote = room.currentRound.votes.find(
        (v) => v.participantId === participantId,
      );
      if (serverVote?.value === pendingVote) {
        set({ room, pendingVote: null });
        return;
      }
    }
    set({ room });
  },

  setIdentity: (participantId, _roomId, token) => set({ participantId, token }),

  setConnected: (connected) => set({ connected }),

  setError: (error) => set({ error }),

  setPendingVote: (value) => set({ pendingVote: value }),

  reset: () => set(initialState),

  myVote: () => {
    const { room, participantId } = get();
    if (!room || !participantId) return null;
    const vote = room.currentRound.votes.find((v) => v.participantId === participantId);
    return vote?.value ?? null;
  },
}));
