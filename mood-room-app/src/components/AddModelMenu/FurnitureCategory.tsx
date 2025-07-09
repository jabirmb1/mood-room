import React, { useState, useEffect } from 'react';
import { ModelItem } from './AddModelTab';
import { ChevronDown } from 'lucide-react';


interface FurnitureCategoryProps {
  items: ModelItem[];
  searchValue: string;
  onSelect: (filtered: ModelItem[], category: string) => void;
}
// 3 categories, objects will be in correspomnding folder in public/assets/Categories
const CATEGORIES = [
  { key: 'All', label: 'All' },
  { key: 'Furniture', label: 'Furniture' },
  { key: 'Wallart', label: 'Wall Art' },
  { key: 'Lights', label: 'Lights' },
  { key: 'Decor', label: 'Decor' }
];


export function FurnitureCategory({ items, searchValue, onSelect }: FurnitureCategoryProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = React.useRef<HTMLDivElement>(null); // why we need it? because we need to close the dropdown when we click outside of it


  // Filtering logic - handles both string and array categories
  const filteredItems = items.filter(item => {
    const itemCategories = Array.isArray(item.category) ? item.category : [item.category || 'All'];
    const matchesCategory = activeCategory === 'All' || itemCategories.includes(activeCategory);
    const matchesSearch = !searchValue.trim() || item.name.toLowerCase().includes(searchValue.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  // update the parent component with the filtered items
  useEffect(() => {
    onSelect(filteredItems, activeCategory);
    // eslint-disable-next-line
  }, [filteredItems.length, activeCategory, searchValue]);


  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);


  return (
    <div className="flex flex-col items-center justify-center mb-4 mt-2 gap-2">
        <div className="relative inline-block text-center" ref={menuRef}>
            <button
                type="button"
                className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer "
                id="menu-button"
                aria-expanded={menuOpen}
                aria-haspopup="true"
                onClick={() => setMenuOpen(open => !open)}
            >
                {activeCategory} <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
            </button>
          {menuOpen && (
            <div
              className="origin-top-right absolute mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
              tabIndex={-1}
            >
              <ul className="py-1">
                {CATEGORIES.map(cat => (
                  <li key={cat.key}>
                    <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm ${
                        activeCategory === cat.key ? 'bg-blue-500 text-white cursor-pointer' : 'text-gray-700 cursor-pointer'
                    }`}
                    role="menuitem"
                    onClick={() => {
                        setActiveCategory(cat.key);
                        setMenuOpen(false);
                    }}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
    </div>
  );
}


