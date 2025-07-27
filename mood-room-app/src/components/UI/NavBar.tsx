"use client"

import Link from 'next/link';
import DropDownMenu from './DropDownMenu';
import ThemeToggle from './ThemeToggle';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function NavBar() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])
  
    if (!mounted) return null
  

    return (
    <nav 
    key={theme}
    className={`w-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} border-b border-gray-200 relative h-16`}>
    {/* Centered nav links */}
    <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <ul className="flex space-x-8 text-base font-large">
            <li>
                <Link href="/" className="transition-colours hover:text-[grey]">Home</Link>
            </li>
            <li>
                <Link href="/generation" className="transition-colours hover:text-[grey]">Generate</Link>
            </li>
        </ul>
    </div>

    {/* Right-aligned Login */}
    <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-5">
        <div className="hidden md:block items-center pt-2">
            <ThemeToggle />
        </div>
        <Link
            href="/login"
            className="px-4 py-2 border border-gray-300 rounded-md font-medium transition-colours hover:text-[grey] hover:border-[#7FD0BD]"
        >
            Login
        </Link>
    </div>
            {/* more logic for the drop down menu neede for loging out  and interchanging */}
    <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-5 z-75">
    <DropDownMenu />
    </div>
</nav>

  );
}
