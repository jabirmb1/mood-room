'use client';

import { motion } from 'framer-motion';
import { ModelThumbnail } from './ModelThumbnail';
import { ModelItem } from './AddModelTab';
import { useState } from 'react';

interface ModelCardProps {
  item: ModelItem;
  hoveredModel: string | null;
  setHoveredModel: (id: string | null) => void;
  onClick: (item: ModelItem) => void;
}

export function ModelCard({ item, hoveredModel, setHoveredModel, onClick }: ModelCardProps) {
    const [isVisible, setIsVisible] = useState(true);

    // If model failed to load, don't render the card
    if (!isVisible) return null;

    return (
        <motion.div
        key={item.id}
        onClick={() => onClick(item)}
        className="group cursor-pointer rounded-lg overflow-hidden shadow-md"
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
        <div className="aspect-square relative">
            <ModelThumbnail
            path={item.path}
            name={item.name}
            thumbnail={item.thumbnail}
            hoveredModel={hoveredModel}
            setHoveredModel={setHoveredModel}
            onError={() => setIsVisible(false)} // hide card if thumbnail fails
            />
        </div>

        {/* name */}
        <div className="p-2">
            <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
        </div>
        </motion.div>
    );
}
