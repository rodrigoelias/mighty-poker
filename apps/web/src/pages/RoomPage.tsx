import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket, startRound, castVote, revealVotes, resetRound } from '../lib/socket.js';
import { useRoomStore } from '../stores/room-store.js';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, participantId, token, myVote, setRoom, setIdentity, setConnected } =
    useRoomStore();

  useEffect(() => {
    if (!roomId) return;

    // Restore from localStorage if page was refreshed
    const savedToken = localStorage.getItem(`room-token-${roomId}`);
    if (!token && savedToken) {
      // Need to rejoin — redirect to join page
      navigate(`/room/${roomId}/join`);
      return;
    }

    const s = getSocket(token ?? undefined);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('room:updated', (updatedRoom) => setRoom(updatedRoom));

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('room:updated');
    };
  }, [roomId, token, navigate, setRoom, setConnected]);

  if (!room) {
    return <p>Loading room...</p>;
  }

  const isVoting = room.currentRound.status === 'voting';
  const isRevealed = room.currentRound.status === 'revealed';
  const isFacilitator = room.participants.find((p) => p.id === participantId)?.role === 'facilitator';
  const currentVote = myVote();

  async function handleStartRound() {
    if (!roomId) return;
    await startRound(roomId);
  }

  async function handleVote(value: string) {
    if (!roomId) return;
    await castVote(roomId, value);
  }

  async function handleReveal() {
    if (!roomId) return;
    await revealVotes(roomId);
  }

  async function handleReset() {
    if (!roomId) return;
    await resetRound(roomId);
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/room/${roomId}/join`;
    navigator.clipboard.writeText(url).catch(() => {
      prompt('Copy this link:', url);
    });
  }

  return (
    <div>
      <h1>{room.name}</h1>
      <button onClick={copyInviteLink}>Copy Invite Link</button>

      <h2>Participants ({room.participants.length})</h2>
      <ul>
        {room.participants.map((p) => {
          const voted = room.currentRound.votes.some((v) => v.participantId === p.id);
          return (
            <li key={p.id}>
              {p.name}
              {p.role === 'facilitator' && ' (facilitator)'}
              {!p.connected && ' (disconnected)'}
              {isVoting && (voted ? ' ✓' : ' …')}
            </li>
          );
        })}
      </ul>

      {isRevealed && (
        <div>
          <h2>Results</h2>
          <ul>
            {room.currentRound.votes.map((v) => {
              const p = room.participants.find((x) => x.id === v.participantId);
              return (
                <li key={v.participantId}>
                  {p?.name ?? v.participantId}: <strong>{v.value}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isVoting && (
        <div>
          <h2>Cast your vote</h2>
          <div>
            {room.deck.map((value) => (
              <button
                key={value}
                onClick={() => handleVote(value)}
                disabled={currentVote === value}
                aria-pressed={currentVote === value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        {isFacilitator && room.currentRound.status === 'idle' && (
          <button onClick={handleStartRound}>Start Voting</button>
        )}
        {isFacilitator && isVoting && (
          <button onClick={handleReveal}>Reveal Votes</button>
        )}
        {isFacilitator && isRevealed && (
          <button onClick={handleReset}>New Round</button>
        )}
      </div>
    </div>
  );
}
