import React from 'react';
import type { Vote, Participant } from '@mighty-poker/core';
import BpkText, { TEXT_STYLES, TEXT_COLORS } from '@skyscanner/backpack-web/bpk-component-text';
import BpkBadge, { BADGE_TYPES } from '@skyscanner/backpack-web/bpk-component-badge';
import BpkCard from '@skyscanner/backpack-web/bpk-component-card';
import BpkInfoBanner, { ALERT_TYPES } from '@skyscanner/backpack-web/bpk-component-info-banner';
import { textOnDarkDay } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
import { avatarColor, initials } from '../lib/avatar.js';

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
      <BpkText
        textStyle={TEXT_STYLES.caption}
        tagName="h2"
        className="text-center"
      >
        Results
      </BpkText>

      {consensus ? (
        <BpkInfoBanner
          type={ALERT_TYPES.SUCCESS}
          message={`\u{1F389} Consensus! Everyone voted ${consensus}`}
        />
      ) : (
        <BpkInfoBanner
          type={ALERT_TYPES.WARNING}
          message={`\u26A0\uFE0F No consensus \u2014 discuss and vote again`}
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {votes.map((vote) => {
          const participant = participants.find((p) => p.id === vote.participantId);
          return (
            <BpkCard key={vote.participantId} atomic={false} padded>
              <div className="flex items-center gap-3">
                <BpkText
                  textStyle={TEXT_STYLES.heading2}
                  tagName="span"
                  color={TEXT_COLORS.textHero}
                >
                  {vote.value}
                </BpkText>
                {participant && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: avatarColor(participant.name),
                      color: textOnDarkDay,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {initials(participant.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <BpkText tagName="p" className="truncate">
                    {participant?.name ?? 'Unknown'}
                  </BpkText>
                  {participant?.role === 'facilitator' && (
                    <BpkBadge type={BADGE_TYPES.brand}>facilitator</BpkBadge>
                  )}
                </div>
              </div>
            </BpkCard>
          );
        })}
      </div>
    </div>
  );
}
