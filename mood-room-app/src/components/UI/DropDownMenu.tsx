"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import {Menu} from "lucide-react"

export default function DropDownMenu() {
  const { setTheme, theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);  
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);


  // Close dropdown if clicked outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

    // Only render on client and when theme is loaded
    if (!mounted || !theme) return null;


  //common classes for all dropdown items (Links and the theme button)
  const commonItemBaseClasses = "block px-4 m-1 py-2 text-left rounded-xl";
  const commonItemThemeClasses = theme === 'dark' 
    ? 'bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-300' 
    : 'bg-white text-black hover:bg-gray-100 border-gray-200';

  //classes for the dropdown container itself
  const dropdownContainerClasses = `
    absolute right-0 mt-2 w-48 h-80 rounded-xl shadow-lg z-50
    ${theme === 'dark' 
      ? 'bg-neutral-900 text-white border-neutral-600' 
      : 'bg-white text-black border-white'}
    border border-gray-200
  `.replace(/\s+/g, ' ').trim(); 

  return (
    <div className="absolute right-0 z-50 inline-block" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-black'} transition-colours"
      >
        <Menu className="w-6 h-6" />
      </button>
      {open && (
        <div className={dropdownContainerClasses}>
          <p className="text-center m-2 ">Menu</p>
          <ul>
            <li>
              <Link onClick={() => setOpen(false)} className={`${commonItemBaseClasses} ${commonItemThemeClasses}`} href="/">Home</Link>
            </li>
            <li>
              <Link onClick={() => setOpen(false)} className={`${commonItemBaseClasses} ${commonItemThemeClasses}`} href="/generation">Generate</Link>
            </li>
            <li>
              <Link onClick={() => setOpen(false)} className={`${commonItemBaseClasses} ${commonItemThemeClasses}`} href="/MyCreation">My Creation</Link>
            </li>
            <li>
              <Link onClick={() => setOpen(false)} className={`${commonItemBaseClasses} ${commonItemThemeClasses}`} href="/Settings">Settings</Link>
            </li>
            <li>
              <Link onClick={() => setOpen(false)} className={`${commonItemBaseClasses} ${commonItemThemeClasses}`} href="/Logout">Logout</Link>
            </li>
            <li>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`${commonItemBaseClasses} ${commonItemThemeClasses} w-46`}
              >
                <p className="text-left">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </p>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}