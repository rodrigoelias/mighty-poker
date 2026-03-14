import React from 'react';

interface Props {
  deck: string[];
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
}

export function CardDeck({ deck, selectedValue, disabled, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">
        Choose your estimate
      </h2>
      <div className="flex flex-wrap gap-3 justify-center">
        {deck.map((value) => {
          const isSelected = selectedValue === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`
                w-14 h-20 rounded-xl text-lg font-bold transition-all duration-150 select-none
                focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-lg scale-105 -translate-y-1'
                    : disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-800 border-2 border-gray-200 hover:border-violet-400 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                }
              `}
            >
              {value}
            </button>
          );
        })}
      </div>
      {selectedValue && (
        <p className="text-center text-sm text-gray-500">
          You selected <strong className="text-violet-700">{selectedValue}</strong> — click another card to change
        </p>
      )}
    </div>
  );
}
