import { describe, it, expect, beforeEach } from 'vitest';
import { RoomStore } from '../room-store.js';
import { FIBONACCI_DECK, createRoom } from '@mighty-poker/core';

describe('RoomStore', () => {
  let store: RoomStore;

  beforeEach(() => {
    store = new RoomStore();
  });

  it('creates and retrieves a room', () => {
    const room = createRoom('r1', 'Sprint', FIBONACCI_DECK, 'alice', 'p1');
    store.set(room);
    expect(store.get('r1')).toEqual(room);
  });

  it('returns undefined for unknown room', () => {
    expect(store.get('nonexistent')).toBeUndefined();
  });

  it('deletes a room', () => {
    const room = createRoom('r1', 'Sprint', FIBONACCI_DECK, 'alice', 'p1');
    store.set(room);
    store.delete('r1');
    expect(store.get('r1')).toBeUndefined();
  });

  it('checks if a room exists', () => {
    expect(store.has('r1')).toBe(false);
    const room = createRoom('r1', 'Sprint', FIBONACCI_DECK, 'alice', 'p1');
    store.set(room);
    expect(store.has('r1')).toBe(true);
  });
});
