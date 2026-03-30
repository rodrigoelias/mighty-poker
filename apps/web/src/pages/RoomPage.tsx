import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BpkText, { TEXT_STYLES } from '@skyscanner/backpack-web/bpk-component-text';
import BpkCard from '@skyscanner/backpack-web/bpk-component-card';
import { BpkSpinner, SPINNER_TYPES } from '@skyscanner/backpack-web/bpk-component-spinner';
import { canvasDay } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
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
  const { room, participantId, token, pendingVote, myVote, connected } = useRoomStore();

  useEffect(() => {
    if (!roomId) return;

    const savedToken = localStorage.getItem(`room-token-${roomId}`);
    if (!token && savedToken) {
      navigate(`/room/${roomId}/join`);
      return;
    }

    // Ensure socket connection exists — listeners are registered in SocketProvider
    getSocket(token ?? undefined);
  }, [roomId, token, navigate]);

  if (!room) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: canvasDay }}
      >
        <BpkSpinner type={SPINNER_TYPES.primary} />
      </div>
    );
  }

  const isVoting = room.currentRound.status === 'voting';
  const isRevealed = room.currentRound.status === 'revealed';
  const isFacilitator =
    room.participants.find((p) => p.id === participantId)?.role === 'facilitator';
  const currentVote = pendingVote ?? myVote();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: canvasDay }}>
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
          <BpkCard padded>
            <ParticipantList
              participants={room.participants}
              currentRound={room.currentRound}
              currentParticipantId={participantId}
            />
          </BpkCard>
        </aside>

        {/* Right column: voting area */}
        <section className="space-y-6">
          {/* Facilitator controls */}
          {isFacilitator && (
            <BpkCard padded>
              <FacilitatorControls
                roundStatus={room.currentRound.status}
                onStart={() => roomId && startRound(roomId)}
                onReveal={() => roomId && revealVotes(roomId)}
                onReset={() => roomId && resetRound(roomId)}
              />
            </BpkCard>
          )}

          {/* Voting cards */}
          {isVoting && (
            <BpkCard padded>
              <CardDeck
                deck={room.deck}
                selectedValue={currentVote}
                disabled={false}
                onSelect={(value) => roomId && castVote(roomId, value)}
              />
            </BpkCard>
          )}

          {/* Waiting state */}
          {room.currentRound.status === 'idle' && (
            <BpkCard padded className="p-12 text-center">
              <p className="text-4xl mb-4">🃏</p>
              <BpkText textStyle={TEXT_STYLES.heading4} tagName="h2" className="mb-2">
                Waiting for facilitator to start voting
              </BpkText>
              <BpkText textStyle={TEXT_STYLES.caption} tagName="p">
                Participants will be able to cast their votes once the round begins
              </BpkText>
            </BpkCard>
          )}

          {/* Results */}
          {isRevealed && (
            <BpkCard padded>
              <RevealedResults
                votes={room.currentRound.votes}
                participants={room.participants}
              />
            </BpkCard>
          )}
        </section>
      </main>
    </div>
  );
}
