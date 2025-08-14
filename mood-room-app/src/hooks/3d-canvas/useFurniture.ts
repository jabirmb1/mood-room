import { useState, useEffect } from "react";    
import { v4 as uuidv4 } from 'uuid';

interface FurnitureItem {
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
    // category For filtering later if want to add
}

export function useFurniture() {
    const [models, setModels] = useState<FurnitureItem[]>(() => {
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('furnitureModels');
            return saved ? JSON.parse(saved) : [];
          }
          return [];
        });
      
        useEffect(() => {
          localStorage.setItem('furnitureModels', JSON.stringify(models));
        }, [models]);
      
        const addModel = (model: Omit<FurnitureItem, 'id'>) => {
          const newModel = {
            ...model,
            id: uuidv4(),
          };
          setModels(prev => [...prev, newModel]);
          return newModel;
        };
      
        return { models, setModels, addModel };
}




