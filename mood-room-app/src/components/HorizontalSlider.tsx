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

  // Custom colors (Tailwind classes or full classNames)
  trackColor?: string;         // background of the track
  thumbColor?: string;         // slider "thumb" / handle
  labelColor?: string;         // "Rotate", "Scale", etc.
  rangeLabelColor?: string;    // -180 / 180 text
  valueTextColor?: string;     // Current: 90°
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
  trackColor = 'bg-black',
  thumbColor = 'accent-white-700',
  labelColor = 'text-gray-700',
  rangeLabelColor = 'text-gray-500',
  valueTextColor = 'text-gray-600',
}: HorizontalSliderProps) {
  return (
    <div>
      <label className={`block mb-2 text-xl font-medium ${labelColor}`}>
        {label}
      </label>
      <div className="flex items-center gap-4 w-full">
        <span className={`text-sm ${rangeLabelColor}`}>{min}{unit}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          className={`w-full h-6 rounded-lg appearance-none cursor-pointer ${trackColor} ${thumbColor}`}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className={`text-sm ${rangeLabelColor}`}>{max}{unit}</span>
      </div>
      {showValue && (
        <div className={`mt-2 text-center text-sm mb-2 ${valueTextColor}`}>
          Current: {value.toFixed(1)}{unit}
        </div>
      )}
    </div>
  );
}
