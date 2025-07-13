'use client'

// This component is a colour button used as part of the colour wheel for the editor panel.
import {useEffect, useRef} from 'react';
import { MaterialColourType } from '@/types/types';

type ColourButtonProps = {
  type: MaterialColourType ;// if the button relates to the primary, secondary or tertary part of model.
  isActive: boolean;// enabled/ disabled.
  isAvailable: boolean;// if the model has e.g. a tertairy part to change colour with (and this button is a teriarty type.)
  colour: string;// what colour to display.
  onClick: () => void;// function to run when this button is clicked.
};

export function ColourButton({ type, isActive, isAvailable, colour, onClick } : ColourButtonProps){
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Dynamically apply backgroundcolour via js (work around to not use inline styles for the colour)
    useEffect(() => {
      if (buttonRef.current) {
        buttonRef.current.style.backgroundColor = isAvailable ? colour : 'grey';
      }
    }, [colour, isAvailable]);
  
    return (
    <div className="flex flex-col items-center text-center">
      <button
        ref = {buttonRef}
        className={`
          w-8 h-8 rounded border transition-all relative
          ${isActive ? 'ring-2 ring-black' : 'border-none'}
          ${!isAvailable ? 'opacity-50 cursor-not-allowed ring-2 ring-red-500' : ''}
        `}
        onClick={onClick}
        disabled={!isAvailable}
      >
        {/* if it is not available then we draw a little cross at the middle of it */}
        {!isAvailable && (
          <>
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 -rotate-45 origin-center pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 rotate-45 origin-center pointer-events-none" />
          </>
        )}
      </button>
      <span className="mt-1 text-xs capitalize">{type}</span>
    </div>
  );
};

export default ColourButton;
