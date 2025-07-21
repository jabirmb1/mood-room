// componet that will display the 3d model in my creation
// like a polaroid photo
//
'use client';
import { motion } from "framer-motion";
import {Heart} from 'lucide-react';
import { useTheme } from "next-themes";
import { useState, useEffect } from 'react';
import { Courier_Prime } from 'next/font/google';

const courierNewFont = Courier_Prime({  //font for the object name
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-courierNew',
})

interface PolaroidCanvasBoxProps {
    onCanvasClick: () => void; 
}

export default function PolaroidCanvasBox({ onCanvasClick }: PolaroidCanvasBoxProps){
    const { theme } = useTheme();
    const [isLiked, setIsLiked] = useState(false);
    
    const handleHeartClick = () => {
        setIsLiked(prevIsLiked => !prevIsLiked); // Toggles the state
    };
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])
    
    if (!mounted) return null // only render on client and when theme is loaded not to get hydration errors
    return(
        <motion.div                
            key={theme}
            className="group w-80 h-100 shadow-md"                
            whileHover={{                   
                y: -5,                   
                scale: 1.02,                   
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'                 
            }}                 
            transition={{                   
                type: 'spring',                   
                stiffness: 300,                   
                damping: 10                 
            }}              
            >             
            <div 
            className={`flex flex-col gap-2 border border-black ${theme === 'dark' ? 'border-white bg-amber-50' : 'border-black bg-amber-50'} w-80 h-100 relative overflow-hidden rounded-sm`}
            onClick={onCanvasClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                onCanvasClick();
                }
            }}
            >
                {/* Polaroid surface effect */}
                <div className="absolute inset-0 pointer-events-none polaroid-surface" />
                
                {/* Corner glint */}
                <div className="absolute top-2 right-2 w-8 h-8 pointer-events-none rounded-full polaroid-glint" />
                
                {/* Texture overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-20 polaroid-texture" />
                
                <section className="flex-3 border-2 border-black m-3 relative z-10 bg-white rounded-sm overflow-hidden">
                {/* Canvas area with reflection */}
                <div className="relative h-full">
                    <p className="relative z-10">Canvas</p>
                    {/* Canvas reflection effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-30 polaroid-reflection" />
                </div>
                </section>
                
                {/* Controls and buttons */}
                <section className="flex flex-row gap-2 mb-2 relative z-10">
                <div className="flex-1 justify-center text-center">
                    <button
                    className="cursor-pointer hover:scale-110 transition-transform"
                    onClick={handleHeartClick}>
                    <Heart className={`h-10 w-10 text-red-500 m-1 ${isLiked ? 'fill-red-500' : 'fill-transparent'}`}/>
                    </button>
                </div>
                <div className="flex-2 flex flex-col gap-2 justify-center text-center">
                    <div className="flex-1">
                    <p className={`${courierNewFont.className} text-black`}>No1. Room Name</p>
                    </div>
                    <div className="flex-1">
                    <button className="border border-black rounded-2xl w-24 cursor-pointer hover:bg-gray-200 bg-white text-black bg-opacity-80 backdrop-blur-sm transition-all">
                        Share
                    </button>
                    </div>
                </div>
                </section>
            </div>         
        </motion.div>
    )
}