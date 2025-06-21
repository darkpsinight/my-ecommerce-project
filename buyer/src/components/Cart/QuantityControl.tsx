import React, { useState, useEffect, useRef } from "react";

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  handleQuantityChange: (newQuantity: number) => void;
}

const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 9999,
  disabled = false,
  handleQuantityChange,
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
  };

  // Check if at maximum quantity
  const isAtMax = quantity >= max;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="quantity-control-container inline-flex items-center rounded-md border border-gray-3 bg-white shadow-sm transition-all duration-200">
        <button
          onClick={handleDecrease}
          disabled={disabled || quantity <= min}
          aria-label="Decrease quantity"
          className={`flex items-center justify-center w-10 h-10 transition-colors duration-200 
            ${disabled || quantity <= min 
              ? 'text-gray-5 cursor-not-allowed' 
              : 'hover:text-blue hover:bg-gray-1 active:bg-gray-2'
            }`}
        >
          <svg
            className="fill-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3.33301 10.0001C3.33301 9.53984 3.7061 9.16675 4.16634 9.16675H15.833C16.2932 9.16675 16.6663 9.53984 16.6663 10.0001C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10.0001Z" />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-14 h-10 border-x border-gray-3 bg-gray-1 font-medium text-gray-7 text-center focus:outline-none focus:ring-2 focus:ring-blue-light-5 transition-all duration-200"
          aria-label="Quantity"
        />

        <button
          onClick={handleIncrease}
          disabled={disabled || quantity >= max}
          aria-label="Increase quantity"
          title={isAtMax ? `Maximum available: ${max}` : 'Increase quantity'}
          className={`flex items-center justify-center w-10 h-10 transition-colors duration-200
            ${disabled || quantity >= max
              ? 'text-gray-5 cursor-not-allowed bg-gray-2 opacity-50' 
              : 'hover:text-blue hover:bg-gray-1 active:bg-gray-2 text-gray-7'
            }`}
        >
          <svg
            className="fill-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.8337 4.16671C10.8337 3.70647 10.4606 3.33337 10.0003 3.33337C9.54009 3.33337 9.16699 3.70647 9.16699 4.16671V9.16671H4.16699C3.70676 9.16671 3.33366 9.5398 3.33366 10C3.33366 10.4603 3.70676 10.8334 4.16699 10.8334H9.16699V15.8334C9.16699 16.2936 9.54009 16.6667 10.0003 16.6667C10.4606 16.6667 10.8337 16.2936 10.8337 15.8334V10.8334H15.8337C16.2939 10.8334 16.667 10.4603 16.667 10C16.667 9.5398 16.2939 9.16671 15.8337 9.16671H10.8337V4.16671Z" />
          </svg>
        </button>
      </div>
      
      {/* Show max stock indicator */}
      {isAtMax && max < 999 && (
        <div className="flex items-center gap-1 px-3 py-2 bg-red-light-5 text-red-dark rounded-md border border-red-light-3 animate-pulse">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold">
            MAXIMUM REACHED: {max}
          </span>
        </div>
      )}
    </div>
  );
};

export default QuantityControl; 