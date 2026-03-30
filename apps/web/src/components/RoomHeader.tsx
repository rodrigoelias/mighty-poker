import React from 'react';
import type { RoundStatus } from '@mighty-poker/core';
import BpkText, { TEXT_STYLES, TEXT_COLORS } from '@skyscanner/backpack-web/bpk-component-text';
import BpkBadge, { BADGE_TYPES } from '@skyscanner/backpack-web/bpk-component-badge';
import BpkButton, { BUTTON_TYPES } from '@skyscanner/backpack-web/bpk-component-button';
import { surfaceHeroDay } from '@skyscanner/bpk-foundations-web/tokens/base.es6';

interface Props {
  roomName: string;
  roomId: string;
  participantCount: number;
  roundStatus: RoundStatus;
  connected: boolean;
}

const badgeTypeMap: Record<RoundStatus, (typeof BADGE_TYPES)[keyof typeof BADGE_TYPES]> = {
  idle: BADGE_TYPES.normal,
  voting: BADGE_TYPES.brand,
  revealed: BADGE_TYPES.success,
};

const badgeLabelMap: Record<RoundStatus, string> = {
  idle: 'Idle',
  voting: 'Voting',
  revealed: 'Revealed',
};

export function RoomHeader({ roomName, roomId, participantCount, roundStatus, connected }: Props) {
  function copyInviteLink() {
    const url = `${window.location.origin}/room/${roomId}/join`;
    navigator.clipboard.writeText(url).catch(() => {
      prompt('Copy this link:', url);
    });
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{ backgroundColor: surfaceHeroDay }}
    >
      <div className="flex items-center gap-4">
        <div>
          <BpkText textStyle={TEXT_STYLES.heading3} tagName="h1" color={TEXT_COLORS.textOnDark}>
            {roomName}
          </BpkText>
          <div className="flex items-center gap-2 mt-0.5">
            <BpkBadge type={badgeTypeMap[roundStatus]}>
              {badgeLabelMap[roundStatus]}
            </BpkBadge>
            <BpkText textStyle={TEXT_STYLES.caption} tagName="span" color={TEXT_COLORS.textOnDark}>
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </BpkText>
            {!connected && (
              <BpkText textStyle={TEXT_STYLES.caption} tagName="span" color={TEXT_COLORS.textError}>
                &bull; Reconnecting...
              </BpkText>
            )}
          </div>
        </div>
      </div>
      <BpkButton type={BUTTON_TYPES.primaryOnDark} onClick={copyInviteLink}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Invite
      </BpkButton>
    </header>
  );
}
