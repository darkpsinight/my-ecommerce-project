import React, { useState } from "react";
import Slider from "react-slider";

import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

const PriceDropdown = () => {
  const [toggleDropdown, setToggleDropdown] = useState(true);

  const [selectedPrice, setSelectedPrice] = useState({
    from: 0,
    to: 100,
  });

  return (
    <div className="bg-gradient-to-br from-white to-gray-1 shadow-2 rounded-xl border border-gray-3/30">
      <div
        onClick={() => setToggleDropdown(!toggleDropdown)}
        className={`cursor-pointer flex items-center justify-between py-4 pl-6 pr-5.5 ${
          toggleDropdown && "shadow-filter rounded-t-xl"
        } hover:bg-green-light-5/30 transition-all duration-200`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green to-green-dark rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="font-semibold text-dark">Price Range</p>
        </div>
        <button
          onClick={() => setToggleDropdown(!toggleDropdown)}
          id="price-dropdown-btn"
          aria-label="button for price dropdown"
          className={`text-dark ease-out duration-200 hover:text-green ${
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
      <div className={`p-6 ${toggleDropdown ? "block" : "hidden"}`}>
        <div id="pricingOne">
          <div className="price-range">
            <div className="mb-4">
              <p className="text-sm text-dark-3 mb-2">Select price range</p>
              <div className="relative">
                <RangeSlider
                  id="range-slider-gradient"
                  className="margin-lg"
                  step={"any"}
                  onInput={(e) =>
                    setSelectedPrice({
                      from: Math.floor(e[0]),
                      to: Math.ceil(e[1]),
                    })
                  }
                />
              </div>
            </div>

            <div className="price-amount flex items-center justify-between gap-4 pt-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-dark-4 mb-2">Min Price</label>
                <div className="text-sm text-dark flex items-center rounded-lg border-2 border-gray-3/80 bg-white hover:border-green-light-4 transition-colors duration-200">
                  <span className="block border-r border-gray-3/80 px-3 py-3 bg-gray-1 text-green font-medium rounded-l-lg">
                    $
                  </span>
                  <span id="minAmount" className="block px-3 py-3 font-medium">
                    {selectedPrice.from}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center px-2">
                <div className="w-3 h-0.5 bg-gray-4 rounded"></div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-dark-4 mb-2">Max Price</label>
                <div className="text-sm text-dark flex items-center rounded-lg border-2 border-gray-3/80 bg-white hover:border-green-light-4 transition-colors duration-200">
                  <span className="block border-r border-gray-3/80 px-3 py-3 bg-gray-1 text-green font-medium rounded-l-lg">
                    $
                  </span>
                  <span id="maxAmount" className="block px-3 py-3 font-medium">
                    {selectedPrice.to}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceDropdown;
