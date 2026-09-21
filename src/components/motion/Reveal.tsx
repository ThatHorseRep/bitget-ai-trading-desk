"use client";

import React, { useEffect, useRef } from "react";

export interface RevealProps {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3;
  as?: React.ElementType;
  className?: string;
  id?: string;
}

const DELAY_MAP: Record<0 | 1 | 2 | 3, number> = {
  0: 0,
  1: 60,
  2: 120,
  3: 180,
};

export function Reveal({
  children,
  delay = 0,
  as: Component = "div",
  className = "",
  id,
}: RevealProps) {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // 1. prefers-reduced-motion check
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const currentEl = elementRef.current;
    if (!currentEl) return;

    const delayMs = DELAY_MAP[delay] ?? 0;

    // Apply transition properties and hidden state dynamically on client
    currentEl.classList.add("rt-reveal-transition", "rt-reveal-init");
    currentEl.style.transitionDelay = `${delayMs}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          currentEl.classList.add("rt-reveal-visible");
          observer.unobserve(currentEl);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(currentEl);

    return () => {
      observer.disconnect();
    };
  }, [delay]);

  const Tag = Component as React.ElementType;

  return (
    <Tag ref={elementRef} id={id} className={className}>
      {children}
    </Tag>
  );
}
