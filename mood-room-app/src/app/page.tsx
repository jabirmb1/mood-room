// Home page
// has generate button, 3d model e.g and social media feed
"use client"

import { useRouter } from "next/navigation";
import { Sour_Gummy } from 'next/font/google'; // Import the Chewy font
import { useTheme } from "next-themes";
import { useState, useEffect } from 'react';
import { darkTheme, darkThemeBackground, darkThemeText, lightTheme } from "@/utils/UI/const";
// Configure the font loader
const sourgumFont = Sour_Gummy({
  weight: '400', // Specify the weight you need (e.g., '400' for regular)
  subsets: ['latin'], // Specify subsets to optimize loading
  display: 'swap', // 'swap' ensures text is visible while font loads
});

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false)
        useEffect(() => {
          setMounted(true)
        }, [])
      
        if (!mounted) return null
  const handleGenerateRoomClick = () => {
    router.push('/generation'); 
  };
  return (
    <div>
      <section id="Example canvas" className="md:w-full md:h-[70vh] w-full h-[60vh] flex flex-col items-center justify-center border border-black">
      {/* Content goes here */}
      </section>
      
      <div className="flex justify-center mt-4 mb-4">
      <button 
      className={`${sourgumFont.className} md:text-[40px] text-[20px] px-8 py-4 rounded-lg border-5 border-green-500 ${theme === 'dark' ? darkTheme : lightTheme} cursor-pointer `}
      onClick={handleGenerateRoomClick}
      >
      GENERATE ROOM
      </button>
      </div>

    </div>
  );
}
  