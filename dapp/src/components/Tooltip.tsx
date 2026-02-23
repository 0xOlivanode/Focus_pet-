"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  content,
  children,
  delay = 300,
  position = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const animationVariants = {
    top: {
      initial: { opacity: 0, y: 10, x: "-50%" },
      animate: { opacity: 1, y: 0, x: "-50%" },
    },
    bottom: {
      initial: { opacity: 0, y: -10, x: "-50%" },
      animate: { opacity: 1, y: 0, x: "-50%" },
    },
    left: {
      initial: { opacity: 0, x: 10, y: "-50%" },
      animate: { opacity: 1, x: 0, y: "-50%" },
    },
    right: {
      initial: { opacity: 0, x: -10, y: "-50%" },
      animate: { opacity: 1, x: 0, y: "-50%" },
    },
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-white dark:border-t-neutral-800",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-white dark:border-t-neutral-800",
    left: "left-full top-1/2 -translate-y-1/2 border-l-white dark:border-l-neutral-800",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-white dark:border-r-neutral-800",
  };

  return (
    <div
      className="relative inline-flex items-center"
      style={{ transformStyle: "preserve-3d" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={animationVariants[position].initial}
            animate={animationVariants[position].animate}
            exit={animationVariants[position].initial}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ translateZ: 100 }}
            className={`absolute z-100 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 text-[10px] font-bold shadow-2xl border border-neutral-100 dark:border-neutral-700 whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
          >
            {content}
            <div
              className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
