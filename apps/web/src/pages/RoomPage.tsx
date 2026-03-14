import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket, startRound, castVote, revealVotes, resetRound } from '../lib/socket.js';
import { useRoomStore } from '../stores/room-store.js';
import { RoomHeader } from '../components/RoomHeader.js';
import { ParticipantList } from '../components/ParticipantList.js';
import { CardDeck } from '../components/CardDeck.js';
import { RevealedResults } from '../components/RevealedResults.js';
import { FacilitatorControls } from '../components/FacilitatorControls.js';
import { ConnectionBanner } from '../components/ConnectionBanner.js';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, participantId, token, myVote, setRoom, setConnected, connected } =
    useRoomStore();

  useEffect(() => {
    if (!roomId) return;

    const savedToken = localStorage.getItem(`room-token-${roomId}`);
    if (!token && savedToken) {
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading room...</p>
      </div>
    );
  }

  const isVoting = room.currentRound.status === 'voting';
  const isRevealed = room.currentRound.status === 'revealed';
  const isFacilitator =
    room.participants.find((p) => p.id === participantId)?.role === 'facilitator';
  const currentVote = myVote();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ConnectionBanner connected={connected} />
      <RoomHeader
        roomName={room.name}
        roomId={room.id}
        participantCount={room.participants.filter((p) => p.connected).length}
        roundStatus={room.currentRound.status}
        connected={connected}
      />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Left column: participants */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <ParticipantList
              participants={room.participants}
              currentRound={room.currentRound}
              currentParticipantId={participantId}
            />
          </div>
        </aside>

        {/* Right column: voting area */}
        <section className="space-y-6">
          {/* Facilitator controls */}
          {isFacilitator && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <FacilitatorControls
                roundStatus={room.currentRound.status}
                onStart={() => roomId && startRound(roomId)}
                onReveal={() => roomId && revealVotes(roomId)}
                onReset={() => roomId && resetRound(roomId)}
              />
            </div>
          )}

          {/* Voting cards */}
          {isVoting && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <CardDeck
                deck={room.deck}
                selectedValue={currentVote}
                disabled={false}
                onSelect={(value) => roomId && castVote(roomId, value)}
              />
            </div>
          )}

          {/* Waiting state */}
          {room.currentRound.status === 'idle' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-4xl mb-4">🃏</p>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Waiting for facilitator to start voting
              </h2>
              <p className="text-gray-400 text-sm">
                Participants will be able to cast their votes once the round begins
              </p>
            </div>
          )}

          {/* Results */}
          {isRevealed && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <RevealedResults
                votes={room.currentRound.votes}
                participants={room.participants}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
