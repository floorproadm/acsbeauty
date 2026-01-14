import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Use useLayoutEffect for synchronous scroll before paint
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useIsomorphicLayoutEffect(() => {
    // Scroll immediately before browser paints
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
