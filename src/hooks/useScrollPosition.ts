import { useState, useEffect, useRef } from "react";

export const useScrollPosition = () => {
  const [isSticky, setIsSticky] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (searchRef.current) {
        const searchRect = searchRef.current.getBoundingClientRect();
        const headerHeight = 88; // Height of the mobile header

        // Check if search box has reached the top (accounting for header)
        if (searchRect.top <= headerHeight && !isSticky) {
          setIsSticky(true);
        } else if (window.scrollY < 100 && isSticky) {
          // Return to normal when scrolled back near top
          setIsSticky(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSticky]);

  return { isSticky, searchRef, categoriesRef };
};
