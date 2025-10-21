'use client';

import { motion } from 'framer-motion';
import { ModelThumbnail } from './ModelThumbnail';
import { ModelItem } from './AddModelTab';
import {useState } from 'react';
import { useTheme } from 'next-themes';
import {darkThemeBackgroundSecondary, darkThemeSecondaryText, lightThemeBackground, lightThemeSecondaryText } from '@/utils/UI/const';

interface ModelCardProps {
  item: ModelItem;
  hoveredModel: string | null;
  setHoveredModel: (id: string | null) => void;
  onClick: (item: ModelItem) => void;
}

export function ModelCard({ item, hoveredModel, setHoveredModel, onClick }: ModelCardProps) {
    const [isVisible, setIsVisible] = useState(true);
    const {theme} = useTheme();

    // If model failed to load, don't render the card
    if (!isVisible) return null;

    //TO DO: SWAP THIS OUT WITH BUTTONS!!!
    return (
        <motion.button
        key={item.id}
        onClick={() => onClick(item)}
        className={`group cursor-pointer rounded-lg overflow-hidden shadow-md 
            ${theme === 'dark' ? darkThemeBackgroundSecondary : lightThemeBackground}`}
        whileHover={{
            y: -5,
            scale: 1.02,
            boxShadow:
            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}
        transition={{
            type: 'spring',
            stiffness: 300,
            damping: 10,
        }}
        >
        {/* thumbnail */}
        <span className="block aspect-square relative w-full relative">
            <ModelThumbnail
            path={item.path}
            name={item.name}
            thumbnail={item.thumbnail}
            hoveredModel={hoveredModel}
            setHoveredModel={setHoveredModel}
            onError={() => setIsVisible(false)} // hide card if thumbnail fails
            />
        </span>

        {/* name */}
        <span className='p-2'
        >
            <span className={`${theme === 'dark'? darkThemeSecondaryText: lightThemeSecondaryText} 
            text-sm font-medium block`}>
                {item.name}</span>
        </span>
        </motion.button>
    );
}
