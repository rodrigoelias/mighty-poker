import React from 'react';
import BpkButton, { BUTTON_TYPES } from '@skyscanner/backpack-web/bpk-component-button';
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
        <BpkButton type={BUTTON_TYPES.primary} onClick={onStart}>
          Start Voting
        </BpkButton>
      )}
      {roundStatus === 'voting' && (
        <BpkButton type={BUTTON_TYPES.secondary} onClick={onReveal}>
          Reveal Votes
        </BpkButton>
      )}
      {roundStatus === 'revealed' && (
        <BpkButton type={BUTTON_TYPES.secondary} onClick={onReset}>
          New Round
        </BpkButton>
      )}
    </div>
  );
}
