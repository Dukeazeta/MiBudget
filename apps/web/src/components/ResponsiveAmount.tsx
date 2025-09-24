import { useEffect, useRef, useState } from 'react';

interface ResponsiveAmountProps {
  amount: string | number;
  className?: string;
  maxSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
  minSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  prefix?: string;
  suffix?: string;
  color?: string;
}

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm', 
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl', 
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
  '9xl': 'text-9xl'
} as const;

type SizeKey = keyof typeof sizeMap;

const sizeOrder = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];

export function ResponsiveAmount({ 
  amount, 
  className = '', 
  maxSize = '4xl', 
  minSize = 'base',
  prefix = '',
  suffix = '',
  color = ''
}: ResponsiveAmountProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [currentSize, setCurrentSize] = useState<SizeKey>(maxSize);

  const displayText = `${prefix}${amount}${suffix}`;

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const container = containerRef.current;
    const text = textRef.current;
    
    const findOptimalSize = () => {
      // Start with the maximum size and work our way down
      const maxIndex = sizeOrder.indexOf(maxSize);
      const minIndex = sizeOrder.indexOf(minSize);
      
      // Create a temporary element for measurement
      const tempElement = document.createElement('span');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.whiteSpace = 'nowrap';
      tempElement.style.fontFamily = getComputedStyle(text).fontFamily;
      tempElement.style.fontWeight = 'bold';
      tempElement.textContent = displayText;
      document.body.appendChild(tempElement);
      
      let optimalSize = maxSize;
      
      // Test each size from largest to smallest
      for (let i = maxIndex; i >= minIndex; i--) {
        const testSize = sizeOrder[i] as SizeKey;
        tempElement.className = sizeMap[testSize];
        
        const containerWidth = container.clientWidth;
        const textWidth = tempElement.scrollWidth;
        const availableWidth = containerWidth - 40; // More padding for safety
        
        if (textWidth <= availableWidth) {
          optimalSize = testSize;
          break;
        }
      }
      
      // Clean up temp element
      document.body.removeChild(tempElement);
      
      // Apply the optimal size
      setCurrentSize(optimalSize);
    };

    // Initial sizing with a slight delay to ensure container is rendered
    const timeoutId = setTimeout(() => {
      findOptimalSize();
    }, 0);

    // Set up ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      // Debounce the resize events
      clearTimeout(timeoutId);
      setTimeout(() => {
        findOptimalSize();
      }, 10);
    });

    if (container) {
      resizeObserver.observe(container);
    }

    // Also listen for font load events
    document.fonts?.ready.then(() => {
      setTimeout(() => {
        findOptimalSize();
      }, 10);
    });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [amount, maxSize, minSize, color, displayText]);

  return (
    <div ref={containerRef} className={`w-full overflow-hidden ${className}`}>
      <span 
        ref={textRef}
        className={`${sizeMap[currentSize]} ${color} font-bold whitespace-nowrap block transition-all duration-200`}
      >
        {displayText}
      </span>
    </div>
  );
}