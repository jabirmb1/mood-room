// Home page
// has create room button, 3d model e.g and social media feed
"use client"
import { Sour_Gummy } from 'next/font/google'; // Import the Chewy font
import { useTheme } from "next-themes";
import { useState, useEffect } from 'react';
import { darkTheme, lightTheme } from "@/utils/UI/const";
import Link from 'next/link';
// Configure the font loader
const sourgumFont = Sour_Gummy({
  weight: '400', // Specify the weight you need (e.g., '400' for regular)
  subsets: ['latin'], // Specify subsets to optimize loading
  display: 'swap', // 'swap' ensures text is visible while font loads
});

export default function Home() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false)
        useEffect(() => {
          setMounted(true)
        }, [])
      
        if (!mounted) return null
  return (
    <div>
      <section id="Example canvas" className="md:w-full md:h-[70vh] w-full h-[60vh] flex flex-col items-center justify-center border border-black">
      {/* Content goes here */}
      </section>
      
      <div className="flex justify-center mt-4 mb-4">
      <Link
      className={`${sourgumFont.className} md:text-[40px] text-[20px] px-8 py-4 rounded-lg border-5 
      border-green-500 ${theme === 'dark' ? darkTheme : lightTheme} cursor-pointer `}
      href={'/RoomCreationOption'}
      >
        CREATE ROOM
      </Link>
      </div>

    </div>
  );
}
  