import type { RoomState } from '@mighty-poker/core';

export class RoomStore {
  private rooms = new Map<string, RoomState>();

  get(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  set(room: RoomState): void {
    this.rooms.set(room.id, room);
  }

  delete(roomId: string): void {
    this.rooms.delete(roomId);
  }

  has(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
}
