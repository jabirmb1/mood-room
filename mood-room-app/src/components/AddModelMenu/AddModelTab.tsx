// adding new furniture tab

'use client';
import { useState } from "react";
import { motion } from 'framer-motion';
import { FurnitureCategory } from './FurnitureCategory';

// used to definbe shape and properties of furniture
export interface ModelItem {
  id: string;
  name: string; // add name aswell
  url: string;
  thumbnail: string; //need to create one for all funriture
  colourPalette: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  position: [number, number, number];
  category?: string;
}

interface AddModelTabProps {
  onAddModel: (model: Omit<ModelItem, 'thumbnail'>) => void;
}

//connect to DB later
const MODEL_ITEMS: ModelItem[] = [
  {
    id: '1',
    name: 'Modern Table',
    url: '/assets/NormTable.glb',
    thumbnail: 'assets/table.png',  // Changed to be relative to public folder
    colourPalette: {
      primary: '#3498db',
      secondary: '#2ecc71',
      tertiary: '#e74c3c'
    },
    position: [0, 0, 0],
    category: 'Furniture'
  },
  {
    id: '2',
    name: 'Lounge Chair',
    url: '/assets/armchair.glb',
    thumbnail: 'assets/armchair.png',  // Changed to be relative to public folder
    colourPalette: {
      primary: '#9b59b6',
      secondary: '#f1c40f',
      tertiary: '#1abc9c'
    },
    position: [0, 0, 0],
    category: 'Furniture'
  },
];

//console.log('Furniture items loaded:', MODEL_ITEMS); //remove later

export function AddModelTab({ onAddModel }: AddModelTabProps) {
  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<ModelItem[]>(MODEL_ITEMS);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  return (
    <section className="h-full flex flex-col rounded-lg h-[80vh]"> {/* h can be chamngerd depending on the canvas*/}
      <h1 className="text-xl font-bold text-center mb-3 mt-4">Add More Furniture</h1>

      {/*Search button by name*/}
      <input 
        type="text" 
        placeholder="Search furniture..." 
        className="w-full p-2 border rounded"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      
      {/* Category filter */}
      <FurnitureCategory
        items={MODEL_ITEMS}
        searchValue={searchValue}
        onSelect={(filtered, category) => {
          setFilteredItems(filtered);
          setActiveCategory(category);
        }}
      />

      {/* Filter items based on search */}
      <div className="flex-1 overflow-y-auto p-2">
        <ul className="grid grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <li className="col-span-2 text-center py-8 text-gray-500">
              No furniture found matching "{searchValue} {activeCategory}"
            </li>
          ) : (
            filteredItems.map((item) => (
              <motion.div 
                key={item.id}
                onClick={() => {
                  // Only pass the necessary data to the parent
                  const { thumbnail, ...modelData } = item;
                  onAddModel(modelData);
                }}
                className="group cursor-pointer rounded-lg overflow-hidden shadow-md"
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
                <figure className="aspect-square bg-gray-100 relative"> {/* thumbnail */}
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback in case thumbnail fails to load
                      (e.target as HTMLImageElement).src = '/placeholder-thumbnail.png';
                    }}
                  />
                  {/* name */}
                  <figcaption className="font-medium p-3 text-sm truncate">{item.name}</figcaption>
                </figure>
              </motion.div>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}