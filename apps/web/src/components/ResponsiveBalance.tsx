interface ResponsiveBalanceProps {
  amount: number;
  currencySymbol?: string;
  className?: string;
  color?: string;
}

export function ResponsiveBalance({ 
  amount, 
  currencySymbol = '$',
  className = '',
  color = 'text-gray-900'
}: ResponsiveBalanceProps) {
  const formattedAmount = (amount / 100).toFixed(2);
  
  // Determine font size based on amount length
  const getFontSizeClass = (value: string): string => {
    const length = value.length;
    if (length <= 4) return 'text-8xl sm:text-9xl'; // $0.00 to $99.99
    if (length <= 6) return 'text-7xl sm:text-8xl';  // $999.99 to $9,999.99
    if (length <= 8) return 'text-6xl sm:text-7xl';  // $99,999.99
    if (length <= 10) return 'text-5xl sm:text-6xl'; // $999,999.99
    if (length <= 12) return 'text-4xl sm:text-5xl'; // $9,999,999.99
    return 'text-3xl sm:text-4xl'; // Very large amounts
  };

  const fontSizeClass = getFontSizeClass(formattedAmount);

  return (
    <div className={`${className}`}>
      <div 
        className={`${fontSizeClass} ${color} font-black leading-none tracking-tight`}
        style={{
          // CSS clamp for truly responsive sizing
          fontSize: 'clamp(2rem, 8vw, 8rem)'
        }}
      >
        <span className="inline-block">
          {currencySymbol}
          {formattedAmount}
        </span>
      </div>
    </div>
  );
}