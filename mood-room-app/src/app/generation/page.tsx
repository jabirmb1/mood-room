
'use client';

import { AddFurnitureTab } from '@/components/AddFurnitureTab';
import { useState } from 'react';

export default function GenerationPage() {
  const [showFurnitureTab, setShowFurnitureTab] = useState(false);
  const handleAddFurniture = (model: any) => {
    console.log('Adding furniture:', model);
    // Add your logic to handle adding furniture here
  };

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Room Editor</h1>
      <div className="max-w-md mx-auto">
          <button
          onClick={() => setShowFurnitureTab(!showFurnitureTab)}
          className={`${showFurnitureTab ? 'px-4 py-2 bg-red-500 rounded text-white mb-2 hover:cursor-pointer' : 'px-4 py-2 bg-green-500 rounded text-white mb-2 hover:cursor-pointer'}`}
          >
            {showFurnitureTab ? 'X' : 'Add'}
          </button>

          {showFurnitureTab && <AddFurnitureTab onAddFurniture={handleAddFurniture} />}
      </div>
    </div>
  );
}
