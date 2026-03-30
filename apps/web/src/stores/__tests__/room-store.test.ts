import { describe, it, expect, beforeEach } from 'vitest';
import { useRoomStore } from '../room-store.js';
import type { RoomState } from '@mighty-poker/core';

const mockRoom: RoomState = {
  id: 'r1',
  name: 'Sprint 1',
  deck: ['1', '2', '3', '5', '8'],
  participants: [
    { id: 'p1', name: 'alice', role: 'facilitator', connected: true },
    { id: 'p2', name: 'bob', role: 'participant', connected: true },
  ],
  currentRound: { status: 'idle', votes: [] },
  createdAt: Date.now(),
};

describe('useRoomStore', () => {
  beforeEach(() => {
    useRoomStore.setState({
      room: null,
      participantId: null,
      token: null,
      connected: false,
      error: null,
      pendingVote: null,
    });
  });

  it('initializes with null room and not connected', () => {
    const state = useRoomStore.getState();
    expect(state.room).toBeNull();
    expect(state.connected).toBe(false);
    expect(state.participantId).toBeNull();
  });

  it('setRoom updates the room', () => {
    useRoomStore.getState().setRoom(mockRoom);
    expect(useRoomStore.getState().room).toEqual(mockRoom);
  });

  it('setIdentity stores participantId and token', () => {
    useRoomStore.getState().setIdentity('p1', 'r1', 'tok123');
    const state = useRoomStore.getState();
    expect(state.participantId).toBe('p1');
    expect(state.token).toBe('tok123');
  });

  it('setConnected updates connection status', () => {
    useRoomStore.getState().setConnected(true);
    expect(useRoomStore.getState().connected).toBe(true);
    useRoomStore.getState().setConnected(false);
    expect(useRoomStore.getState().connected).toBe(false);
  });

  it('setError stores error message', () => {
    useRoomStore.getState().setError('Something went wrong');
    expect(useRoomStore.getState().error).toBe('Something went wrong');
  });

  it('reset clears all state', () => {
    useRoomStore.getState().setRoom(mockRoom);
    useRoomStore.getState().setIdentity('p1', 'r1', 'tok123');
    useRoomStore.getState().setConnected(true);
    useRoomStore.getState().reset();
    const state = useRoomStore.getState();
    expect(state.room).toBeNull();
    expect(state.participantId).toBeNull();
    expect(state.token).toBeNull();
    expect(state.connected).toBe(false);
    expect(state.error).toBeNull();
  });

  it('myVote returns the current participant vote', () => {
    useRoomStore.setState({
      room: {
        ...mockRoom,
        currentRound: {
          status: 'voting',
          votes: [{ participantId: 'p1', value: '5' }],
        },
      },
      participantId: 'p1',
      token: 'tok',
      connected: true,
      error: null,
    });
    expect(useRoomStore.getState().myVote()).toBe('5');
  });

  describe('pendingVote', () => {
    it('setPendingVote stores the pending vote value', () => {
      useRoomStore.getState().setPendingVote('8');
      expect(useRoomStore.getState().pendingVote).toBe('8');
    });

    it('setRoom clears pendingVote when server confirms the vote', () => {
      useRoomStore.setState({
        participantId: 'p1',
        pendingVote: '5',
      });
      useRoomStore.getState().setRoom({
        ...mockRoom,
        currentRound: {
          status: 'voting',
          votes: [{ participantId: 'p1', value: '5' }],
        },
      });
      expect(useRoomStore.getState().pendingVote).toBeNull();
    });

    it('setRoom keeps pendingVote when server has different vote', () => {
      useRoomStore.setState({
        participantId: 'p1',
        pendingVote: '8',
      });
      useRoomStore.getState().setRoom({
        ...mockRoom,
        currentRound: {
          status: 'voting',
          votes: [{ participantId: 'p1', value: '5' }],
        },
      });
      expect(useRoomStore.getState().pendingVote).toBe('8');
    });

    it('setRoom keeps pendingVote when server has no vote yet during voting', () => {
      useRoomStore.setState({
        participantId: 'p1',
        pendingVote: '5',
      });
      useRoomStore.getState().setRoom({
        ...mockRoom,
        currentRound: { status: 'voting', votes: [] },
      });
      expect(useRoomStore.getState().pendingVote).toBe('5');
    });

    it('setRoom clears pendingVote when round status changes to idle', () => {
      useRoomStore.setState({
        participantId: 'p1',
        pendingVote: '5',
      });
      useRoomStore.getState().setRoom({
        ...mockRoom,
        currentRound: { status: 'idle', votes: [] },
      });
      expect(useRoomStore.getState().pendingVote).toBeNull();
    });

    it('setRoom clears pendingVote when round status changes to revealed', () => {
      useRoomStore.setState({
        participantId: 'p1',
        pendingVote: '5',
      });
      useRoomStore.getState().setRoom({
        ...mockRoom,
        currentRound: {
          status: 'revealed',
          votes: [{ participantId: 'p1', value: '5' }],
        },
      });
      expect(useRoomStore.getState().pendingVote).toBeNull();
    });

    it('reset clears pendingVote', () => {
      useRoomStore.getState().setPendingVote('3');
      useRoomStore.getState().reset();
      expect(useRoomStore.getState().pendingVote).toBeNull();
    });
  });

  it('myVote returns null when no vote', () => {
    useRoomStore.setState({
      room: mockRoom,
      participantId: 'p1',
      token: 'tok',
      connected: true,
      error: null,
    });
    expect(useRoomStore.getState().myVote()).toBeNull();
  });
});
