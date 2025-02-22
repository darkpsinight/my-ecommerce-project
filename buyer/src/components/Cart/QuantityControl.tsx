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

  const handleIncrease = () => {
    if (quantity < max) {
      onIncrease();
    }
  };

  return (
    <div className="inline-flex items-center rounded-md border border-gray-3 bg-white shadow-sm">
      <button
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        className={`flex items-center justify-center w-10 h-10 transition-colors duration-200 
          ${disabled || quantity <= min 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'hover:text-blue hover:bg-gray-50 active:bg-gray-100'
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
        className="w-14 h-10 border-x border-gray-3 bg-gray-50 font-medium text-gray-700 text-center focus:outline-none"
        aria-label="Quantity"
      />

      <button
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        className={`flex items-center justify-center w-10 h-10 transition-colors duration-200
          ${disabled || quantity >= max
            ? 'text-gray-300 cursor-not-allowed'
            : 'hover:text-blue hover:bg-gray-50 active:bg-gray-100'
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
  );
};

export default QuantityControl; 