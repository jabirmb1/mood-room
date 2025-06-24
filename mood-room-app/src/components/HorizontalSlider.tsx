'use client';

// This component is a generalised horizontal slider component so that we can easily create sliders.
type HorizontalSliderProps = {
  label?: string;// label/ title of slider
  value: number;// current value that it start as
  onChange: (value: number) => void;// what happens when value changes.
  min: number;// min value
  max: number;// max value
  step?: number;// each step
  unit?: string;// e.g. degrees, cm, m
  showValue?: boolean;// if we want to show value or not

  // Custom colours (Tailwind classes or full classNames)
  trackcolour?: string;         // background of the track
  thumbcolour?: string;         // slider "thumb" / handle
  labelcolour?: string;         // "Rotate", "Scale", etc.
  rangeLabelcolour?: string;    // -180 / 180 text
  valueTextcolour?: string;     // Current: 90°
};

export function HorizontalSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,// some default values in case props are not passed in.
  unit = '',
  showValue = true,
  trackcolour = 'bg-black',
  thumbcolour = 'accent-white-700',
  labelcolour = 'text-gray-700',
  rangeLabelcolour = 'text-gray-500',
  valueTextcolour = 'text-gray-600',
}: HorizontalSliderProps) {
  return (
    <div>
      <label className={`block mb-2 text-xl font-medium ${labelcolour}`}>
        {label}
      </label>
      <div className="flex items-center gap-4 w-full">
        <span className={`text-sm ${rangeLabelcolour}`}>{min}{unit}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          className={`w-full h-6 rounded-lg appearance-none cursor-pointer ${trackcolour} ${thumbcolour}`}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className={`text-sm ${rangeLabelcolour}`}>{max}{unit}</span>
      </div>
      {showValue && (
        <div className={`mt-2 text-center text-sm mb-2 ${valueTextcolour}`}>
          Current: {value.toFixed(1)}{unit}
        </div>
      )}
    </div>
  );
}
