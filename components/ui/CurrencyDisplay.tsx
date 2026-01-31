import Image from 'next/image';

interface CurrencyDisplayProps {
  amount: string | number;
  currency?: string;
  className?: string;
}

/**
 * Format number to Indonesian style with thousand separators
 * Examples: 1.000.000, 500.000, 50.000
 */
function formatIDRXNumber(amount: string | number): string {
  let numValue: number;

  // Handle string input
  if (typeof amount === 'string') {
    // Remove all non-numeric characters except dots, minus, and plus
    let cleaned = amount.replace(/[^\d.-]/g, '');

    // Check if it's already formatted (contains dots as thousand separators)
    if (cleaned.includes('.')) {
      // Might be "1.000.000" format or "1.5" decimal format
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        // This is thousand separator format like "1.000.000"
        cleaned = cleaned.replace(/\./g, '');
      } else if (parts[1]?.length > 2) {
        // This is thousand separator format
        cleaned = cleaned.replace(/\./g, '');
      }
    }

    numValue = parseFloat(cleaned);

    // Handle very large numbers (bigint from contract)
    if (cleaned.length > 15 && !isNaN(numValue)) {
      // Divide by 1e6 for IDRX (6 decimals)
      numValue = numValue / 1e6;
    }
  } else {
    numValue = amount;
  }

  if (isNaN(numValue) || numValue === 0) return '0';

  // Format with thousand separators using dots
  return numValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function CurrencyDisplay({ amount, currency = 'USDC', className = '' }: CurrencyDisplayProps) {
  if (currency === 'IDRX') {
    const formattedAmount = formatIDRXNumber(amount);

    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className="shrink-0 min-w-0 truncate font-semibold">{formattedAmount}</span>
        <Image
          src="/idrxLogo.png"
          alt="IDRX"
          width={16}
          height={16}
          className="w-3 h-3 sm:w-4 sm:h-4 object-contain shrink-0"
          priority
        />
      </span>
    );
  }

  return <span className={className}>{amount}</span>;
}
