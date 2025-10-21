import { RotateCcw } from "lucide-react";

type ErrorButtonProps={
    type: 'Retry'// what type it is for now we only have the retry part (will affect what icon that we show.)
    text?: string// optional/ additional text of button
    disabled?: boolean;//whether it is disabled or not
    onClick?: ()=>any;// what to do when button is clicked.
    width?: number;// tailwind css number
    height?: number;// tailwind css number
}

export  function ErrorButton({type,text = '', disabled = false, onClick, height = 4, width = 4} : ErrorButtonProps){
    return(
        <button 
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-1 ml-2 p-2 bg-red-500 text-white rounded-lg 
        hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        disabled:opacity-70 disabled:bg-red-400 w-${width} h-${height}`}
         >
            <RotateCcw /> {text}
        </button>
    )

}