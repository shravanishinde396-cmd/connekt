import React, { useEffect, useState, useRef } from 'react';
import { useMotionValue, animate, useInView } from 'framer-motion';


export interface NumberCounterProps {
  value: number;
  duration?: number; // in seconds
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  value,
  duration = 1.5,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(prefix + '0' + suffix);
  const count = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration,
        ease: 'easeOut',
        onUpdate: (latest) => {
          setDisplayValue(prefix + latest.toFixed(decimals) + suffix);
        },
      });
      return () => controls.stop();
    }
  }, [isInView, value, duration, prefix, suffix, decimals, count]);

  return <span ref={ref}>{displayValue}</span>;
};
