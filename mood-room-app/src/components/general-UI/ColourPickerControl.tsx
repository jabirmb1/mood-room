import React, { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { convertValidColourToHex } from '@/utils/general/colours';// converts e.g. rgb, colour names etc into their hex values

/*********This component is just a react hex colour picker and also a text input which shows current colour*****/
interface ColourPickerControlProps {
  value: string;// current colour
  showCloseButton?: boolean;// if we want to show a close button or not
  colourText?: String// text beside the current colour input field e.g. 'current text is: '
  onChange: (colour: string) => void;// what to do when the colour changes
  onClose?: () => void;// optional function to run when panel closes
}

export function ColourPickerControl({ value, showCloseButton = true, colourText = "current colour", onChange, onClose }: ColourPickerControlProps) {
  const [input, setInput] = useState(value ?? '');

  // Keep input in sync when external value changes
  useEffect(() => {
    setInput(value ?? '');
  }, [value]);

  // Debounce input field only
  useEffect(() => {
    const timeout = setTimeout(() => {
      const validHex = convertValidColourToHex(input);
      if (validHex !== '') {
        onChange(validHex);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [input]);
  

  return (
    <div className="space-y-2">
      <div className="colour-picker-wrapper">
        <HexColorPicker
          color={convertValidColourToHex(value)}// we want input text field to also be able to change hex colour picker as we;;
          onChange={(newColour) => {
            setInput(newColour);     
            onChange(newColour);     
          }}
        />
      </div>

      <div className = "flex gap-2 justify-center items-center text-1g p-1 mt-4">
            <label htmlFor='colour-input'>{colourText}</label>
            <input
                type="text"
                id = 'colour-input'
                className="border rounded text-center text-sm p-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
      </div>

      {showCloseButton && onClose && (
        <button
          type="button"
          className="text-xs text-blue-600 underline"
          onClick={onClose}
        >
        Close Colour Picker
        </button>
      )}
    </div>
  );
}
