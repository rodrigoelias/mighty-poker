import React from 'react';
import type { RoundStatus } from '@mighty-poker/core';

interface Props {
  roomName: string;
  roomId: string;
  participantCount: number;
  roundStatus: RoundStatus;
  connected: boolean;
}

const statusConfig: Record<RoundStatus, { label: string; className: string }> = {
  idle: { label: 'Waiting', className: 'bg-gray-100 text-gray-600' },
  voting: { label: 'Voting', className: 'bg-blue-100 text-blue-700' },
  revealed: { label: 'Revealed', className: 'bg-emerald-100 text-emerald-700' },
};

export function RoomHeader({ roomName, roomId, participantCount, roundStatus, connected }: Props) {
  const status = statusConfig[roundStatus];

  function copyInviteLink() {
    const url = `${window.location.origin}/room/${roomId}/join`;
    navigator.clipboard.writeText(url).catch(() => {
      prompt('Copy this link:', url);
    });
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{roomName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>
              {status.label}
            </span>
            <span className="text-xs text-gray-500">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </span>
            {!connected && (
              <span className="text-xs text-red-500 font-medium">• Reconnecting...</span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={copyInviteLink}
        className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Invite
      </button>
    </header>
  );
}
