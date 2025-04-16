"use client";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/store";
import { clearTokens } from "@/redux/features/auth-slice";
import { AUTH_API } from "@/config/api";
import axios from "axios";
import toast from "react-hot-toast";

// Import subcomponents
import Logo from "./components/Logo";
import SearchBar from "./components/SearchBar";
import SupportContact from "./components/SupportContact";
import CartButton from "./components/CartButton";
import AccountDropdown from "./components/AccountDropdown";
import SellerDashboardButton from "./components/SellerDashboardButton";
import HamburgerButton from "./components/HamburgerButton";
import MainNav from "./components/MainNav";
import NavLinks from "./components/NavLinks";

// Import types
import { SellerTokenResponse } from "./types";

const Header = () => {
  // State management
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef(null);
  
  // Redux state
  const dispatch = useDispatch();
  const { token } = useAppSelector((state) => state.authReducer);
  const isAuthenticated = !!token;

  // Header category options for the search component
  const searchOptions = [
    { label: "All Categories", value: "0" },
    { label: "Desktop", value: "1" },
    { label: "Laptop", value: "2" },
    { label: "Monitor", value: "3" },
    { label: "Phone", value: "4" },
    { label: "Watch", value: "5" },
    { label: "Mouse", value: "6" },
    { label: "Tablet", value: "7" },
  ];

  // Handle account dropdown toggle
  const toggleAccountDropdown = () => {
    setAccountDropdownOpen(!accountDropdownOpen);
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      // Call the API endpoint
      const response = await fetch(AUTH_API.LOGOUT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Clear tokens from Redux store
        dispatch(clearTokens());
        setAccountDropdownOpen(false);
      } else {
        console.error("Logout failed:", await response.json());
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Handle seller dashboard access
  const handleDashboardClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    try {
      const response = await axios.post<SellerTokenResponse>(
        AUTH_API.GENERATE_SELLER_TOKEN,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.token) {
        // Get verifyToken from sessionStorage
        const verifyToken = sessionStorage.getItem('verifyToken');
        
        // Include both tokens in the redirect URL
        const sellerDashboardUrl = `${process.env.NEXT_PUBLIC_SELLER_DASHBOARD_URL}/auth-redirect?token=${response.data.token}${verifyToken ? `&verifyToken=${encodeURIComponent(verifyToken)}` : ''}`;
        window.location.href = sellerDashboardUrl;
        
        // Clear URL token after redirect
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        toast.error("Failed to generate seller token");
      }
    } catch (error) {
      console.error("Error generating seller token:", error);
      toast.error("Failed to access seller dashboard");
    }
  };

  // Handle sticky menu behavior on scroll
  const handleStickyMenu = () => {
    if (window.scrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }
  };

  // Setup event listeners
  useEffect(() => {
    window.addEventListener("scroll", handleStickyMenu);

    // Handle clicks outside the account dropdown
    const handleClickOutside = (event) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setAccountDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleStickyMenu);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 w-full z-9999 bg-white transition-all ease-in-out duration-300 ${
        stickyMenu && "shadow"
      }`}
    >
      <div className="max-w-[1300px] mx-auto px-4 sm:px-7.5 xl:px-0">
        {/* Header top section */}
        <div
          className={`flex flex-col lg:flex-row gap-5 items-end lg:items-center xl:justify-between ease-out duration-200 ${
            stickyMenu ? "py-5" : "py-5"
          }`}
        >
          {/* Logo and search area */}
          <div className="xl:w-auto flex-col sm:flex-row w-full flex sm:justify-between sm:items-center gap-5 sm:gap-10">
            <Logo />
            <SearchBar options={searchOptions} />
          </div>

          {/* Header right section */}
          <div className="flex w-full lg:w-auto items-center gap-2 sm:gap-5">
            <SupportContact />
            
            {/* Divider */}
            <span className="hidden xl:block w-px h-7.5 bg-gray-4"></span>

            <div className="flex w-full lg:w-auto justify-between items-center gap-2 sm:gap-5">
              <div className="flex items-center gap-2 sm:gap-5">
                <SellerDashboardButton handleDashboardClick={handleDashboardClick} />
                <AccountDropdown 
                  isAuthenticated={isAuthenticated}
                  handleDashboardClick={handleDashboardClick}
                  handleLogout={handleLogout}
                  stickyMenu={stickyMenu}
                />
                <CartButton />
              </div>
              
              {/* Mobile menu hamburger button */}
              <HamburgerButton 
                navigationOpen={navigationOpen} 
                setNavigationOpen={setNavigationOpen} 
              />
            </div>
          </div>
        </div>
        {/* Header top end */}
      </div>

      {/* Navigation section */}
      <div className="border-t border-gray-3">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-7.5 xl:px-0">
          <div className="flex items-center justify-between">
            {/* Main navigation */}
            <MainNav navigationOpen={navigationOpen} stickyMenu={stickyMenu} />
            
            {/* Additional navigation links */}
            <NavLinks />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
