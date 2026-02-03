import { ButtonHTMLAttributes } from 'react';
import instacartLogo from '../assets/images/instacart-logo.png';

interface InstacartButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  isLoading?: boolean;
}

export function InstacartButton({ 
  text = 'Get Recipe Ingredients', 
  isLoading = false, 
  className = '',
  disabled,
  ...props 
}: InstacartButtonProps) {
  return (
    <button
      className={`
        flex items-center justify-center gap-2 
        bg-[#003D29] text-[#FAF1E5] 
        px-[18px] 
        h-[46px] 
        rounded-xl 
        font-medium text-base whitespace-nowrap
        hover:opacity-90 transition-opacity 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      <img 
        src={instacartLogo} 
        alt="Instacart" 
        className="w-[22px] h-[22px] object-contain"
      />
      <span>{isLoading ? 'Processing...' : text}</span>
    </button>
  );
}
