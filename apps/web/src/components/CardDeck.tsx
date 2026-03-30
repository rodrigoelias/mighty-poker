import React from 'react';
import BpkText, { TEXT_STYLES } from '@skyscanner/backpack-web/bpk-component-text';
import {
  corePrimaryDay,
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

const defaultStyle: React.CSSProperties = {
  backgroundColor: surfaceDefaultDay,
  borderColor: lineDay,
  borderWidth: 2,
  borderStyle: 'solid',
  color: textPrimaryDay,
};

const selectedStyle: React.CSSProperties = {
  backgroundColor: corePrimaryDay,
  color: textOnDarkDay,
  transform: 'translateY(-4px)',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
};

const disabledStyle: React.CSSProperties = {
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
      <BpkText textStyle={TEXT_STYLES.caption} tagName="h2" className="uppercase tracking-wider text-center">
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
              className="w-14 h-20 rounded-xl text-lg font-bold transition-all duration-150 select-none focus:outline-none focus-visible:ring-2"
            >
              {value}
            </button>
          );
        })}
      </div>
      {selectedValue && (
        <BpkText textStyle={TEXT_STYLES.caption} tagName="p" className="text-center">
          You selected{' '}
          <BpkText textStyle={TEXT_STYLES.caption} tagName="strong" style={{ color: corePrimaryDay }}>
            {selectedValue}
          </BpkText>
          {' '}— click another card to change
        </BpkText>
      )}
    </div>
  );
}
