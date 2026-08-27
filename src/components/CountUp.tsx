"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Contador animado — Padrões de Movimento §07 "Dados que se revelam".
 * Números contam do zero até o valor final em --mm-t-count (950ms) com
 * easeOutCubic, sempre em tabular-nums para a largura não tremer.
 * Anima só na entrada (troca de `to` já conta de novo, útil ao trocar de
 * loja/período) e respeita prefers-reduced-motion.
 */
export function useCountUp(to: number, duration = 950) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduced = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !Number.isFinite(to)) {
      setValue(to);
      return;
    }

    cancelAnimationFrame(raf.current!);
    const start = performance.now();
    const from = 0;

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (to - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration]);

  return value;
}

export function CountUp({
  to,
  format,
  duration,
  className,
}: {
  to: number;
  format: (v: number) => string;
  duration?: number;
  className?: string;
}) {
  const value = useCountUp(to, duration);
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {format(value)}
    </span>
  );
}
