import { describe, it, expect } from 'vitest';
import {
  createRoom,
  addParticipant,
  removeParticipant,
  startVoting,
  castVote,
  revealVotes,
  resetRound,
  allParticipantsVoted,
} from '../room-state-machine.js';
import { FIBONACCI_DECK } from '../../constants/decks.js';

describe('createRoom', () => {
  it('creates a room with the given id, name, and deck', () => {
    const room = createRoom('room-1', 'Sprint 42', FIBONACCI_DECK, 'alice', 'p-1');
    expect(room.id).toBe('room-1');
    expect(room.name).toBe('Sprint 42');
    expect(room.deck).toEqual(FIBONACCI_DECK);
  });

  it('creates the facilitator as the first participant', () => {
    const room = createRoom('room-1', 'Sprint 42', FIBONACCI_DECK, 'alice', 'p-1');
    expect(room.participants).toHaveLength(1);
    expect(room.participants[0]).toMatchObject({
      id: 'p-1',
      name: 'alice',
      role: 'facilitator',
      connected: true,
    });
  });

  it('initializes with an idle voting round', () => {
    const room = createRoom('room-1', 'Sprint 42', FIBONACCI_DECK, 'alice', 'p-1');
    expect(room.currentRound.status).toBe('idle');
    expect(room.currentRound.votes).toEqual([]);
  });

  it('sets createdAt to a recent timestamp', () => {
    const before = Date.now();
    const room = createRoom('room-1', 'Sprint 42', FIBONACCI_DECK, 'alice', 'p-1');
    expect(room.createdAt).toBeGreaterThanOrEqual(before);
    expect(room.createdAt).toBeLessThanOrEqual(Date.now());
  });
});

describe('addParticipant', () => {
  const baseRoom = createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice');

  it('adds a new participant to the room', () => {
    const room = addParticipant(baseRoom, 'bob', 'p-bob');
    expect(room.participants).toHaveLength(2);
    expect(room.participants[1]).toMatchObject({
      id: 'p-bob',
      name: 'bob',
      role: 'participant',
      connected: true,
    });
  });

  it('does not mutate the original room', () => {
    addParticipant(baseRoom, 'bob', 'p-bob');
    expect(baseRoom.participants).toHaveLength(1);
  });

  it('throws if participant name already exists', () => {
    expect(() => addParticipant(baseRoom, 'alice', 'p-alice2')).toThrow();
  });

  it('throws if participant id already exists', () => {
    expect(() => addParticipant(baseRoom, 'carol', 'p-alice')).toThrow();
  });
});

describe('removeParticipant', () => {
  it('removes the participant from the room', () => {
    const room = addParticipant(
      createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'),
      'bob',
      'p-bob',
    );
    const updated = removeParticipant(room, 'p-bob');
    expect(updated.participants).toHaveLength(1);
    expect(updated.participants.find((p) => p.id === 'p-bob')).toBeUndefined();
  });

  it('does not mutate the original room', () => {
    const room = addParticipant(
      createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'),
      'bob',
      'p-bob',
    );
    removeParticipant(room, 'p-bob');
    expect(room.participants).toHaveLength(2);
  });

  it('returns room unchanged if participant not found', () => {
    const room = createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice');
    const updated = removeParticipant(room, 'nonexistent');
    expect(updated.participants).toHaveLength(1);
  });
});

describe('startVoting', () => {
  it('transitions round status from idle to voting', () => {
    const room = createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice');
    const updated = startVoting(room);
    expect(updated.currentRound.status).toBe('voting');
  });

  it('sets startedAt timestamp', () => {
    const before = Date.now();
    const room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    expect(room.currentRound.startedAt).toBeGreaterThanOrEqual(before);
  });

  it('clears any previous votes', () => {
    let room = createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice');
    room = startVoting(room);
    room = castVote(room, 'p-alice', '5');
    room = revealVotes(room);
    room = resetRound(room);
    room = startVoting(room);
    expect(room.currentRound.votes).toEqual([]);
  });

  it('throws if round is already voting', () => {
    const room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    expect(() => startVoting(room)).toThrow();
  });

  it('throws if round is revealed (must reset first)', () => {
    let room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    room = revealVotes(room);
    expect(() => startVoting(room)).toThrow();
  });
});

