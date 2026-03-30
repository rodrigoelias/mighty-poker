import React from 'react';
import type { Participant, VotingRound } from '@mighty-poker/core';
import BpkText, { TEXT_STYLES, TEXT_COLORS } from '@skyscanner/backpack-web/bpk-component-text';
import BpkBadge, { BADGE_TYPES } from '@skyscanner/backpack-web/bpk-component-badge';
import BpkCard from '@skyscanner/backpack-web/bpk-component-card';
import {
  coreAccentDay,
  surfaceSubtleDay,
  lineDay,
  textOnDarkDay,
  textHeroDay,
} from '@skyscanner/bpk-foundations-web/tokens/base.es6';
import { avatarColor, initials } from '../lib/avatar.js';

interface Props {
  participants: Participant[];
  currentRound: VotingRound;
  currentParticipantId: string | null;
}

export function ParticipantList({ participants, currentRound, currentParticipantId }: Props) {
  const isVoting = currentRound.status === 'voting';
  const isRevealed = currentRound.status === 'revealed';

  return (
    <div className="space-y-2">
      <BpkText textStyle={TEXT_STYLES.label1} tagName="h2">
        Participants ({participants.length})
      </BpkText>
      <ul className="list-none space-y-2">
        {participants.map((p) => {
          const voted = currentRound.votes.some((v) => v.participantId === p.id);
          const isMe = p.id === currentParticipantId;
          const vote = currentRound.votes.find((v) => v.participantId === p.id);

          return (
            <li key={p.id} className={`${!p.connected ? 'opacity-50' : ''}`}>
              <BpkCard
                atomic={false}
                padded
                style={
                  isMe
                    ? {
                        backgroundColor: surfaceSubtleDay,
                        borderLeft: `4px solid ${coreAccentDay}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
              <div
                data-testid="avatar"
                className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: avatarColor(p.name),
                  color: textOnDarkDay,
                  borderRadius: '50%',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}
              >
                {initials(p.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <BpkText tagName="span" className="truncate">{p.name}</BpkText>
                  {isMe && (
                    <BpkText
                      textStyle={TEXT_STYLES.caption}
                      tagName="span"
                      color={TEXT_COLORS.textHero}
                    >
                      (you)
                    </BpkText>
                  )}
                  {p.role === 'facilitator' && (
                    <BpkBadge type={BADGE_TYPES.brand}>facilitator</BpkBadge>
                  )}
                  {!p.connected && (
                    <BpkBadge type={BADGE_TYPES.normal}>offline</BpkBadge>
                  )}
                </div>
              </div>
              {isVoting && (
                <div className="flex-shrink-0">
                  {voted ? (
                    <BpkBadge type={BADGE_TYPES.success}>&#10003;</BpkBadge>
                  ) : (
                    <div
                      className="w-7 h-9"
                      style={{
                        border: `2px dashed ${lineDay}`,
                        borderRadius: '0.375rem',
                      }}
                    />
                  )}
                </div>
              )}
              {isRevealed && vote && (
                <div
                  className="w-7 h-9 flex items-center justify-center"
                  style={{
                    backgroundColor: surfaceSubtleDay,
                    border: `2px solid ${coreAccentDay}`,
                    borderRadius: '0.375rem',
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
                </div>
              </BpkCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
