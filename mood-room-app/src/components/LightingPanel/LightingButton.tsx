// components/LightingButton.tsx
import { LightingConfig, LightingPanel } from './LightingPanel';
import { Sun } from 'lucide-react';

/*********** This component is just the lighting button which will show the lighting panel where user can
 * change canvas lighting if they wish.
 */
interface LightingButtonProps {
  show: boolean;
  toggle: () => void;
  config: LightingConfig;
  onChange: (config: LightingConfig) => void;
  className?: string
}

export function LightingButton({ show, toggle, config, onChange, className = '' }: LightingButtonProps) {
  return (
        <div className = {className}>
            <div className="flex gap-2">
                <button
                onClick={toggle}
                className={`px-4 py-2 rounded text-white hover:cursor-pointer ${
                    show ? 'bg-red-500' : 'bg-white rounded shadow-lg hover:shadow-xl transition-shadow'
                }`}
                >
                {show ? 'X' : <Sun className="w-5 h-5 text-yellow-600" />}
                </button>
            </div>
            {show && (
                <div className="absolute right-0 mt-2 w-96 bg-white p-4 rounded shadow-lg z-20 max-h-[50vh] overflow-y-auto">
                <LightingPanel config={config} onChange={onChange} />
                </div>
            )}
        </div>
  );
}
