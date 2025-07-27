
'use client';

import { Courier_Prime } from 'next/font/google';
import { useRef, useState, useEffect } from 'react';
import { Send } from 'lucide-react';

const courierNewFont = Courier_Prime({  //font for the object name
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-courierNew',
})

export default function GenerationPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false)
  
    useEffect(() => {
      setMounted(true)
    }, [])
  
    if (!mounted) return null 

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scrollHeight
    }
  };

  return (
    <div className="flex items-center justify-center your-element w-full h-[90vh]">
      <section className="flex flex-col items-center w-full max-w-2xl ">
        <div className="text-center text-white">
          <h1 className={`${courierNewFont.className} md:text-4xl text-2xl`}>
            How do you feel today?
          </h1>
        </div>

        <div className="w-full max-w-2xl mt-10 flex flex-col items-center">
          <p className="md:text-sm  text-[12px] text-center font-bold text-white">
            Write a sentence about how you feel or how your day went?
          </p>

          <div className="flex items-end p-2 mt-3 border border-gray-200 rounded-lg shadow-sm w-full">
            <textarea
              id="input-user"
              ref={textareaRef}
              placeholder="Enter your message..."
              className="flex-1 resize-none overflow-hidden min-h-[2.5rem] max-h-[10rem] text-white p-2 placeholder-gray-600 focus:outline-none border-transparent rounded-md"
              rows={1}
              onInput={handleInput}
            ></textarea>
            <button className="ml-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>

  );
}
