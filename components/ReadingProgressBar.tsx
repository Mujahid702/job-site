"use client";

import { useEffect, useState } from "react";

export default function ReadingProgressBar() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setWidth(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 h-1 bg-blue-600 z-[70] transition-all duration-100 ease-out" 
      style={{ width: `${width}%` }} 
    />
  );
}
