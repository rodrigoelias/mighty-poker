import { io, type Socket } from 'socket.io-client';
import type { RoomState } from '@mighty-poker/core';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (socket?.connected) return socket;

  if (socket) socket.disconnect();

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
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('room:create', { name, participantName }, (result: CreateRoomResult) => {
      resolve(result);
    });
  });
}

export function joinRoom(
  roomId: string,
  participantName: string,
  token?: string,
): Promise<JoinRoomResult> {
  return new Promise((resolve) => {
    const s = token ? getSocket(token) : getSocket();
    s.emit('room:join', { roomId, participantName, token }, (result: JoinRoomResult) => {
      resolve(result);
    });
  });
}

export function startRound(roomId: string): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('round:start', { roomId }, resolve);
  });
}

export function castVote(roomId: string, value: string): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('vote:cast', { roomId, value }, resolve);
  });
}

export function revealVotes(roomId: string): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('round:reveal', { roomId }, resolve);
  });
}

export function resetRound(roomId: string): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('round:reset', { roomId }, resolve);
  });
}
