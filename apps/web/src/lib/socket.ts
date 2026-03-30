import { io, type Socket } from 'socket.io-client';
import type { RoomState } from '@mighty-poker/core';
import { useRoomStore } from '../stores/room-store.js';

let socket: Socket | null = null;

export const SOCKET_TIMEOUT = 5000;

export function getSocket(token?: string): Socket {
  if (socket) return socket;

  socket = io('/rooms', {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function emitWithTimeout<T>(s: Socket, event: string, data: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Socket "${event}" timed out after ${SOCKET_TIMEOUT}ms`)),
      SOCKET_TIMEOUT,
    );
    s.emit(event, data, (result: T) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

export interface CreateRoomResult {
  roomId: string;
  token: string;
  room: RoomState;
  error?: string;
}

export interface JoinRoomResult {
  token: string;
  room: RoomState;
  error?: string;
}

export function createRoom(
  name: string,
  participantName: string,
): Promise<CreateRoomResult> {
  const s = getSocket();
  return emitWithTimeout<CreateRoomResult>(s, 'room:create', { name, participantName });
}

export function joinRoom(
  roomId: string,
  participantName: string,
  token?: string,
): Promise<JoinRoomResult> {
  const s = token ? getSocket(token) : getSocket();
  return emitWithTimeout<JoinRoomResult>(s, 'room:join', { roomId, participantName, token });
}

export function startRound(roomId: string): Promise<{ error?: string }> {
  const s = getSocket();
  return emitWithTimeout<{ error?: string }>(s, 'round:start', { roomId });
}

export function castVote(roomId: string, value: string): Promise<{ error?: string }> {
  useRoomStore.getState().setPendingVote(value);
  const s = getSocket();
  return emitWithTimeout<{ error?: string }>(s, 'vote:cast', { roomId, value })
    .catch((err) => {
      useRoomStore.getState().setPendingVote(null);
      throw err;
    });
}

export function revealVotes(roomId: string): Promise<{ error?: string }> {
  const s = getSocket();
  return emitWithTimeout<{ error?: string }>(s, 'round:reveal', { roomId });
}

export function resetRound(roomId: string): Promise<{ error?: string }> {
  const s = getSocket();
  return emitWithTimeout<{ error?: string }>(s, 'round:reset', { roomId });
}
