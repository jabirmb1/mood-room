
"use client"
import { darkTheme, lightTheme } from "@/utils/UI/const";
import { useTheme } from "next-themes";
import { useState, useEffect } from 'react';
export default function Footer() {
    const { theme } = useTheme();
     const [mounted, setMounted] = useState(false)
    
        useEffect(() => {
          setMounted(true)
        }, [])
      
        if (!mounted) return null
    return (
    <footer
    key={theme}
     className={`w-full border-t border-gray-200 py-6 ${theme === 'dark' ? darkTheme : lightTheme}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>© 2025 MoodRoom. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}