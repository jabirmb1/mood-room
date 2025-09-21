// components/LightingButton.tsx
import { useTheme } from 'next-themes';
import { LightingConfig, LightingPanel } from './LightingPanel';
import { Sun } from 'lucide-react';
import { darkTheme, lightTheme } from '@/utils/UI/const';

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
  const {theme} = useTheme();
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
                <aside className={`${theme === 'dark'?darkTheme: lightTheme } absolute right-0 mt-2 
                lg:w-100 w-64 p-4 rounded shadow-lg z-20 max-h-[50vh] overflow-y-auto`}>
                <LightingPanel config={config} onChange={onChange} />
                </aside>
            )}
        </div>
  );
}
