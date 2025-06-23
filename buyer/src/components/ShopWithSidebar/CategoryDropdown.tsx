"use client";

import { useState } from "react";

const CategoryItem = ({ category }) => {
  const [selected, setSelected] = useState(false);
  return (
    <button
      className={`${
        selected ? "bg-blue-light-5 text-blue-dark border-blue-light-4" : "hover:bg-blue-light-5/50"
      } group flex items-center justify-between p-3 rounded-lg border border-transparent transition-all duration-200 hover:text-blue w-full text-left`}
      onClick={() => setSelected(!selected)}
    >
      <div className="flex items-center gap-3">
        <div
          className={`cursor-pointer flex items-center justify-center rounded-lg w-5 h-5 border transition-all duration-200 ${
            selected ? "border-blue bg-gradient-to-r from-blue to-blue-dark" : "bg-white border-gray-3 group-hover:border-blue"
          }`}
        >
          <svg
            className={`${selected ? "block" : "hidden"} transition-all duration-200`}
            width="12"
            height="12"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.33317 2.5L3.74984 7.08333L1.6665 5"
              stroke="white"
              strokeWidth="1.94437"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <span className="font-medium">{category.name}</span>
      </div>

      <span
        className={`${
          selected 
            ? "text-white bg-gradient-to-r from-blue to-blue-dark shadow-1" 
            : "bg-gray-2 text-dark-3 group-hover:bg-blue-light-4 group-hover:text-blue-dark"
        } inline-flex rounded-full text-xs px-3 py-1 font-medium transition-all duration-200`}
      >
        {category.products}
      </span>
    </button>
  );
};

const CategoryDropdown = ({ categories }) => {
  const [toggleDropdown, setToggleDropdown] = useState(true);

  return (
    <div className="bg-gradient-to-br from-white to-gray-1 shadow-2 rounded-xl border border-gray-3/30">
      <div
        onClick={(e) => {
          e.preventDefault();
          setToggleDropdown(!toggleDropdown);
        }}
        className={`cursor-pointer flex items-center justify-between py-4 pl-6 pr-5.5 ${
          toggleDropdown && "shadow-filter rounded-t-xl"
        } hover:bg-blue-light-5/30 transition-all duration-200`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue to-blue-dark rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
          </div>
          <p className="font-semibold text-dark">Categories</p>
        </div>
        <button
          aria-label="button for category dropdown"
          className={`text-dark ease-out duration-200 hover:text-blue ${
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

      {/* dropdown && 'shadow-filter */}
      {/* <!-- dropdown menu --> */}
      <div
        className={`flex-col gap-2 py-6 pl-6 pr-5.5 ${
          toggleDropdown ? "flex" : "hidden"
        }`}
      >
        {categories.map((category, key) => (
          <CategoryItem key={key} category={category} />
        ))}
      </div>
    </div>
  );
};

export default CategoryDropdown;
