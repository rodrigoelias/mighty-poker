import React from 'react';
import type { RoundStatus } from '@mighty-poker/core';

interface Props {
  roundStatus: RoundStatus;
  onStart: () => void;
  onReveal: () => void;
  onReset: () => void;
}

export function FacilitatorControls({ roundStatus, onStart, onReveal, onReset }: Props) {
  return (
    <div className="flex gap-3 justify-center">
      {roundStatus === 'idle' && (
        <button
          onClick={onStart}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
        >
          Start Voting
        </button>
      )}
      {roundStatus === 'voting' && (
        <button
          onClick={onReveal}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
        >
          Reveal Votes
        </button>
      )}
      {roundStatus === 'revealed' && (
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl shadow-sm transition-colors"
        >
          New Round
        </button>
      )}
    </div>
  );
}
