import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createRoom,
  addParticipant,
  removeParticipant,
  startVoting,
  castVote,
  revealVotes,
  resetRound,
  allParticipantsVoted,
  FIBONACCI_DECK,
  type RoomState,
} from '@mighty-poker/core';
import type { RoomStore } from '../room-store.js';
import { generateToken, verifyToken } from '../auth.js';

type Callback<T = void> = (result: T extends void ? { error?: string } : T & { error?: string }) => void;

interface RoomCreatedPayload {
  roomId: string;
  token: string;
  room: RoomState;
}

type AutoRevealTimers = Map<string, ReturnType<typeof setTimeout>>;

function broadcastRoom(io: Server, namespace: string, roomId: string, room: RoomState) {
  io.of(namespace).to(roomId).emit('room:updated', room);
}

function scheduleAutoReveal(
  io: Server,
  store: RoomStore,
  timers: AutoRevealTimers,
  roomId: string,
) {
  cancelAutoReveal(timers, roomId);
  const timer = setTimeout(() => {
    timers.delete(roomId);
    const room = store.get(roomId);
    if (!room || room.currentRound.status !== 'voting') return;
    try {
      const revealed = revealVotes(room);
      store.set(revealed);
      broadcastRoom(io, '/rooms', roomId, revealed);
    } catch {
      // already revealed or reset, ignore
    }
  }, 5000);
  timers.set(roomId, timer);
}

function cancelAutoReveal(timers: AutoRevealTimers, roomId: string) {
  const existing = timers.get(roomId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(roomId);
  }
}

export function registerRoomHandlers(
  io: Server,
  socket: Socket,
  store: RoomStore,
  timers: AutoRevealTimers,
) {
  socket.on(
    'room:create',
    (
      payload: { name: string; participantName: string },
      callback: Callback<RoomCreatedPayload>,
    ) => {
      try {
        const roomId = uuidv4();
        const participantId = uuidv4();
        const room = createRoom(roomId, payload.name, FIBONACCI_DECK, payload.participantName, participantId);
        store.set(room);
        const token = generateToken({ participantId, roomId });
        socket.join(roomId);
        (socket as Socket & { participantId?: string; roomId?: string }).participantId = participantId;
        (socket as Socket & { participantId?: string; roomId?: string }).roomId = roomId;
        callback({ roomId, token, room } as RoomCreatedPayload & { error?: string });
      } catch (err) {
        callback({ error: (err as Error).message } as RoomCreatedPayload & { error?: string });
      }
    },
  );

  socket.on(
    'room:join',
    (
      payload: { roomId: string; participantName: string; token?: string },
      callback: Callback<{ token: string; room: RoomState }>,
    ) => {
      try {
        const room = store.get(payload.roomId);
        if (!room) {
          callback({ error: 'Room not found' } as { token: string; room: RoomState; error?: string });
          return;
        }

        // If token provided, rejoin as existing participant
        if (payload.token) {
          try {
            const claims = verifyToken(payload.token);
            if (claims.roomId === payload.roomId) {
              socket.join(payload.roomId);
              (socket as Socket & { participantId?: string; roomId?: string }).participantId = claims.participantId;
              (socket as Socket & { participantId?: string; roomId?: string }).roomId = claims.roomId;
              callback({ token: payload.token, room } as { token: string; room: RoomState; error?: string });
              return;
            }
          } catch {
            // invalid token, fall through to normal join
          }
        }

        const participantId = uuidv4();
        const updated = addParticipant(room, payload.participantName, participantId);
        store.set(updated);
        // Cancel auto-reveal: new participant joins and hasn't voted yet
        cancelAutoReveal(timers, payload.roomId);
        const token = generateToken({ participantId, roomId: payload.roomId });
        socket.join(payload.roomId);
        (socket as Socket & { participantId?: string; roomId?: string }).participantId = participantId;
        (socket as Socket & { participantId?: string; roomId?: string }).roomId = payload.roomId;
        broadcastRoom(io, '/rooms', payload.roomId, updated);
        callback({ token, room: updated } as { token: string; room: RoomState; error?: string });
      } catch (err) {
        callback({ error: (err as Error).message } as { token: string; room: RoomState; error?: string });
      }
    },
  );

  socket.on(
    'round:start',
    (payload: { roomId: string }, callback: Callback) => {
      try {
        const room = store.get(payload.roomId);
        if (!room) {
          callback({ error: 'Room not found' });
          return;
        }
        const updated = startVoting(room);
        store.set(updated);
        broadcastRoom(io, '/rooms', payload.roomId, updated);
        callback({});
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    },
  );

  socket.on(
    'vote:cast',
    (payload: { roomId: string; value: string }, callback: Callback) => {
      try {
        const s = socket as Socket & { participantId?: string };
        const participantId = s.participantId;
        if (!participantId) {
          callback({ error: 'Not authenticated' });
          return;
        }

        const room = store.get(payload.roomId);
        if (!room) {
          callback({ error: 'Room not found' });
          return;
        }

        const updated = castVote(room, participantId, payload.value);
        store.set(updated);
        broadcastRoom(io, '/rooms', payload.roomId, updated);

        if (allParticipantsVoted(updated)) {
          scheduleAutoReveal(io, store, timers, payload.roomId);
        }

        callback({});
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    },
  );

  socket.on(
    'round:reveal',
    (payload: { roomId: string }, callback: Callback) => {
      try {
        cancelAutoReveal(timers, payload.roomId);
        const room = store.get(payload.roomId);
        if (!room) {
          callback({ error: 'Room not found' });
          return;
        }
        const updated = revealVotes(room);
        store.set(updated);
        broadcastRoom(io, '/rooms', payload.roomId, updated);
        callback({});
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    },
  );

  socket.on(
    'round:reset',
    (payload: { roomId: string }, callback: Callback) => {
      try {
        const room = store.get(payload.roomId);
        if (!room) {
          callback({ error: 'Room not found' });
          return;
        }
        const updated = resetRound(room);
        store.set(updated);
        broadcastRoom(io, '/rooms', payload.roomId, updated);
        callback({});
      } catch (err) {
        callback({ error: (err as Error).message });
      }
    },
  );

  socket.on('disconnect', () => {
    const s = socket as Socket & { participantId?: string; roomId?: string };
    if (!s.roomId || !s.participantId) return;
    const room = store.get(s.roomId);
    if (!room) return;
    // Mark participant as disconnected rather than removing — supports reconnection
    const updated = {
      ...room,
      participants: room.participants.map((p) =>
        p.id === s.participantId ? { ...p, connected: false } : p,
      ),
    };
    store.set(updated);
    broadcastRoom(io, '/rooms', s.roomId, updated);
  });
}
