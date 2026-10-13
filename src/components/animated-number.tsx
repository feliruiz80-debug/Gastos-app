"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

function OdometerDigit({
  digit,
  place,
}: {
  digit: string;
  place: number;
}) {
  const target = Number(digit);
  const [offset, setOffset] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const prevRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    if (prevRef.current === target && mounted.current) return;

    if (reduced) {
      prevRef.current = target;
      offsetRef.current = target;
      setDurationMs(0);
      setOffset(target);
      mounted.current = true;
      return;
    }

    const from = prevRef.current ?? 0;
    const current = offsetRef.current;
    const spins = (mounted.current ? 1 : 2) + Math.min(place, 4);
    const forward = (target - from + 10) % 10;
    const next = current - (current % 10) + from + spins * 10 + forward;

    prevRef.current = target;
    offsetRef.current = next;
    setDurationMs(800 + place * 200);
    // Forzar layout antes de animar en el primer pintado.
    if (!mounted.current) {
      setOffset(0);
      requestAnimationFrame(() => setOffset(next));
    } else {
      setOffset(next);
    }
    mounted.current = true;
  }, [target, place]);

  return (
    <span className="odometer-digit" aria-hidden="true">
      <span
        className="odometer-reel"
        style={{
          transform: `translateY(-${offset}em)`,
          transitionDuration: `${durationMs}ms`,
        }}
      >
        {Array.from({ length: 80 }, (_, index) => (
          <span key={index} className="odometer-glyph">
            {DIGITS[index % 10]}
          </span>
        ))}
      </span>
    </span>
  );
}

type AnimatedMoneyProps = {
  value: number;
  className?: string;
  signed?: boolean;
};

export function AnimatedMoney({ value, className = "", signed = false }: AnimatedMoneyProps) {
  const formatted = formatMoney(Math.abs(value));
  const sign = signed ? (value < 0 ? "−" : "+") : value < 0 ? "−" : "";
  const text = `${sign}${formatted}`;

  const digitPlaces: number[] = [];
  let place = 0;
  for (let i = text.length - 1; i >= 0; i -= 1) {
    if (/\d/.test(text[i]!)) {
      digitPlaces[i] = place;
      place += 1;
    }
  }

  return (
    <span className={`odometer inline-flex items-baseline tabular-nums ${className}`} aria-label={text}>
      {Array.from(text).map((char, index) => {
        if (/\d/.test(char)) {
          const digitPlace = digitPlaces[index] ?? 0;
          return <OdometerDigit key={`p-${digitPlace}`} digit={char} place={digitPlace} />;
        }
        return (
          <span key={`s-${index}-${char}`} className="odometer-static" aria-hidden="true">
            {char}
          </span>
        );
      })}
    </span>
  );
}
