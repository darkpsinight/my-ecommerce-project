"use client";
import React, { useState } from "react";

const SizeDropdown = () => {
  const [toggleDropdown, setToggleDropdown] = useState(true);
  const [selectedSize, setSelectedSize] = useState("Popular");
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-1 shadow-2 rounded-xl border border-gray-3/30">
      <div
        onClick={() => setToggleDropdown(!toggleDropdown)}
        className={`cursor-pointer flex items-center justify-between py-4 pl-6 pr-5.5 ${
          toggleDropdown && "shadow-filter rounded-t-xl"
        } hover:bg-orange-light-5/30 transition-all duration-200`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-orange to-orange-dark rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="font-semibold text-dark">Platform</p>
        </div>
        <button
          onClick={() => setToggleDropdown(!toggleDropdown)}
          aria-label="button for size dropdown"
          className={`text-dark ease-out duration-200 hover:text-orange ${
            toggleDropdown && "rotate-180"
          }`}
        >
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.43057 8.51192C4.70014 8.19743 5.17361 8.161 5.48811 8.43057L12 14.0122L18.5119 8.43057C18.8264 8.16101 19.2999 8.19743 19.5695 8.51192C19.839 8.82642 19.8026 9.29989 19.4881 9.56946L12.4881 15.5695C12.2072 15.8102 11.7928 15.8102 11.5119 15.5695L4.51192 9.56946C4.19743 9.29989 4.161 8.82641 4.43057 8.51192Z"
              fill=""
            />
          </svg>
        </button>
      </div>

      {/* Enhanced dropdown menu */}
      <div
        className={`flex-wrap gap-3 p-6 ${
          toggleDropdown ? "flex" : "hidden"
        }`}
      >
        {['Popular', 'PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'].map((platform) => (
          <label
            key={platform}
            htmlFor={`platform${platform}`}
            className={`cursor-pointer select-none flex items-center rounded-lg transition-all duration-200 ${
              selectedSize === platform
                ? "bg-gradient-to-r from-orange to-orange-dark text-white shadow-1"
                : "bg-gray-1 text-dark hover:bg-orange-light-4 hover:text-orange-dark border border-gray-3/50 hover:border-orange-light-4"
            }`}
          >
            <div className="relative">
              <input 
                type="radio" 
                name="platform" 
                id={`platform${platform}`} 
                className="sr-only" 
                onChange={() => setSelectedSize(platform)}
              />
              <div className="text-sm font-medium py-2 px-4 rounded-lg">
                {platform}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default SizeDropdown;
