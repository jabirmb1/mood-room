'use client'

type RotatingSliderProps = {
  rotation: number;// how much the current rotation is.
  setRotation: (value: number) => void;// function to change the current rotation
};

export function RotatingSlider({ rotation, setRotation }: RotatingSliderProps) {
  return (
    <div>
      <label className="block mb-2 text-xl font-medium text-gray-700">
        Rotate
      </label>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">-180°</span>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          className="w-full h-6 bg-black rounded-lg appearance-none accent-yellow-500 cursor-pointer"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
        />
        <span className="text-sm text-gray-500">180°</span>
      </div>
      <div className="mt-2 text-center text-sm text-gray-600 mb-2">
        Current: {rotation.toFixed(1)}°{/* show one decimal place */}
      </div>
    </div>
  );
}
