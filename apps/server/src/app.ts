import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { RoomStore } from './room-store.js';
import { registerRoomHandlers } from './ws/room-handlers.js';
import { verifyToken } from './auth.js';

export function createApp() {
  const app = express();
  const store = new RoomStore();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/rooms/:roomId', (req, res) => {
    const room = store.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.json({ id: room.id, name: room.name, participantCount: room.participants.length });
  });

  const io = new SocketIOServer({
    cors: { origin: '*' },
  });

  const roomsNs = io.of('/rooms');

  // Restore participant identity from auth token if provided
  roomsNs.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const payload = verifyToken(token);
        (socket as typeof socket & { participantId?: string; roomId?: string }).participantId =
          payload.participantId;
        (socket as typeof socket & { participantId?: string; roomId?: string }).roomId =
          payload.roomId;
        socket.join(payload.roomId);
        // Mark participant as reconnected
        const room = store.get(payload.roomId);
        if (room) {
          const updated = {
            ...room,
            participants: room.participants.map((p) =>
              p.id === payload.participantId ? { ...p, connected: true } : p,
            ),
          };
          store.set(updated);
        }
      } catch {
        // invalid token — proceed as unauthenticated
      }
    }
    next();
  });

  roomsNs.on('connection', (socket) => {
    registerRoomHandlers(io, socket, store, timers);
  });

  return { app, io, store };
}
