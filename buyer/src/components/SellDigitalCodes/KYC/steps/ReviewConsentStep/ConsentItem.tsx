import React from "react";

interface ConsentItemProps {
  id: string;
  label: string;
  description: string;
  link?: string;
  linkText?: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ConsentItem = ({
  id,
  label,
  description,
  link,
  linkText,
  checked,
  onChange,
}: ConsentItemProps) => {
  return (
    <div className="relative flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center h-5">
        <input
          id={id}
          name={id}
          type="checkbox"
          required
          checked={checked}
          onChange={onChange}
          className="focus:ring-blue-500 h-5 w-5 text-green border-gray-300 rounded"
        />
      </div>
      <div className="ml-3">
        <label htmlFor={id} className="font-semibold text-dark text-base">
          {label}
        </label>
        <p className="text-gray-600 mt-1">
          {description}
          {link && (
            <a
              href={link}
              className="text-blue-600 hover:text-blue-800 ml-1 inline-flex items-center"
            >
              {linkText}
              <svg
                className="w-3 h-3 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                ></path>
              </svg>
            </a>
          )}
        </p>
      </div>
    </div>
  );
};

export default ConsentItem; 