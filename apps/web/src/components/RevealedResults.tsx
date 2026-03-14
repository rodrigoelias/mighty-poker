import React from 'react';
import type { Vote, Participant } from '@mighty-poker/core';

interface Props {
  votes: Vote[];
  participants: Participant[];
}

function getConsensus(votes: Vote[]): string | null {
  if (votes.length === 0) return null;
  const values = votes.map((v) => v.value);
  const first = values[0];
  return values.every((v) => v === first) ? first : null;
}

export function RevealedResults({ votes, participants }: Props) {
  const consensus = getConsensus(votes);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">
        Results
      </h2>

      {consensus ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Consensus!</p>
              <p className="text-3xl font-bold text-emerald-800">{consensus}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg py-2 px-4">
          No consensus — discuss and vote again
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {votes.map((vote) => {
          const participant = participants.find((p) => p.id === vote.participantId);
          return (
            <div
              key={vote.participantId}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
            >
              <div className="w-10 h-14 bg-violet-50 border-2 border-violet-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-violet-700">{vote.value}</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">
                  {participant?.name ?? 'Unknown'}
                </p>
                {participant?.role === 'facilitator' && (
                  <p className="text-xs text-amber-600">facilitator</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
