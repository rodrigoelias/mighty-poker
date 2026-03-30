import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({ connected: false, on: vi.fn(), off: vi.fn(), emit: vi.fn(), disconnect: vi.fn() })),
}));

// Mock the room store
vi.mock('../../stores/room-store.js', () => ({
  useRoomStore: {
    getState: vi.fn(() => ({
      setPendingVote: vi.fn(),
    })),
  },
}));

import { io } from 'socket.io-client';
import { getSocket, disconnectSocket, emitWithTimeout, SOCKET_TIMEOUT, castVote } from '../socket.js';
import { useRoomStore } from '../../stores/room-store.js';

describe('socket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the module-level socket variable by disconnecting
    disconnectSocket();
  });

  describe('getSocket', () => {
    it('creates a new socket on first call', () => {
      getSocket();
      expect(io).toHaveBeenCalledOnce();
    });

    it('returns existing socket even if not yet connected', () => {
      const first = getSocket();
      const second = getSocket();
      // io should only be called once — second call reuses existing socket
      expect(io).toHaveBeenCalledOnce();
      expect(first).toBe(second);
    });

    it('creates new socket after disconnect', () => {
      getSocket();
      disconnectSocket();
      getSocket();
      expect(io).toHaveBeenCalledTimes(2);
    });

    it('passes auth token when provided', () => {
      getSocket('my-token');
      expect(io).toHaveBeenCalledWith('/rooms', expect.objectContaining({
        auth: { token: 'my-token' },
      }));
    });
  });

  describe('emitWithTimeout', () => {
    it('resolves when callback fires before timeout', async () => {
      const fakeSocket = {
        emit: vi.fn((event: string, data: unknown, cb: (result: unknown) => void) => {
          cb({ success: true });
        }),
      } as any;

      const result = await emitWithTimeout(fakeSocket, 'test:event', { foo: 'bar' });
      expect(result).toEqual({ success: true });
    });

    it('rejects after timeout when callback never fires', async () => {
      vi.useFakeTimers();

      const fakeSocket = {
        emit: vi.fn(), // never calls callback
      } as any;

      const promise = emitWithTimeout(fakeSocket, 'test:event', {});

      vi.advanceTimersByTime(SOCKET_TIMEOUT);

      await expect(promise).rejects.toThrow(
        `Socket "test:event" timed out after ${SOCKET_TIMEOUT}ms`,
      );

      vi.useRealTimers();
    });

    it('clears timeout when callback fires', async () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      const fakeSocket = {
        emit: vi.fn((event: string, data: unknown, cb: (result: unknown) => void) => {
          cb({ ok: true });
        }),
      } as any;

      await emitWithTimeout(fakeSocket, 'test:event', {});
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('castVote', () => {
    it('sets pendingVote in store before emitting', () => {
      const setPendingVote = vi.fn();
      vi.mocked(useRoomStore.getState).mockReturnValue({
        setPendingVote,
      } as any);

      // castVote will call emitWithTimeout which will call socket.emit
      // The promise won't resolve since we don't call the callback, but we only
      // care that setPendingVote was called first
      castVote('room-1', '5').catch(() => {}); // ignore timeout rejection

      expect(setPendingVote).toHaveBeenCalledWith('5');
    });

    it('clears pendingVote when emit times out', async () => {
      vi.useFakeTimers();
      const setPendingVote = vi.fn();
      vi.mocked(useRoomStore.getState).mockReturnValue({
        setPendingVote,
      } as any);

      const promise = castVote('room-1', '5');

      // First call sets the optimistic vote
      expect(setPendingVote).toHaveBeenCalledWith('5');

      vi.advanceTimersByTime(SOCKET_TIMEOUT);

      await expect(promise).rejects.toThrow('timed out');

      // Second call clears pendingVote on error
      expect(setPendingVote).toHaveBeenCalledWith(null);

      vi.useRealTimers();
    });
  });
});
