import React, { useState, useEffect, useRef } from "react";

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  handleQuantityChange: (newQuantity: number) => void;
  showMaximumPulse?: boolean; // New prop to control pulse animation
}

const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 9999,
  disabled = false,
  handleQuantityChange,
  showMaximumPulse = true, // Default to true to maintain existing behavior
}) => {
  const [inputValue, setInputValue] = useState(quantity.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input value in sync with quantity prop
  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string for typing
    if (value === '') {
      setInputValue('');
      return;
    }
    // Only allow numbers
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Clamp value between min and max
      const clampedValue = Math.max(min, Math.min(max, numValue));
      
      // If user tried to input more than max, show feedback
      if (numValue > max && max < 999) {
        // Visual feedback by briefly highlighting the input
        if (inputRef.current) {
          inputRef.current.classList.add('ring-2', 'ring-orange', 'border-orange');
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.classList.remove('ring-2', 'ring-orange', 'border-orange');
            }
          }, 1000);
        }
      }
      
      setInputValue(clampedValue.toString());
      
      // Use setTimeout to manage focus
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
      handleQuantityChange(clampedValue);
    }
  };

  const handleBlur = () => {
    // If empty, reset to min value
    if (inputValue === '') {
      setInputValue(min.toString());
      handleQuantityChange(min);
    } else if (isNaN(parseInt(inputValue))) {
      setInputValue(quantity.toString());
    }
  };

  const handleDecrease = () => {
    if (quantity > min) {
      onDecrease();
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    if (quantity < max) {
      onIncrease();
    } else {
      // Visual feedback when user tries to exceed maximum - pulse the entire control
      if (showMaximumPulse) {
        const button = e.currentTarget;
        const container = button.closest('.quantity-control-container');
        if (container) {
          container.classList.add('animate-pulse', 'ring-2', 'ring-orange');
          setTimeout(() => {
            container.classList.remove('animate-pulse', 'ring-2', 'ring-orange');
          }, 800);
        }
        // Also call onIncrease to trigger the toast in parent component
        onIncrease();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="quantity-control-container inline-flex items-center rounded-2xl border-2 border-gray-3 bg-gradient-to-r from-gray-1 to-white shadow-1 hover:shadow-2 transition-all duration-300">
        <button
          onClick={handleDecrease}
          disabled={disabled || quantity <= min}
          aria-label="Decrease quantity"
          className={`group flex items-center justify-center w-12 h-12 rounded-l-2xl transition-all duration-300 
            ${disabled || quantity <= min 
              ? 'text-gray-4 cursor-not-allowed bg-gray-2' 
              : 'hover:text-white hover:bg-red hover:scale-110 active:scale-95 text-gray-6'
            }`}
        >
          <svg
            className="fill-current w-5 h-5 transition-transform duration-300 group-hover:scale-110"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3.33301 10.0001C3.33301 9.53984 3.7061 9.16675 4.16634 9.16675H15.833C16.2932 9.16675 16.6663 9.53984 16.6663 10.0001C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10.0001Z" />
          </svg>
        </button>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            className="w-16 h-12 border-none bg-transparent font-bold text-lg text-gray-7 text-center focus:outline-none focus:ring-2 focus:ring-blue focus:rounded-lg transition-all duration-300 disabled:opacity-50"
            aria-label="Quantity"
          />
          {/* Quantity Label */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-5 font-medium whitespace-nowrap mb-2">
            {quantity === 1 ? 'code' : 'codes'}
          </div>
        </div>

        <button
          onClick={handleIncrease}
          disabled={disabled || quantity >= max}
          aria-label="Increase quantity"
          title={quantity >= max ? `Maximum available: ${max}` : 'Increase quantity'}
          className={`group flex items-center justify-center w-12 h-12 rounded-r-2xl transition-all duration-300
            ${disabled || quantity >= max
              ? 'text-gray-4 cursor-not-allowed bg-gray-2 opacity-50' 
              : 'hover:text-white hover:bg-green hover:scale-110 active:scale-95 text-gray-6'
            }`}
        >
          <svg
            className="fill-current w-5 h-5 transition-transform duration-300 group-hover:scale-110"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.8337 4.16671C10.8337 3.70647 10.4606 3.33337 10.0003 3.33337C9.54009 3.33337 9.16699 3.70647 9.16699 4.16671V9.16671H4.16699C3.70676 9.16671 3.33366 9.5398 3.33366 10C3.33366 10.4603 3.70676 10.8334 4.16699 10.8334H9.16699V15.8334C9.16699 16.2936 9.54009 16.6667 10.0003 16.6667C10.4606 16.6667 10.8337 16.2936 10.8337 15.8334V10.8334H15.8337C16.2939 10.8334 16.667 10.4603 16.667 10C16.667 9.5398 16.2939 9.16671 15.8337 9.16671H10.8337V4.16671Z" />
          </svg>
        </button>
      </div>
      
      {/* Visual feedback for max quantity */}
      {quantity >= max && max < 999 && (
        <div className="flex items-center gap-1 text-xs text-red font-medium animate-pulse mt-2">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Max quantity
        </div>
      )}
    </div>
  );
};

export default QuantityControl; 