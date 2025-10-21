/* A generic progress bar */
import * as Progress from '@radix-ui/react-progress';

type ProgressBarProps={
    progress: number;// progress value between 0 and 100
    label?: string;// optional label to show above progress bar
    labelPosition?: 'top' | 'bottom';// position of label
    labelFontSize?: string;// tailwind font size class e.g. text-sm, text-lg
    labelAlign?: 'left' | 'center' | 'right';// alignment of label text
    width?: string;// tailwind width class e.g. w-full, w-1/2
    height?: string;// tailwind height class e.g. h-4, h

}

//TO DO: add theme colours
//
export function ProgressBar({ progress, label, labelPosition= 'bottom', labelFontSize = "text-base", 
    labelAlign='center', width="w-full", height="h-3" }: ProgressBarProps) {

    return(
    <>
        <div className="w-full flex flex-col justify-center">

        {/* depending on passed in label position; show label at top or bottom of progress bar */}
        
        {label && labelPosition === 'top' && 
        <span className={`text-white mb-1 ${labelFontSize} text-${labelAlign}`}>{label}</span>
        }

        <Progress.Root
            className={`${width} ${height} relative overflow-hidden rounded-full bg-gray-700`}
            value={progress} max={100}
        >
            <Progress.Indicator
            className="h-full w-full bg-white transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${100 - progress}%)` }}
            />
        </Progress.Root>

        {label && labelPosition === 'bottom' && 
        <span className={`text-white mt-1 ${labelFontSize} text-${labelAlign}`}>{label}</span>
        }

        </div>
    </>
    )
}
