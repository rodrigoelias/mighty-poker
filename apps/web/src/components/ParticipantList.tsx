import React from 'react';
import type { Participant, VotingRound } from '@mighty-poker/core';

interface Props {
  participants: Participant[];
  currentRound: VotingRound;
  currentParticipantId: string | null;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

const avatarColors = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-lime-500',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function ParticipantList({ participants, currentRound, currentParticipantId }: Props) {
  const isVoting = currentRound.status === 'voting';
  const isRevealed = currentRound.status === 'revealed';

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        Participants ({participants.length})
      </h2>
      <ul className="space-y-2">
        {participants.map((p) => {
          const voted = currentRound.votes.some((v) => v.participantId === p.id);
          const isMe = p.id === currentParticipantId;
          const vote = currentRound.votes.find((v) => v.participantId === p.id);

          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isMe ? 'bg-violet-50 ring-1 ring-violet-200' : 'bg-white'
              } ${!p.connected ? 'opacity-50' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(p.name)}`}
              >
                {initials(p.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-900 truncate">{p.name}</span>
                  {isMe && (
                    <span className="text-xs text-violet-600 font-medium">(you)</span>
                  )}
                  {p.role === 'facilitator' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                      facilitator
                    </span>
                  )}
                  {!p.connected && (
                    <span className="text-xs text-gray-400">disconnected</span>
                  )}
                </div>
              </div>
              {isVoting && (
                <div className="flex-shrink-0">
                  {voted ? (
                    <div className="w-7 h-9 bg-violet-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  ) : (
                    <div className="w-7 h-9 border-2 border-dashed border-gray-300 rounded-md" />
                  )}
                </div>
              )}
              {isRevealed && vote && (
                <div className="w-7 h-9 bg-white border-2 border-violet-300 rounded-md flex items-center justify-center">
                  <span className="text-sm font-bold text-violet-700">{vote.value}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
