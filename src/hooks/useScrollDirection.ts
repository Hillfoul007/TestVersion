import { useState, useEffect } from "react";

type ScrollDirection = "up" | "down";

interface UseScrollDirectionOptions {
  threshold?: number;
}

export const useScrollDirection = (options: UseScrollDirectionOptions = {}) => {
  const { threshold = 10 } = options;
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("up");
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      const direction = scrollY > lastScrollY ? "down" : "up";
      const atTop = scrollY < threshold;

      if (
        direction !== scrollDirection &&
        (scrollY - lastScrollY > threshold ||
          scrollY - lastScrollY < -threshold)
      ) {
        setScrollDirection(direction);
      }

      setIsAtTop(atTop);
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollDirection, threshold]);

  return { scrollDirection, isAtTop };
};
