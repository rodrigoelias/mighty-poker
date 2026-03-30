import React from 'react';
import BpkText, { TEXT_STYLES } from '@skyscanner/backpack-web/bpk-component-text';
import {
  coreAccentDay,
  surfaceDefaultDay,
  surfaceHighlightDay,
  lineDay,
  textPrimaryDay,
  textDisabledDay,
  textOnDarkDay,
} from '@skyscanner/bpk-foundations-web/tokens/base.es6';

interface Props {
  deck: string[];
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
}

const sharedButtonStyle: React.CSSProperties = {
  borderRadius: '0.75rem',
  fontSize: '1.125rem',
  fontWeight: 'bold',
  transition: 'all 150ms',
  outline: 'none',
};

const defaultStyle: React.CSSProperties = {
  ...sharedButtonStyle,
  backgroundColor: surfaceDefaultDay,
  borderColor: lineDay,
  borderWidth: 2,
  borderStyle: 'solid',
  color: textPrimaryDay,
};

const selectedStyle: React.CSSProperties = {
  ...sharedButtonStyle,
  backgroundColor: coreAccentDay,
  color: textOnDarkDay,
  transform: 'translateY(-4px)',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
};

const disabledStyle: React.CSSProperties = {
  ...sharedButtonStyle,
  backgroundColor: surfaceHighlightDay,
  color: textDisabledDay,
  cursor: 'not-allowed',
};

function getButtonStyle(isSelected: boolean, isDisabled: boolean): React.CSSProperties {
  if (isSelected) return selectedStyle;
  if (isDisabled) return disabledStyle;
  return defaultStyle;
}

export function CardDeck({ deck, selectedValue, disabled, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <BpkText textStyle={TEXT_STYLES.caption} tagName="h2" className="" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
        Choose your estimate
      </BpkText>
      <div className="flex flex-wrap gap-3 justify-center">
        {deck.map((value) => {
          const isSelected = selectedValue === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              disabled={disabled}
              aria-pressed={isSelected}
              style={getButtonStyle(isSelected, disabled)}
              className="w-14 h-20 select-none focus:outline-none focus-visible:ring-2"
            >
              {value}
            </button>
          );
        })}
      </div>
      {selectedValue && (
        <BpkText textStyle={TEXT_STYLES.caption} tagName="p" className="text-center">
          You selected{' '}
          <BpkText textStyle={TEXT_STYLES.caption} tagName="strong" style={{ color: coreAccentDay }}>
            {selectedValue}
          </BpkText>
          {' '}— click another card to change
        </BpkText>
      )}
    </div>
  );
}