describe('castVote', () => {
  const votingRoom = () =>
    startVoting(
      addParticipant(
        createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'),
        'bob',
        'p-bob',
      ),
    );

  it('records a vote for a participant', () => {
    const room = castVote(votingRoom(), 'p-alice', '5');
    expect(room.currentRound.votes).toHaveLength(1);
    expect(room.currentRound.votes[0]).toEqual({ participantId: 'p-alice', value: '5' });
  });

  it('replaces an existing vote from the same participant', () => {
    let room = castVote(votingRoom(), 'p-alice', '5');
    room = castVote(room, 'p-alice', '8');
    expect(room.currentRound.votes).toHaveLength(1);
    expect(room.currentRound.votes[0].value).toBe('8');
  });

  it('throws if round is not in voting status', () => {
    const room = createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice');
    expect(() => castVote(room, 'p-alice', '5')).toThrow();
  });

  it('throws if participant not in room', () => {
    expect(() => castVote(votingRoom(), 'p-nonexistent', '5')).toThrow();
  });

  it('throws if vote value is not in deck', () => {
    expect(() => castVote(votingRoom(), 'p-alice', '99')).toThrow();
  });

  it('does not mutate original room', () => {
    const room = votingRoom();
    castVote(room, 'p-alice', '5');
    expect(room.currentRound.votes).toHaveLength(0);
  });
});

describe('revealVotes', () => {
  it('transitions round to revealed status', () => {
    const room = revealVotes(
      startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice')),
    );
    expect(room.currentRound.status).toBe('revealed');
  });

  it('sets revealedAt timestamp', () => {
    const before = Date.now();
    const room = revealVotes(
      startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice')),
    );
    expect(room.currentRound.revealedAt).toBeGreaterThanOrEqual(before);
  });

  it('throws if round is not voting', () => {
    const room = createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice');
    expect(() => revealVotes(room)).toThrow();
  });

  it('throws if round is already revealed', () => {
    let room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    room = revealVotes(room);
    expect(() => revealVotes(room)).toThrow();
  });
});

describe('resetRound', () => {
  it('resets round to idle status', () => {
    let room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    room = revealVotes(room);
    room = resetRound(room);
    expect(room.currentRound.status).toBe('idle');
  });

  it('clears all votes', () => {
    let room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    room = castVote(room, 'p-alice', '5');
    room = revealVotes(room);
    room = resetRound(room);
    expect(room.currentRound.votes).toEqual([]);
  });

  it('clears timing fields', () => {
    let room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    room = revealVotes(room);
    room = resetRound(room);
    expect(room.currentRound.startedAt).toBeUndefined();
    expect(room.currentRound.revealedAt).toBeUndefined();
  });

  it('throws if round is voting (must reveal first)', () => {
    const room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    expect(() => resetRound(room)).toThrow();
  });
});

describe('allParticipantsVoted', () => {
  it('returns false if no votes', () => {
    const room = startVoting(
      addParticipant(
        createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'),
        'bob',
        'p-bob',
      ),
    );
    expect(allParticipantsVoted(room)).toBe(false);
  });

  it('returns false if only some participants have voted', () => {
    let room = startVoting(
      addParticipant(
        createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'),
        'bob',
        'p-bob',
      ),
    );
    room = castVote(room, 'p-alice', '5');
    expect(allParticipantsVoted(room)).toBe(false);
  });

  it('returns true when all participants have voted', () => {
    let room = startVoting(
      addParticipant(
        createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'),
        'bob',
        'p-bob',
      ),
    );
    room = castVote(room, 'p-alice', '5');
    room = castVote(room, 'p-bob', '8');
    expect(allParticipantsVoted(room)).toBe(true);
  });

  it('returns true for a single participant who has voted', () => {
    let room = startVoting(createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice'));
    room = castVote(room, 'p-alice', '3');
    expect(allParticipantsVoted(room)).toBe(true);
  });

  it('returns false if not in voting status', () => {
    const room = createRoom('r1', 'Test', FIBONACCI_DECK, 'alice', 'p-alice');
    expect(allParticipantsVoted(room)).toBe(false);
  });
});
