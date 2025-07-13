// adding new furniture tab
'use client';

import { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { FurnitureCategory } from './FurnitureCategory';
import { ModelThumbnail } from "./ModelThumbnail";


// used to define shape and properties of furniture
export interface ModelItem {
  id: string;
  name: string;
  path: string;
  thumbnail: string;
  position: [number, number, number];
  category?: string;
  url?: string;
}


interface AddModelTabProps {
  onAddModel: (model: Omit<ModelItem, 'position'>) => void;
}

// displays models in a grid with search and category filters
export function AddModelTab({ onAddModel }: AddModelTabProps) {
  const [modelItems, setModelItems] = useState<ModelItem[]>([]); // all models
  const [searchValue, setSearchValue] = useState<string>(''); // search value
  const [filteredItems, setFilteredItems] = useState<ModelItem[]>([]); // filtered models
  const [activeCategory, setActiveCategory] = useState<string>('all'); // active category
  const [hoveredModel, setHoveredModel] = useState<string | null>(null); // hovered model


  // Fetch manifest for assets
  useEffect(() => {
    fetch('/assetsManifest.json')
      .then(res => res.json())
      .then((data) => {
        // Map manifest items to ModelItem format
        const items: ModelItem[] = data.map((item: any, idx: number) => ({
          id: `${item.category || 'asset'}-${item.name || idx}`,
          name: item.name,
          path: item.path, // path from manifest
          thumbnail: item.thumbnail, // thumbnail path from manifest
          category: item.category || ['All'],
          url: item.path || '',
          }));
        setModelItems(items);
        setFilteredItems(items);
      });
  }, []);


  // Filter items when search/category changes
  useEffect(() => {
    let filtered = modelItems;
    if (activeCategory.toLowerCase() !== 'all') {
      filtered = filtered.filter(item => {
        const itemCategories = Array.isArray(item.category) ? item.category : [item.category || 'All'];
        return itemCategories.includes(activeCategory);
      });
    }
    if (searchValue) {
      filtered = filtered.filter(item => item.name.toLowerCase().includes(searchValue.toLowerCase()));
    }
    setFilteredItems(filtered);
  }, [searchValue, activeCategory, modelItems]);

  return (
    <section className="flex flex-col rounded-lg h-[65vh]"> {/* h can be chamngerd depending on the canvas*/}
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
        items={modelItems}
        searchValue={searchValue}
        onSelect={(filtered, category) => {
          setFilteredItems(filtered);
          setActiveCategory(category);
        }}
      />

      {/* Filter items based on search */}
      <div className="flex-1 overflow-y-auto p-2 ">
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
                  const { position, ...modelData } = item;
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
                {/* thumbnail */}
                  <div className="aspect-square relative ">
                  <ModelThumbnail
                   path={item.path} 
                   name={item.name} 
                   thumbnail={item.thumbnail} 
                   hoveredModel={hoveredModel }
                   setHoveredModel={setHoveredModel}/>
                  </div>

                {/* name */}
                  <div className="p-2">
                    <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                  </div>
                </motion.div>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
