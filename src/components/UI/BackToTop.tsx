import React, { useEffect, useState, useCallback, useRef } from "react";
import { ArrowUpIcon } from "@heroicons/react/24/outline";

interface BackToTopProps {
  threshold?: number;
  className?: string;
}

export const BackToTop: React.FC<BackToTopProps> = ({
  threshold = 250,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);

  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) {
      setProgress(0);
      setVisible(false);
      return;
    }

    const currentProgress = Math.min(1, Math.max(0, scrollTop / maxScroll));
    setProgress(currentProgress);
    setVisible(scrollTop > threshold);
  }, [threshold]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        rafId.current = window.requestAnimationFrame(() => {
          calculateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    calculateProgress();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
    };
  }, [calculateProgress]);

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  // SVG circular geometry
  const size = 48;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="العودة إلى أعلى الصفحة"
      title="العودة إلى أعلى الصفحة"
      className={`fixed bottom-6 left-4 sm:left-6 z-40 group flex items-center justify-center w-12 h-12 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 shadow-lg shadow-slate-900/10 dark:shadow-black/30 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 hover:scale-105 active:scale-95 ${
        visible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-4 scale-75 pointer-events-none"
      } ${className}`}
    >
      {/* Scroll progress ring SVG */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth={strokeWidth}
        />
        {/* Dynamic progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#backToTopGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-150 ease-out"
        />
        <defs>
          <linearGradient id="backToTopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>

      {/* Centered Arrow Icon */}
      <ArrowUpIcon
        className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:-translate-y-0.5 transition-transform duration-200"
        strokeWidth={2.5}
        aria-hidden="true"
      />
    </button>
  );
};

export default BackToTop;
