"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
}

export function CountUp({
  to,
  durationMs = 1100,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // out-expo easing
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(fromRef.current + (to - fromRef.current) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, durationMs]);

  return <span className={className}>{format(value)}</span>;
}
