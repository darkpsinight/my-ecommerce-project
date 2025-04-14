import React, { useEffect, useRef, useState } from 'react';
import { Typography } from '@mui/material';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    const suffix = value.replace(/[0-9.]/g, '');
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const increment = numericValue / steps;
    
    const timer = setInterval(() => {
      currentStep++;
      const current = Math.min(increment * currentStep, numericValue);
      
      // Handle different formats (percentage, whole numbers, decimals)
      let formattedValue;
      if (value.includes('%')) {
        formattedValue = current.toFixed(1);
      } else if (Number.isInteger(numericValue)) {
        formattedValue = Math.floor(current).toString();
      } else {
        formattedValue = current.toFixed(1);
      }
      
      setDisplayValue(formattedValue + suffix);
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(value); // Ensure we end up with the exact target value
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, isInView]);

  return (
    <Typography ref={ref} className={className}>
      {displayValue}
    </Typography>
  );
};

export default AnimatedCounter; 