// adding new furniture tab
'use client';

import { useState, useEffect } from "react";
import { ModelCategory } from './ModelCategory';
import { ModelCard } from "./ModelCard";


// used to define shape and properties of models.
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
      <ModelCategory
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
              <ModelCard
              key={item.id}
              item={item}
              hoveredModel={hoveredModel}
              setHoveredModel={setHoveredModel}
              onClick={(clickedItem) => {
                const { position, ...modelData } = clickedItem;
                onAddModel(modelData);
              }}
            />
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
