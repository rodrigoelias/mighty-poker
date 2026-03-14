import type { RoomState } from '@mighty-poker/core';

const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours absolute max
const EMPTY_ROOM_CLEANUP_MS = 30 * 60 * 1000; // 30 min after last participant disconnects

export class RoomStore {
  private rooms = new Map<string, RoomState>();
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

  get(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  set(room: RoomState): void {
    this.rooms.set(room.id, room);
    this.rescheduleCleanup(room);
  }

  delete(roomId: string): void {
    const timer = this.cleanupTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(roomId);
    }
    this.rooms.delete(roomId);
  }

  has(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  private rescheduleCleanup(room: RoomState): void {
    const existing = this.cleanupTimers.get(room.id);
    if (existing) clearTimeout(existing);

    const hasConnected = room.participants.some((p) => p.connected);
    const ttl = hasConnected ? ROOM_TTL_MS : EMPTY_ROOM_CLEANUP_MS;

    const timer = setTimeout(() => {
      this.cleanupTimers.delete(room.id);
      this.rooms.delete(room.id);
    }, ttl);

    this.cleanupTimers.set(room.id, timer);
  }
}
