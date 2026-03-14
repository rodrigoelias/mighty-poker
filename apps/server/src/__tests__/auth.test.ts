import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../auth.js';

describe('JWT auth', () => {
  it('generates a token with participantId and roomId', () => {
    const token = generateToken({ participantId: 'p1', roomId: 'r1' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifies a valid token and returns payload', () => {
    const token = generateToken({ participantId: 'p1', roomId: 'r1' });
    const payload = verifyToken(token);
    expect(payload).toMatchObject({ participantId: 'p1', roomId: 'r1' });
  });

  it('throws for invalid token', () => {
    expect(() => verifyToken('not.a.valid.token')).toThrow();
  });

  it('throws for empty string', () => {
    expect(() => verifyToken('')).toThrow();
  });
});
