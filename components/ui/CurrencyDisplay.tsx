import Image from 'next/image';

interface CurrencyDisplayProps {
  amount: string;
  currency?: string;
  className?: string;
}

export default function CurrencyDisplay({ amount, currency = 'USDC', className = '' }: CurrencyDisplayProps) {
  if (currency === 'IDRX') {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`}>
        <span className="shrink-0 min-w-0 truncate">{amount.replace('Rp', '').trim()}</span>
        <Image
          src="/idrxLogo.png"
          alt="IDRX"
          width={16}
          height={16}
          className="w-3 h-3 sm:w-4 sm:h-4 object-contain shrink-0"
        />
      </span>
    );
  }

  return <span className={className}>{amount}</span>;
}
