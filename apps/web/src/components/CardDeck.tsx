import BpkText, { TEXT_STYLES, TEXT_COLORS } from '@skyscanner/backpack-web/bpk-component-text';
import {
  BpkCheckboxCard,
  CHECKBOX_CARD_VARIANTS,
  CHECKBOX_CARD_RADIUS,
} from '@skyscanner/backpack-web/bpk-component-checkbox-card';
import './CardDeck.css';

interface Props {
  deck: string[];
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (value: string | null) => void;
}

const specialLabels: Record<string, string> = {
  '?': 'Pass',
  '☕': 'Coffee break',
};

export function CardDeck({ deck, selectedValue, disabled, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <BpkText textStyle={TEXT_STYLES.label1} tagName="h2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
        Choose your estimate
      </BpkText>
      <div className="flex flex-wrap gap-4 justify-center" role="radiogroup" aria-label="Estimation values">
        {deck.map((value) => {
          const isSelected = selectedValue === value;
          const ariaLabel = specialLabels[value];
          return (
            <div key={value} className="card-deck-item" style={{ minWidth: 60, minHeight: 84 }}>
              <BpkCheckboxCard.Root
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(checked ? value : null)}
                disabled={disabled}
                variant={CHECKBOX_CARD_VARIANTS.onCanvasDefault}
                radius={CHECKBOX_CARD_RADIUS.rounded}
                aria-label={ariaLabel}
                value={value}
              >
                <BpkCheckboxCard.HiddenInput />
                <BpkCheckboxCard.Content>
                  <BpkCheckboxCard.Label textStyle={TEXT_STYLES.heading4}>
                    {value}
                  </BpkCheckboxCard.Label>
                </BpkCheckboxCard.Content>
              </BpkCheckboxCard.Root>
            </div>
          );
        })}
      </div>
      {selectedValue && (
        <BpkText textStyle={TEXT_STYLES.caption} tagName="p" style={{ textAlign: 'center' }}>
          You selected{' '}
          <BpkText textStyle={TEXT_STYLES.caption} tagName="strong" color={TEXT_COLORS.textHero}>
            {selectedValue}
          </BpkText>
          {' '}— click another card to change
        </BpkText>
      )}
    </div>
  );
}
