"use client";
import React, { useState, useEffect } from "react";
import SingleSellerGridItem from "../Seller/SingleSellerGridItem";
import SingleSellerListItem from "../Seller/SingleSellerListItem";
import CustomSelect from "../ShopWithSidebar/CustomSelect";
import PageContainer from "../Common/PageContainer";
import SellerCardSkeleton from "../Common/SellerCardSkeleton";
import { getSellers } from "@/services/seller";
import { Seller } from "@/types/seller";

const ShopWithoutSidebar = () => {
  const [sellerStyle, setSellerStyle] = useState("grid");
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSellers, setTotalSellers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch sellers from API
  useEffect(() => {
    const fetchSellersData = async () => {
      setLoading(true);
      try {
        // Prepare filter parameters
        const params: any = {
          page: currentPage,
          limit: 24, // Show more sellers on this page
          sort: "newest", // Default sort
        };

        // Add search if provided
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const result = await getSellers(params);

        if (result) {
          setSellers(result.sellers);
          setTotalSellers(result.total);
          setTotalPages(result.totalPages);
        } else {
          console.error("Failed to fetch sellers");
          setSellers([]);
        }
      } catch (error) {
        console.error("Error fetching sellers:", error);
        setSellers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSellersData();
  }, [currentPage, searchQuery]);

  const options = [
    { label: "Newest Sellers", value: "newest" },
    { label: "Oldest Sellers", value: "oldest" },
    { label: "Name (A-Z)", value: "name" },
  ];

  return (
    <>
      <PageContainer fullWidth>
        {/* Enhanced Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-light-5 via-white to-blue-light-6 py-20 lg:py-28">
          <div className="absolute inset-0 bg-gradient-to-r from-green/5 to-blue/5"></div>
          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-green-light-5 text-green-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              Trusted Sellers Marketplace
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-dark mb-6">
              Verified Digital{" "}
              <span className="bg-gradient-to-r from-green to-blue bg-clip-text text-transparent">
                Marketplaces
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-dark-3 max-w-3xl mx-auto mb-10">
              Discover trusted sellers and digital marketplaces offering the best deals on 
              digital codes, game keys, software licenses, and gift cards worldwide
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-blue to-blue-dark rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium text-dark text-sm">
                  Verified Markets
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-green to-green-dark rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <p className="font-medium text-dark text-sm">
                  Trusted Sellers
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-teal to-teal-dark rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                </div>
                <p className="font-medium text-dark text-sm">Wide Selection</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-purple to-purple-dark rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="font-medium text-dark text-sm">Quality Service</p>
              </div>
            </div>
          </div>
        </div>

        <section className="overflow-hidden relative py-16 lg:py-24 bg-gradient-to-b from-gray-1 to-white">
          <div className="max-w-full w-full mx-auto px-4 sm:px-8 xl:px-6">
            <div className="flex gap-5 sm:gap-7.5">
              {/* Enhanced Content Start */}
              <div className="w-full">
                <div className="rounded-xl bg-white shadow-2 p-4 lg:p-6 mb-8 border border-gray-3/30">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Enhanced top bar left */}
                    <div className="flex flex-wrap items-center gap-4">
                      <CustomSelect options={options} />

                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green rounded-full"></div>
                        <p className="text-dark-3">
                          Showing{" "}
                          <span className="font-semibold text-dark">
                            {sellers.length}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-dark">
                            {totalSellers}
                          </span>{" "}
                          marketplaces
                        </p>
                      </div>
                    </div>

                    {/* Enhanced view toggle buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-dark-4 text-sm font-medium mr-2">
                        View:
                      </span>
                      <div className="flex items-center bg-gray-1 rounded-lg p-1">
                        <button
                          onClick={() => setSellerStyle("grid")}
                          aria-label="button for seller grid tab"
                          className={`${
                            sellerStyle === "grid"
                              ? "bg-gradient-to-r from-green to-green-dark text-white shadow-1"
                              : "text-dark-3 hover:text-dark"
                          } flex items-center justify-center w-10 h-8 rounded-md border-0 transition-all duration-200 hover:bg-white/70`}
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M4.836 1.3125C4.16215 1.31248 3.60022 1.31246 3.15414 1.37244C2.6833 1.43574 2.2582 1.57499 1.91659 1.91659C1.57499 2.2582 1.43574 2.6833 1.37244 3.15414C1.31246 3.60022 1.31248 4.16213 1.3125 4.83598V4.914C1.31248 5.58785 1.31246 6.14978 1.37244 6.59586C1.43574 7.06671 1.57499 7.49181 1.91659 7.83341C2.2582 8.17501 2.6833 8.31427 3.15414 8.37757C3.60022 8.43754 4.16213 8.43752 4.83598 8.4375H4.914C5.58785 8.43752 6.14978 8.43754 6.59586 8.37757C7.06671 8.31427 7.49181 8.17501 7.83341 7.83341C8.17501 7.49181 8.31427 7.06671 8.37757 6.59586C8.43754 6.14978 8.43752 5.58787 8.4375 4.91402V4.83601C8.43752 4.16216 8.43754 3.60022 8.37757 3.15414C8.31427 2.6833 8.17501 2.2582 7.83341 1.91659C7.49181 1.57499 7.06671 1.43574 6.59586 1.37244C6.14978 1.31246 5.58787 1.31248 4.91402 1.3125H4.836ZM2.71209 2.71209C2.80983 2.61435 2.95795 2.53394 3.30405 2.4874C3.66632 2.4387 4.15199 2.4375 4.875 2.4375C5.59801 2.4375 6.08368 2.4387 6.44596 2.4874C6.79205 2.53394 6.94018 2.61435 7.03791 2.71209C7.13565 2.80983 7.21607 2.95795 7.2626 3.30405C7.31131 3.66632 7.3125 4.15199 7.3125 4.875C7.3125 5.59801 7.31131 6.08368 7.2626 6.44596C7.21607 6.79205 7.13565 6.94018 7.03791 7.03791C6.94018 7.13565 6.79205 7.21607 6.44596 7.2626C6.08368 7.31131 5.59801 7.3125 4.875 7.3125C4.15199 7.3125 3.66632 7.31131 3.30405 7.2626C2.95795 7.21607 2.80983 7.13565 2.71209 7.03791C2.61435 6.94018 2.53394 6.79205 2.4874 6.44596C2.4387 6.08368 2.4375 5.59801 2.4375 4.875C2.4375 4.15199 2.4387 3.66632 2.4874 3.30405C2.53394 2.95795 2.61435 2.80983 2.71209 2.71209Z"
                              fill=""
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M13.086 9.5625C12.4121 9.56248 11.8502 9.56246 11.4041 9.62244C10.9333 9.68574 10.5082 9.82499 10.1666 10.1666C9.82499 10.5082 9.68574 10.9333 9.62244 11.4041C9.56246 11.8502 9.56248 12.4121 9.5625 13.086V13.164C9.56248 13.8379 9.56246 14.3998 9.62244 14.8459C9.68574 15.3167 9.82499 15.7418 10.1666 16.0834C10.5082 16.425 10.9333 16.5643 11.4041 16.6276C11.8502 16.6875 12.4121 16.6875 13.0859 16.6875H13.164C13.8378 16.6875 14.3998 16.6875 14.8459 16.6276C15.3167 16.5643 15.7418 16.425 16.0834 16.0834C16.425 15.7418 16.5643 15.3167 16.6276 14.8459C16.6875 14.3998 16.6875 13.8379 16.6875 13.1641V13.086C16.6875 12.4122 16.6875 11.8502 16.6276 11.4041C16.5643 10.9333 16.425 10.5082 16.0834 10.1666C15.7418 9.82499 15.3167 9.68574 14.8459 9.62244C14.3998 9.56246 13.8379 9.56248 13.164 9.5625H13.086ZM10.9621 10.9621C11.0598 10.8644 11.208 10.7839 11.554 10.7374C11.9163 10.6887 12.402 10.6875 13.125 10.6875C13.848 10.6875 14.3337 10.6887 14.696 10.7374C15.0421 10.7839 15.1902 10.8644 15.2879 10.9621C15.3857 11.0598 15.4661 11.208 15.5126 11.554C15.5613 11.9163 15.5625 12.402 15.5625 13.125C15.5625 13.848 15.5613 14.3337 15.5126 14.696C15.4661 15.0421 15.3857 15.1902 15.2879 15.2879C15.1902 15.3857 15.0421 15.4661 14.696 15.5126C14.3337 15.5613 13.848 15.5625 13.125 15.5625C12.402 15.5625 11.9163 15.5613 11.554 15.5126C11.208 15.4661 11.0598 15.3857 10.9621 15.2879C10.8644 15.1902 10.7839 15.0421 10.7374 14.696C10.6887 14.3337 10.6875 13.848 10.6875 13.125C10.6875 12.402 10.6887 11.9163 10.7374 11.554C10.7839 11.208 10.8644 11.0598 10.9621 10.9621Z"
                              fill=""
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M4.836 9.5625H4.914C5.58786 9.56248 6.14978 9.56246 6.59586 9.62244C7.06671 9.68574 7.49181 9.82499 7.83341 10.1666C8.17501 10.5082 8.31427 10.9333 8.37757 11.4041C8.43754 11.8502 8.43752 12.4121 8.4375 13.086V13.164C8.43752 13.8378 8.43754 14.3998 8.37757 14.8459C8.31427 15.3167 8.17501 15.7418 7.83341 16.0834C7.49181 16.425 7.06671 16.5643 6.59586 16.6276C6.14979 16.6875 5.58789 16.6875 4.91405 16.6875H4.83601C4.16217 16.6875 3.60022 16.6875 3.15414 16.6276C2.6833 16.5643 2.2582 16.425 1.91659 16.0834C1.57499 15.7418 1.43574 15.3167 1.37244 14.8459C1.31246 14.3998 1.31248 13.8379 1.3125 13.164V13.086C1.31248 12.4122 1.31246 11.8502 1.37244 11.4041C1.43574 10.9333 1.57499 10.5082 1.91659 10.1666C2.2582 9.82499 2.6833 9.68574 3.15414 9.62244C3.60023 9.56246 4.16214 9.56248 4.836 9.5625ZM3.30405 10.7374C2.95795 10.7839 2.80983 10.8644 2.71209 10.9621C2.61435 10.4518 2.53394 10.7954 2.4874 11.1414C2.4387 11.5037 2.4375 11.9894 2.4375 12.7124C2.4375 13.4354 2.4387 13.9211 2.4874 14.2834C2.53394 14.6295 2.61435 14.7776 2.71209 14.8753C2.80983 14.9731 2.95795 15.0535 3.30405 15.1C3.66632 15.1487 3.7394 15.1499 4.4624 15.1499C5.18541 15.1499 4.6711 15.1487 5.03338 15.1C5.37948 15.0535 5.5276 14.9731 5.62533 14.8753C5.72307 14.7776 5.80348 14.6295 5.85002 14.2834C5.89873 13.9211 5.89992 13.4354 5.89992 12.7124C5.89992 11.9894 5.89873 11.5037 5.85002 11.1414C5.80348 10.7954 5.72307 10.6472 5.62533 10.5495C5.5276 10.4518 5.37948 10.3713 5.03338 10.3248C4.6711 10.2761 5.18541 10.2749 4.4624 10.2749C3.7394 10.2749 3.25373 10.2761 2.89145 10.3248Z"
                              fill=""
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M13.086 1.3125C12.4122 1.31248 11.8502 1.31246 11.4041 1.37244C10.9333 1.43574 10.5082 1.57499 10.1666 1.91659C9.82499 2.2582 9.68574 2.6833 9.62244 3.15414C9.56246 3.60023 9.56248 4.16214 9.5625 4.836V4.914C9.56248 5.58786 9.56246 6.14978 9.62244 6.59586C9.68574 7.06671 9.82499 7.49181 10.1666 7.83341C10.5082 8.17501 10.9333 8.31427 11.4041 8.37757C11.8502 8.43754 12.4121 8.43752 13.086 8.4375H13.164C13.8378 8.43752 14.3998 8.43754 14.8459 8.37757C15.3167 8.31427 15.7418 8.17501 16.0834 7.83341C16.425 7.49181 16.5643 7.06671 16.6276 6.59586C16.6875 6.14978 16.6875 5.58787 16.6875 4.91402V4.83601C16.6875 4.16216 16.6875 3.60022 16.6276 3.15414C16.5643 2.6833 16.425 2.2582 16.0834 1.91659C15.7418 1.57499 15.3167 1.43574 14.8459 1.37244C14.3998 1.31246 13.8379 1.31248 13.164 1.3125H13.086ZM10.9621 2.71209C11.0598 2.61435 11.208 2.53394 11.554 2.4874C11.9163 2.4387 12.402 2.4375 13.125 2.4375C13.848 2.4375 14.3337 2.4387 14.696 2.4874C15.0421 2.53394 15.1902 2.61435 15.2879 2.71209C15.3857 2.80983 15.4661 2.95795 15.5126 3.30405C15.5613 3.66632 15.5625 4.15199 15.5625 4.875C15.5625 5.59801 15.5613 6.08368 15.5126 6.44596C15.4661 6.79205 15.3857 6.94018 15.2879 7.03791C15.1902 7.13565 15.0421 7.21607 14.696 7.2626C14.3337 7.31131 13.848 7.3125 13.125 7.3125C12.402 7.3125 11.9163 7.31131 11.554 7.2626C11.208 7.21607 11.0598 7.13565 10.9621 7.03791C10.8644 6.94018 10.7839 6.79205 10.7374 6.44596C10.6887 6.08368 10.6875 5.59801 10.6875 4.875C10.6875 4.15199 10.6887 3.66632 10.7374 3.30405C10.7839 2.95795 10.8644 2.80983 10.9621 2.71209Z"
                              fill=""
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => setSellerStyle("list")}
                          aria-label="button for seller list tab"
                          className={`${
                            sellerStyle === "list"
                              ? "bg-gradient-to-r from-green to-green-dark text-white shadow-1"
                              : "text-dark-3 hover:text-dark"
                          } flex items-center justify-center w-10 h-8 rounded-md border-0 transition-all duration-200 hover:bg-white/70`}
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M4.4234 0.899903C3.74955 0.899882 3.18763 0.899864 2.74155 0.959838C2.2707 1.02314 1.8456 1.16239 1.504 1.504C1.16239 1.8456 1.02314 2.2707 0.959838 2.74155C0.899864 3.18763 0.899882 3.74953 0.899903 4.42338V4.5014C0.899882 5.17525 0.899864 5.73718 0.959838 6.18326C1.02314 6.65411 1.16239 7.07921 1.504 7.42081C1.8456 7.76241 2.2707 7.90167 2.74155 7.96497C3.18763 8.02495 3.74953 8.02493 4.42339 8.02491H4.5014C5.17525 8.02493 14.7372 8.02495 15.1833 7.96497C15.6541 7.90167 16.0792 7.76241 16.4208 7.42081C16.7624 7.07921 16.9017 6.65411 16.965 6.18326C17.0249 5.73718 17.0249 5.17527 17.0249 4.50142V4.42341C17.0249 3.74956 17.0249 3.18763 16.965 2.74155C16.9017 2.2707 16.7624 1.8456 16.4208 1.504C16.0792 1.16239 15.6541 1.02314 15.1833 0.959838C14.7372 0.899864 5.17528 0.899882 4.50142 0.899903H4.4234ZM2.29949 2.29949C2.39723 2.20175 2.54535 2.12134 2.89145 2.07481C3.25373 2.0261 3.7394 2.0249 4.4624 2.0249C5.18541 2.0249 14.6711 2.0261 15.0334 2.07481C15.3795 2.12134 15.5276 2.20175 15.6253 2.29949C15.7231 2.39723 15.8035 2.54535 15.85 2.89145C15.8987 3.25373 15.8999 3.7394 15.8999 4.4624C15.8999 5.18541 15.8987 5.67108 15.85 6.03336C15.8035 6.37946 15.7231 6.52758 15.6253 6.62532C15.5276 6.72305 15.3795 6.80347 15.0334 6.85C14.6711 6.89871 5.18541 6.8999 4.4624 6.8999C3.7394 6.8999 3.25373 6.89871 2.89145 6.85C2.54535 6.80347 2.39723 6.72305 2.29949 6.62532C2.20175 6.52758 2.12134 6.37946 2.07481 6.03336C2.0261 5.67108 2.0249 5.18541 2.0249 4.4624C2.0249 3.7394 2.0261 3.25373 2.07481 2.89145C2.12134 2.54535 2.20175 2.39723 2.29949 2.29949Z"
                              fill=""
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M4.4234 9.1499H4.5014C5.17526 9.14988 14.7372 9.14986 15.1833 9.20984C15.6541 9.27314 16.0792 9.41239 16.4208 9.754C16.7624 10.0956 16.9017 10.5207 16.965 10.9915C17.0249 11.4376 17.0249 11.9995 17.0249 12.6734V12.7514C17.0249 13.4253 17.0249 13.9872 16.965 14.4333C16.9017 14.9041 16.7624 15.3292 16.4208 15.6708C16.0792 16.0124 15.6541 16.1517 15.1833 16.215C14.7372 16.2749 5.17529 16.2749 4.50145 16.2749H4.42341C3.74957 16.2749 3.18762 16.2749 2.74155 16.215C2.2707 16.1517 1.8456 16.0124 1.504 15.6708C1.16239 15.3292 1.02314 14.9041 0.959838 14.4333C0.899864 13.9872 0.899882 13.4253 0.899903 12.7514V12.6734C0.899882 11.9996 0.899864 11.4376 0.959838 10.9915C1.02314 10.5207 1.16239 10.0956 1.504 9.754C1.8456 9.41239 2.2707 9.27314 2.74155 9.20984C3.18763 9.14986 3.74955 9.14988 4.4234 9.1499ZM2.89145 10.3248C2.54535 10.3713 2.39723 10.4518 2.29949 10.5495C2.20175 10.6472 2.12134 10.7954 2.07481 11.1414C2.0261 11.5037 2.0249 11.9894 2.0249 12.7124C2.0249 13.4354 2.0261 13.9211 2.07481 14.2834C2.12134 14.6295 2.20175 14.7776 2.29949 14.8753C2.39723 14.9731 2.54535 15.0535 2.89145 15.1C3.25373 15.1487 3.7394 15.1499 4.4624 15.1499C5.18541 15.1499 14.6711 15.1487 15.0334 15.1C15.3795 15.0535 15.5276 14.9731 15.6253 14.8753C15.7231 14.7776 15.8035 14.6295 15.85 14.2834C15.8987 13.9211 15.8999 13.4354 15.8999 12.7124C15.8999 11.9894 15.8987 11.5037 15.85 11.1414C15.8035 10.7954 15.7231 10.6472 15.6253 10.5495C15.5276 10.4518 15.3795 10.3713 15.0334 10.3248C14.6711 10.2761 5.18541 10.2749 4.4624 10.2749C3.7394 10.2749 3.25373 10.2761 2.89145 10.3248Z"
                              fill=""
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sellers Grid Tab Content Start */}
                {loading ? (
                  <div
                    className={`${
                      sellerStyle === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 sm:gap-x-5 gap-y-8"
                        : "flex flex-col gap-7.5"
                    }`}
                  >
                    {/* Generate 24 skeleton cards for the without sidebar view */}
                    {[...Array(24)].map((_, index) => (
                      <SellerCardSkeleton
                        key={index}
                        gridView={sellerStyle === "grid"}
                      />
                    ))}
                  </div>
                ) : sellers.length > 0 ? (
                  <div
                    className={`${
                      sellerStyle === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 sm:gap-x-5 gap-y-8"
                        : "flex flex-col gap-7.5"
                    }`}
                  >
                    {sellers.map((seller, key) =>
                      sellerStyle === "grid" ? (
                        <SingleSellerGridItem seller={seller} key={key} />
                      ) : (
                        <SingleSellerListItem seller={seller} key={key} />
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center items-center min-h-[500px]">
                    <div className="text-center max-w-md">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-light-5 to-blue-light-6 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                          className="w-12 h-12 text-green"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-dark mb-3">
                        No Products Available
                      </h3>
                      <p className="text-dark-3 mb-6">
                        We&apos;re currently updating our inventory. Please
                        check back soon for new digital products and amazing
                        deals!
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-green to-green-dark text-white px-6 py-3 rounded-lg hover:shadow-2 transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Refresh Page
                      </button>
                    </div>
                  </div>
                )}
                {/* Products Grid Tab Content End */}

                {/* Enhanced Pagination */}
                {!loading && sellers.length > 0 && totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center bg-white rounded-xl shadow-2 p-2 gap-1">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                          currentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-dark hover:bg-gradient-to-r hover:from-green hover:to-green-dark hover:text-white hover:shadow-1"
                        }`}
                      >
                        <svg
                          width="8"
                          height="14"
                          viewBox="0 0 8 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 1L1 7L7 13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                        // Show first page, last page, current page, and pages around current page
                        let pageToShow;
                        if (totalPages <= 5) {
                          pageToShow = index + 1;
                        } else if (currentPage <= 3) {
                          pageToShow = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageToShow = totalPages - 4 + index;
                        } else {
                          pageToShow = currentPage - 2 + index;
                        }

                        return (
                          <button
                            key={index}
                            onClick={() => setCurrentPage(pageToShow)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all duration-200 ${
                              currentPage === pageToShow
                                ? "bg-gradient-to-r from-green to-green-dark text-white shadow-1"
                                : "text-dark hover:bg-gray-1 hover:text-green"
                            }`}
                          >
                            {pageToShow}
                          </button>
                        );
                      })}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                          currentPage === totalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-dark hover:bg-gradient-to-r hover:from-green hover:to-green-dark hover:text-white hover:shadow-1"
                        }`}
                      >
                        <svg
                          width="8"
                          height="14"
                          viewBox="0 0 8 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 1L7 7L1 13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Content End */}
            </div>
          </div>
        </section>
      </PageContainer>
    </>
  );
};

export default ShopWithoutSidebar;
