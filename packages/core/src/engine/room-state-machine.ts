import type { RoomState, Participant, VotingRound } from '../types/index.js';
import { InvalidTransitionError, ValidationError } from '../errors.js';

export function createRoom(
  id: string,
  name: string,
  deck: string[],
  facilitatorName: string,
  facilitatorId: string,
): RoomState {
  const facilitator: Participant = {
    id: facilitatorId,
    name: facilitatorName,
    role: 'facilitator',
    connected: true,
  };

  const round: VotingRound = {
    status: 'idle',
    votes: [],
  };

  return {
    id,
    name,
    deck,
    participants: [facilitator],
    currentRound: round,
    createdAt: Date.now(),
  };
}

export function addParticipant(room: RoomState, name: string, id: string): RoomState {
  if (room.participants.some((p) => p.name === name)) {
    throw new ValidationError(`Participant name "${name}" is already taken in this room`);
  }
  if (room.participants.some((p) => p.id === id)) {
    throw new ValidationError(`Participant id "${id}" already exists in this room`);
  }

  const participant: Participant = {
    id,
    name,
    role: 'participant',
    connected: true,
  };

  return {
    ...room,
    participants: [...room.participants, participant],
  };
}

export function removeParticipant(room: RoomState, participantId: string): RoomState {
  return {
    ...room,
    participants: room.participants.filter((p) => p.id !== participantId),
  };
}

export function startVoting(room: RoomState): RoomState {
  if (room.currentRound.status === 'voting') {
    throw new InvalidTransitionError('Voting has already started');
  }
  if (room.currentRound.status === 'revealed') {
    throw new InvalidTransitionError('Round must be reset before starting a new vote');
  }

  return {
    ...room,
    currentRound: {
      status: 'voting',
      votes: [],
      startedAt: Date.now(),
    },
  };
}

export function castVote(room: RoomState, participantId: string, value: string): RoomState {
  if (room.currentRound.status !== 'voting') {
    throw new InvalidTransitionError('Voting is not currently active');
  }
  if (!room.participants.some((p) => p.id === participantId)) {
    throw new ValidationError(`Participant "${participantId}" not found in room`);
  }
  if (!room.deck.includes(value)) {
    throw new ValidationError(`Vote value "${value}" is not in the deck`);
  }

  const existingVoteIndex = room.currentRound.votes.findIndex(
    (v) => v.participantId === participantId,
  );

  const updatedVotes =
    existingVoteIndex >= 0
      ? room.currentRound.votes.map((v, i) => (i === existingVoteIndex ? { participantId, value } : v))
      : [...room.currentRound.votes, { participantId, value }];

  return {
    ...room,
    currentRound: {
      ...room.currentRound,
      votes: updatedVotes,
    },
  };
}

export function revealVotes(room: RoomState): RoomState {
  if (room.currentRound.status !== 'voting') {
    throw new InvalidTransitionError('Can only reveal votes during an active voting round');
  }

  return {
    ...room,
    currentRound: {
      ...room.currentRound,
      status: 'revealed',
      revealedAt: Date.now(),
    },
  };
}

export function resetRound(room: RoomState): RoomState {
  if (room.currentRound.status === 'voting') {
    throw new InvalidTransitionError('Cannot reset while voting is in progress — reveal first');
  }

  return {
    ...room,
    currentRound: {
      status: 'idle',
      votes: [],
    },
  };
}

export function allParticipantsVoted(room: RoomState): boolean {
  if (room.currentRound.status !== 'voting') return false;

  const votedIds = new Set(room.currentRound.votes.map((v) => v.participantId));
  return room.participants.every((p) => votedIds.has(p.id));
}
