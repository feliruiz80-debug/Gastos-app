"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function useAnimatedNumber(target: number, durationMs = 900): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayRef.current;
    if (from === target) {
      setDisplay(target);
      return;
    }

    if (prefersReducedMotion()) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const start = performance.now();
    const delta = target - from;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const next = from + delta * easeOutCubic(progress);
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        displayRef.current = target;
        setDisplay(target);
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs]);

  return display;
}

type AnimatedMoneyProps = {
  value: number;
  className?: string;
  signed?: boolean;
  durationMs?: number;
};

export function AnimatedMoney({ value, className = "", signed = false, durationMs = 900 }: AnimatedMoneyProps) {
  const animated = useAnimatedNumber(value, durationMs);
  const [popping, setPopping] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!prefersReducedMotion()) setPopping(true);
      return;
    }
    if (prefersReducedMotion()) return;
    setPopping(false);
    const id = requestAnimationFrame(() => setPopping(true));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const shown = signed
    ? `${animated < 0 ? "−" : "+"}${formatMoney(Math.abs(animated))}`
    : formatMoney(animated);

  return (
    <span
      className={`inline-block tabular-nums ${popping ? "animate-money-pop" : ""} ${className}`}
      onAnimationEnd={() => setPopping(false)}
    >
      {shown}
    </span>
  );
}
