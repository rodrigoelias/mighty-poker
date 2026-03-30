import React from 'react';
import type { Participant, VotingRound } from '@mighty-poker/core';
import BpkText, { TEXT_STYLES } from '@skyscanner/backpack-web/bpk-component-text';
import BpkBadge, { BADGE_TYPES } from '@skyscanner/backpack-web/bpk-component-badge';
import BpkCard from '@skyscanner/backpack-web/bpk-component-card';
import {
  coreAccentDay,
  coreEcoDay,
  statusSuccessSpotDay,
  statusWarningSpotDay,
  statusDangerSpotDay,
  surfaceHeroDay,
  surfaceSubtleDay,
  lineDay,
  textOnDarkDay,
  textHeroDay,
} from '@skyscanner/bpk-foundations-web/tokens/base.es6';

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
  coreAccentDay,
  statusSuccessSpotDay,
  statusWarningSpotDay,
  statusDangerSpotDay,
  coreEcoDay,
  surfaceHeroDay,
  surfaceSubtleDay,
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
      <BpkText textStyle={TEXT_STYLES.caption} tagName="h2">
        Participants ({participants.length})
      </BpkText>
      <ul className="space-y-2">
        {participants.map((p) => {
          const voted = currentRound.votes.some((v) => v.participantId === p.id);
          const isMe = p.id === currentParticipantId;
          const vote = currentRound.votes.find((v) => v.participantId === p.id);

          return (
            <li key={p.id} className={`${!p.connected ? 'opacity-50' : ''}`}>
              <BpkCard
                atomic={false}
                padded
                className="flex items-center gap-3 transition-colors"
                style={
                  isMe
                    ? {
                        backgroundColor: surfaceSubtleDay,
                        boxShadow: `inset 0 0 0 1px ${coreAccentDay}`,
                      }
                    : undefined
                }
              >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: avatarColor(p.name),
                  color: textOnDarkDay,
                }}
              >
                {initials(p.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <BpkText tagName="span" className="truncate">
                    {p.name}
                  </BpkText>
                  {isMe && (
                    <BpkText
                      textStyle={TEXT_STYLES.caption}
                      tagName="span"
                      style={{ color: coreAccentDay }}
                    >
                      (you)
                    </BpkText>
                  )}
                  {p.role === 'facilitator' && (
                    <BpkBadge type={BADGE_TYPES.brand}>facilitator</BpkBadge>
                  )}
                  {!p.connected && (
                    <BpkBadge type={BADGE_TYPES.normal}>disconnected</BpkBadge>
                  )}
                </div>
              </div>
              {isVoting && (
                <div className="flex-shrink-0">
                  {voted ? (
                    <BpkBadge type={BADGE_TYPES.success}>&#10003;</BpkBadge>
                  ) : (
                    <div
                      className="w-7 h-9 rounded-md"
                      style={{
                        border: `2px dashed ${lineDay}`,
                      }}
                    />
                  )}
                </div>
              )}
              {isRevealed && vote && (
                <div
                  className="w-7 h-9 rounded-md flex items-center justify-center"
                  style={{
                    backgroundColor: surfaceSubtleDay,
                    border: `2px solid ${coreAccentDay}`,
                  }}
                >
                  <BpkText
                    textStyle={TEXT_STYLES.caption}
                    tagName="span"
                    style={{ color: textHeroDay, fontWeight: 'bold' }}
                  >
                    {vote.value}
                  </BpkText>
                </div>
              )}
              </BpkCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
