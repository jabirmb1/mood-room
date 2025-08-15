// This hook is used to keep track of the width of the window/ screen and check if it fits a desktop or phone.
import { useState, useEffect } from 'react';

export function useDevice() {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1024);
      setIsPhone(width <= 768);
    };

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return { isDesktop, isPhone };
}
