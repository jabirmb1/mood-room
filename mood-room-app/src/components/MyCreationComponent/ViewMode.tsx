// page that will display the 3d model in my creation when clicked on the polaroid
//


'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ViewModeProps {
    onClose: () => void;
}

export default function ViewMode({ onClose }: ViewModeProps){
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false)
        
        useEffect(() => {
            setMounted(true)
        }, [])
        
        if (!mounted) return null 
    
        
    return(
        <div className={`flex flex-col rounded-2xl max-w-screen-md w-full h-150 mx-auto p-4 ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'}`}>

        <motion.div // Using motion.div from framer-motion (assuming it's imported correctly)
                // Add Tailwind classes for the box's appearance and size
                className="p-6 rounded-lg shadow-lg relative w-full h-150"
                initial={{ opacity: 0, scale: 0.9 }} // Initial animation state
                animate={{ opacity: 1, scale: 1 }}   // Animation when it appears
                exit={{ opacity: 0, scale: 0.9 }}    // Animation when it disappears (requires AnimatePresence from framer-motion in parent)
                transition={{ duration: 0.2 }}
            >
            <section className="flex-2 h-120">
                <div className="border border-black mx-auto h-120 w-full">
                    <p>Canvas</p>
                </div>
            </section>

            <section className="flex-1">
                <div className="w-90vw mx-auto flex gap-2">
                    <button 
                        className={`border border-black rounded-md w-24 cursor-pointer hover:bg-gray-200 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} bg-opacity-80 backdrop-blur-sm transition-all`}
                        >
                        Edit
                    </button>
                    <button 
                        className={`border border-black rounded-md w-24 cursor-pointer hover:bg-gray-200 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} bg-opacity-80 backdrop-blur-sm transition-all`}
                        >
                        Delete
                    </button>
                    <button 
                        className="border border-black rounded-md w-24 cursor-pointer bg-red-500 text-white backdrop-blur-sm transition-all"
                        onClick={onClose}
                        >
                        Close
                    </button>
                </div>
            </section>
            
        </motion.div>
        </div>
    )
}