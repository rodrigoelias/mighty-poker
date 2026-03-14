import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import { io as ioClient, type Socket } from 'socket.io-client';
import { createApp } from '../app.js';

function connectClient(port: number, token?: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}/rooms`, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

describe('Server integration', () => {
  let httpServer: ReturnType<typeof createServer>;
  let port: number;

  beforeEach(async () => {
    const { app, io } = createApp();
    httpServer = createServer(app);
    io.attach(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as { port: number }).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  describe('room:create', () => {
    it('creates a room and returns roomId + token', async () => {
      const socket = await connectClient(port);
      const result = await new Promise<{ roomId: string; token: string }>((resolve) => {
        socket.emit('room:create', { name: 'Sprint 1', participantName: 'alice' }, resolve);
      });
      expect(result.roomId).toBeTruthy();
      expect(result.token).toBeTruthy();
      socket.disconnect();
    });
  });

  describe('room:join', () => {
    it('joins an existing room', async () => {
      const facilitator = await connectClient(port);
      const { roomId } = await new Promise<{ roomId: string; token: string }>((resolve) => {
        facilitator.emit(
          'room:create',
          { name: 'Sprint 1', participantName: 'alice' },
          resolve,
        );
      });

      const joiner = await connectClient(port);
      const result = await new Promise<{ token: string; room: unknown }>((resolve, reject) => {
        joiner.emit(
          'room:join',
          { roomId, participantName: 'bob' },
          (res: { error?: string; token?: string; room?: unknown }) => {
            if (res.error) reject(new Error(res.error));
            else resolve(res as { token: string; room: unknown });
          },
        );
      });
      expect(result.token).toBeTruthy();
      expect(result.room).toBeTruthy();

      facilitator.disconnect();
      joiner.disconnect();
    });

    it('errors on duplicate name', async () => {
      const facilitator = await connectClient(port);
      const { roomId } = await new Promise<{ roomId: string; token: string }>((resolve) => {
        facilitator.emit(
          'room:create',
          { name: 'Sprint 1', participantName: 'alice' },
          resolve,
        );
      });

      const joiner = await connectClient(port);
      const result = await new Promise<{ error?: string }>((resolve) => {
        joiner.emit('room:join', { roomId, participantName: 'alice' }, resolve);
      });
      expect(result.error).toBeTruthy();

      facilitator.disconnect();
      joiner.disconnect();
    });

    it('errors on non-existent room', async () => {
      const socket = await connectClient(port);
      const result = await new Promise<{ error?: string }>((resolve) => {
        socket.emit('room:join', { roomId: 'nonexistent', participantName: 'bob' }, resolve);
      });
      expect(result.error).toBeTruthy();
      socket.disconnect();
    });
  });

  describe('vote:cast', () => {
    it('casts a vote during active voting', async () => {
      const facilitator = await connectClient(port);
      const { roomId, token } = await new Promise<{ roomId: string; token: string }>(
        (resolve) => {
          facilitator.emit(
            'room:create',
            { name: 'Sprint 1', participantName: 'alice' },
            resolve,
          );
        },
      );

      // Reconnect with token
      facilitator.disconnect();
      const authed = await connectClient(port, token);

      await new Promise<void>((resolve, reject) => {
        authed.emit('round:start', { roomId }, (res: { error?: string }) => {
          if (res?.error) reject(new Error(res.error));
          else resolve();
        });
      });

      const voteResult = await new Promise<{ error?: string }>((resolve) => {
        authed.emit('vote:cast', { roomId, value: '5' }, resolve);
      });
      expect(voteResult.error).toBeUndefined();
      authed.disconnect();
    });
  });

  describe('round:reveal', () => {
    it('reveals votes', async () => {
      const facilitator = await connectClient(port);
      const { roomId, token } = await new Promise<{ roomId: string; token: string }>(
        (resolve) => {
          facilitator.emit(
            'room:create',
            { name: 'Sprint 1', participantName: 'alice' },
            resolve,
          );
        },
      );

      facilitator.disconnect();
      const authed = await connectClient(port, token);

      await new Promise<void>((resolve, reject) => {
        authed.emit('round:start', { roomId }, (res: { error?: string }) => {
          if (res?.error) reject(new Error(res.error));
          else resolve();
        });
      });
      await new Promise<void>((resolve, reject) => {
        authed.emit('vote:cast', { roomId, value: '8' }, (res: { error?: string }) => {
          if (res?.error) reject(new Error(res.error));
          else resolve();
        });
      });
      const revealResult = await new Promise<{ error?: string }>((resolve) => {
        authed.emit('round:reveal', { roomId }, resolve);
      });
      expect(revealResult.error).toBeUndefined();
      authed.disconnect();
    });
  });

  describe('round:reset', () => {
    it('resets the round after reveal', async () => {
      const facilitator = await connectClient(port);
      const { roomId, token } = await new Promise<{ roomId: string; token: string }>(
        (resolve) => {
          facilitator.emit(
            'room:create',
            { name: 'Sprint 1', participantName: 'alice' },
            resolve,
          );
        },
      );

      facilitator.disconnect();
      const authed = await connectClient(port, token);

      await new Promise<void>((resolve, reject) => {
        authed.emit('round:start', { roomId }, (res: { error?: string }) => {
          if (res?.error) reject(new Error(res.error));
          else resolve();
        });
      });
      await new Promise<void>((resolve, reject) => {
        authed.emit('vote:cast', { roomId, value: '3' }, (res: { error?: string }) => {
          if (res?.error) reject(new Error(res.error));
          else resolve();
        });
      });
      await new Promise<void>((resolve, reject) => {
        authed.emit('round:reveal', { roomId }, (res: { error?: string }) => {
          if (res?.error) reject(new Error(res.error));
          else resolve();
        });
      });

      const resetResult = await new Promise<{ error?: string }>((resolve) => {
        authed.emit('round:reset', { roomId }, resolve);
      });
      expect(resetResult.error).toBeUndefined();
      authed.disconnect();
    });
  });

  describe('GET /api/rooms/:roomId', () => {
    it('returns room info for existing room', async () => {
      const socket = await connectClient(port);
      const { roomId } = await new Promise<{ roomId: string; token: string }>((resolve) => {
        socket.emit('room:create', { name: 'Sprint 1', participantName: 'alice' }, resolve);
      });
      socket.disconnect();

      const res = await fetch(`http://localhost:${port}/api/rooms/${roomId}`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { id: string; name: string };
      expect(data.id).toBe(roomId);
      expect(data.name).toBe('Sprint 1');
    });

    it('returns 404 for unknown room', async () => {
      const res = await fetch(`http://localhost:${port}/api/rooms/nonexistent`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /health', () => {
    it('returns 200 ok', async () => {
      const res = await fetch(`http://localhost:${port}/health`);
      expect(res.status).toBe(200);
    });
  });
});
