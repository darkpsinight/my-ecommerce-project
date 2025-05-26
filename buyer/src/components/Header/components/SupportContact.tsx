import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/store";

const WalletButton: React.FC = () => {
  // Get authentication state from Redux
  const { token } = useAppSelector((state) => state.authReducer);
  const isAuthenticated = !!token;

  // Only render the wallet button if user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Link href="/wallet" className="hidden xl:flex items-center gap-3.5 hover:opacity-80 transition-opacity">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 8V6C21 4.9 20.1 4 19 4H5C3.9 4 3 4.9 3 6V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V16"
          stroke="#3C50E0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 8H17C15.9 8 15 8.9 15 10V14C15 15.1 15.9 16 17 16H21V8Z"
          stroke="#3C50E0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="18"
          cy="12"
          r="1"
          fill="#3C50E0"
        />
      </svg>

      <div>
        <span className="block text-2xs text-dark-4 uppercase">
          MY WALLET
        </span>
        <p className="font-medium text-custom-sm text-dark">
          Manage Funds
        </p>
      </div>
    </Link>
  );
};

export default WalletButton;
