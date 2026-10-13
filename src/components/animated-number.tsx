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

/** Cuenta suave hacia el monto nuevo; si llega otro cambio a mitad de camino, sigue desde el valor actual. */
function useSmoothMoney(target: number): number {
  const [current, setCurrent] = useState(target);
  const currentRef = useRef(target);
  const rafRef = useRef(0);
  const primed = useRef(false);

  useEffect(() => {
    if (!primed.current) {
      primed.current = true;
      currentRef.current = target;
      setCurrent(target);
      return;
    }

    if (Math.abs(currentRef.current - target) < 0.005) {
      currentRef.current = target;
      setCurrent(target);
      return;
    }

    if (prefersReducedMotion()) {
      currentRef.current = target;
      setCurrent(target);
      return;
    }

    const from = currentRef.current;
    const delta = target - from;
    const duration = Math.min(850, 280 + Math.abs(delta) ** 0.4 * 16);
    const started = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const next = from + delta * easeOutCubic(progress);
      currentRef.current = next;
      setCurrent(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      currentRef.current = target;
      setCurrent(target);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return current;
}

type AnimatedMoneyProps = {
  value: number;
  className?: string;
  signed?: boolean;
};

export function AnimatedMoney({ value, className = "", signed = false }: AnimatedMoneyProps) {
  const animated = useSmoothMoney(value);
  const display = Math.round(animated * 100) / 100;
  const formatted = formatMoney(Math.abs(display)).replace(/\u00a0/g, " ");
  const sign = signed ? (display < 0 ? "−" : "+") : display < 0 ? "−" : "";
  const text = `${sign}${formatted}`;

  return (
    <span className={`odometer tabular-nums ${className}`} aria-label={text}>
      {text}
    </span>
  );
}
