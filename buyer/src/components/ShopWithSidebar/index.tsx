"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FiFilter,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiCalendar,
  FiStar,
  FiGlobe,
  FiCheckCircle,
} from "react-icons/fi";
import SingleGridItem from "../Shop/SingleGridItem";
import SingleListItem from "../Shop/SingleListItem";
import PageContainer from "../Common/PageContainer";
import ProductCardSkeleton from "../Common/ProductCardSkeleton";
import { getProducts } from "@/services/product";
import { getSellerById } from "@/services/seller";
import {
  getFilterOptions,
  getPriceRange,
  FilterOptions,
  PriceRange,
} from "@/services/filters";
import { Product } from "@/types/product";
import { Seller } from "@/types/seller";
import DynamicCategoryFilter from "./DynamicCategoryFilter";
import DynamicPlatformFilter from "./DynamicPlatformFilter";
import DynamicRegionFilter from "./DynamicRegionFilter";
import DynamicPriceRangeFilter from "./DynamicPriceRangeFilter";
import SortingSelect, { SortOption } from "./SortingSelect";
import SearchInput from "./SearchInput";
import ActiveFilters from "./ActiveFilters";
import FilterSkeleton from "./FilterSkeleton";
import ErrorBoundary from "./ErrorBoundary";
import {
  generateShareableUrl,
  hasActiveFilters,
  validateFilters,
} from "@/utils/filterHelpers";

// Import test utilities for development
if (process.env.NODE_ENV === "development") {
  import("@/utils/testFilters");
}

interface ShopWithSidebarProps {
  sellerId?: string;
}

const ShopWithSidebar = ({ sellerId }: ShopWithSidebarProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [productStyle, setProductStyle] = useState("grid");
  const [productSidebar, setProductSidebar] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
    searchParams.get("platform")
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(
    searchParams.get("region")
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0, // Always start with 0 as minimum
    Number(searchParams.get("maxPrice")) || 0, // Will be set when filter options load
  ]);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(
    sellerId || searchParams.get("seller")
  );
  const [sellerInfo, setSellerInfo] = useState<Seller | null>(null);
  const [sellerResolved, setSellerResolved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "newest"
  );

  // Filter data states
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );
  const [dynamicPriceRange, setDynamicPriceRange] = useState<PriceRange | null>(
    null
  );
  const [filterLoading, setFilterLoading] = useState(true);
  const [filterError, setFilterError] = useState<string | null>(null);

  // Check if any filters are applied
  const hasFiltersApplied = () => {
    if (!filterOptions) return false;

    return (
      selectedCategory !== null ||
      selectedPlatform !== null ||
      selectedRegion !== null ||
      searchQuery.trim() !== "" ||
      sortBy !== "newest" ||
      priceRange[1] !== filterOptions.priceRange.max
    );
  };

  const handleStickyMenu = () => {
    if (window.scrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }
  };

  // Handle seller ID and search query from props or URL search parameters
  useEffect(() => {
    const seller = sellerId || searchParams.get("seller");
    const query = searchParams.get("q");

    // Handle seller
    if (seller) {
      setSelectedSeller(seller);
      // Fetch seller information
      const fetchSellerInfo = async () => {
        const sellerData = await getSellerById(seller);
        setSellerInfo(sellerData);
        setSellerResolved(true);
      };
      fetchSellerInfo();
    } else {
      setSelectedSeller(null);
      setSellerInfo(null);
      setSellerResolved(true);
    }

    // Handle search query
    if (query) {
      setSearchQuery(query);
    } else {
      setSearchQuery("");
    }
  }, [sellerId, searchParams]);

  // Fetch products from API (debounced to prevent excessive calls)
  useEffect(() => {
    // Don't fetch products until seller is resolved
    if (!sellerResolved) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        // Prepare filter parameters
        const params: any = {
          page: currentPage,
          limit: 12,
          status: "active", // Only show active listings
          sortBy: sortBy, // Add sorting
        };

        // Add category filter if selected
        if (selectedCategory) {
          params.categoryId = selectedCategory;
        }

        // Add platform filter if selected
        if (selectedPlatform) {
          params.platform = selectedPlatform;
        }

        // Add region filter if selected
        if (selectedRegion) {
          params.region = selectedRegion;
        }

        // Add price range filter if set and different from default
        if (filterOptions && priceRange[1] < filterOptions.priceRange.max) {
          params.maxPrice = priceRange[1];
        }

        // Add seller filter if selected
        if (selectedSeller) {
          params.sellerId = selectedSeller;
        }

        // Add search query if provided
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        console.log("Fetching products with params:", params);
        const result = await getProducts(params);

        if (result) {
          setProducts(result.products);
          setTotalProducts(result.total);
          setTotalPages(result.totalPages);
        } else {
          console.error("Failed to fetch products");
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 200); // 200ms debounce to prevent excessive API calls

    return () => clearTimeout(timeoutId);
  }, [
    currentPage,
    selectedCategory,
    selectedPlatform,
    selectedRegion,
    priceRange,
    selectedSeller,
    sellerResolved,
    searchQuery,
    sortBy,
    filterOptions,
  ]);

  const sortOptions: SortOption[] = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Price: Low to High", value: "price_low" },
    { label: "Price: High to Low", value: "price_high" },
  ];

  // Load filter options on component mount (only once)
  useEffect(() => {
    let isMounted = true; // Flag to prevent double execution in StrictMode
    let hasLoaded = false; // Additional flag to prevent double loading

    const loadFilterOptions = async () => {
      if (!isMounted || hasLoaded) return; // Prevent execution if component unmounted or already loaded

      hasLoaded = true; // Mark as loading started
      setFilterLoading(true);
      setFilterError(null);

      try {
        console.log("Loading filter options...");
        const options = await getFilterOptions();
        if (options && isMounted) {
          setFilterOptions(options);
          // Initialize price range with dynamic values, considering URL parameters
          const maxPriceFromUrl = Number(searchParams.get("maxPrice"));
          const initialPriceRange: [number, number] = [
            options.priceRange.min,
            maxPriceFromUrl && maxPriceFromUrl > 0
              ? maxPriceFromUrl
              : options.priceRange.max,
          ];
          setPriceRange(initialPriceRange);
          console.log(
            "Filter options loaded successfully. Setting initial price range:",
            initialPriceRange,
            "from options:",
            options.priceRange
          );
          setDynamicPriceRange(options.priceRange);
        } else {
          if (isMounted)
            setFilterError("Failed to load filter options. Please try again.");
        }
      } catch (error) {
        console.error("Failed to load filter options:", error);
        if (isMounted)
          setFilterError(
            "Unable to connect to the server. Please check your connection."
          );
      } finally {
        if (isMounted) setFilterLoading(false);
      }
    };

    // Use a small delay to prevent double execution in StrictMode
    const timeoutId = setTimeout(loadFilterOptions, 10);

    return () => {
      isMounted = false; // Cleanup flag
      clearTimeout(timeoutId);
    };
  }, [searchParams]); // Only run once on mount

  // Update URL parameters when filters change
  const updateUrlParams = React.useCallback(
    (filters: Record<string, any>) => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          value !== "newest"
        ) {
          if (Array.isArray(value)) {
            // Handle price range
            if (key === "priceRange" && filterOptions) {
              // Only set maxPrice if it's different from the maximum available price
              if (value[1] !== filterOptions.priceRange.max)
                params.set("maxPrice", value[1].toString());
            }
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const queryString = params.toString();
      const newUrl = queryString ? `?${queryString}` : "/products";

      // Use replace to avoid creating browser history entries for every filter change
      router.replace(newUrl, { scroll: false });
    },
    [router, filterOptions]
  );

  // Load dynamic price range when filters change (debounced) - REMOVED TO PREVENT DOUBLE API CALLS
  // The price range will be updated only when filter options are loaded initially

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedPlatform(null);
    setSelectedRegion(null);
    setSearchQuery("");
    setSortBy("newest");
    if (filterOptions) {
      setPriceRange([
        filterOptions.priceRange.min,
        filterOptions.priceRange.max,
      ]);
    }
    setCurrentPage(1);

    // Clear URL parameters
    router.replace("/products", { scroll: false });

    // Prevent focus on price input after clearing filters
    setTimeout(() => {
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
    }, 100);
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    selectedPlatform,
    selectedRegion,
    searchQuery,
    priceRange,
  ]);

  // Update URL when filters change (debounced to prevent excessive updates)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filters = {
        category: selectedCategory,
        platform: selectedPlatform,
        region: selectedRegion,
        search: searchQuery.trim(),
        sort: sortBy,
        priceRange: priceRange,
      };

      updateUrlParams(filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    selectedCategory,
    selectedPlatform,
    selectedRegion,
    searchQuery,
    sortBy,
    priceRange,
    updateUrlParams,
  ]);

  useEffect(() => {
    window.addEventListener("scroll", handleStickyMenu);

    // closing sidebar while clicking outside
    function handleClickOutside(event) {
      if (!event.target.closest(".sidebar-content")) {
        setProductSidebar(false);
      }
    }

    if (productSidebar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  return (
    <>
      <PageContainer fullWidth>
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-light-5 via-white to-green-light-6 py-16 lg:py-24">
          <div className="absolute inset-0 bg-gradient-to-r from-blue/5 to-green/5"></div>
          <div className="relative text-center">
            {searchQuery ? (
              <>
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-dark mb-6">
                  Search Results for{" "}
                  <span className="bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">
                    &quot;{searchQuery}&quot;
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-dark-3 max-w-2xl mx-auto mb-6">
                  {loading
                    ? "Searching..."
                    : `Found ${totalProducts} products matching your search`}
                </p>
                <button
                  onClick={() => (window.location.href = "/products")}
                  className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 text-sm font-medium mb-4"
                >
                  <FiX className="w-4 h-4" />
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-dark mb-6">
                  Find Your Perfect{" "}
                  <span className="bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">
                    Digital Code
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-dark-3 max-w-2xl mx-auto">
                  Use our advanced filters to discover exactly what you need
                  from thousands of digital codes, game keys, and gift cards
                </p>
              </>
            )}
          </div>
        </div>

        {/* Seller Header Section */}
        {sellerInfo && (
          <div className="bg-white border-b border-gray-3/20 py-8">
            <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-8 xl:px-6">
              <div className="flex items-center gap-6">
                {/* Seller Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-1 overflow-hidden">
                    {sellerInfo.profileImageUrl ? (
                      <Image
                        src={sellerInfo.profileImageUrl}
                        alt={`${sellerInfo.nickname} profile`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green to-blue flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {(sellerInfo.marketName || sellerInfo.nickname)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Verified Badge */}
                  {sellerInfo.badges && sellerInfo.badges.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-green text-white p-1 rounded-full">
                      <FiCheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Seller Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-dark mb-2">
                    {sellerInfo.marketName || sellerInfo.nickname}
                  </h2>
                  <p className="text-dark-3 mb-2">
                    {sellerInfo.enterpriseDetails?.companyName ||
                      sellerInfo.nickname}
                  </p>

                  {sellerInfo.about && (
                    <p className="text-dark-4 mb-3 max-w-2xl">
                      {sellerInfo.about}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-4 h-4 text-green" />
                      <span className="text-dark-3">
                        Joined{" "}
                        {new Date(sellerInfo.createdAt).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long" }
                        )}
                      </span>
                    </div>

                    {sellerInfo.badges && sellerInfo.badges.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FiStar className="w-4 h-4 text-green" />
                        <span className="text-green-dark font-medium">
                          Verified Seller
                        </span>
                      </div>
                    )}

                    {sellerInfo.enterpriseDetails?.website && (
                      <a
                        href={sellerInfo.enterpriseDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue hover:text-blue-dark transition-colors"
                      >
                        <FiGlobe className="w-4 h-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="overflow-hidden py-12 lg:py-20 bg-gradient-to-b from-gray-1 to-white">
          <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-8 xl:px-6">
            <div className="flex gap-6 xl:gap-7">
              {/* <!-- Enhanced Sidebar Start --> */}
              <div
                className={`sidebar-content fixed xl:z-1 z-9999 left-0 top-0 xl:translate-x-0 xl:static max-w-[320px] xl:max-w-[300px] w-full ease-out duration-200 ${
                  productSidebar
                    ? "translate-x-0 bg-gradient-to-b from-white to-gray-1 p-5 h-screen overflow-y-auto shadow-3"
                    : "-translate-x-full"
                } xl:bg-gradient-to-b xl:from-white xl:to-gray-1 xl:shadow-2 xl:rounded-2xl xl:p-6`}
              >
                <button
                  onClick={() => setProductSidebar(!productSidebar)}
                  aria-label="button for product sidebar toggle"
                  className={`xl:hidden absolute -right-12.5 sm:-right-8 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue to-blue-dark shadow-2 text-white hover:shadow-3 transition-all duration-300 ${
                    stickyMenu
                      ? "lg:top-20 sm:top-34.5 top-35"
                      : "lg:top-24 sm:top-39 top-37"
                  }`}
                >
                  {productSidebar ? (
                    <FiChevronLeft className="w-6 h-6" />
                  ) : (
                    <FiChevronRight className="w-6 h-6" />
                  )}
                </button>

                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="flex flex-col gap-6">
                    {/* <!-- Enhanced filter header --> */}
                    <div className="bg-gradient-to-r from-blue-light-5 to-green-light-6 rounded-xl py-4 px-5 border border-blue-light-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-8 h-8 bg-blue rounded-lg flex items-center justify-center">
                            <FiFilter className="w-4 h-4 text-white" />
                          </div>
                          <p className="font-semibold text-dark whitespace-nowrap">
                            Smart Filters
                          </p>
                        </div>
                        {hasFiltersApplied() && (
                          <button
                            onClick={clearAllFilters}
                            className="text-blue-dark hover:text-blue font-medium px-3 py-1.5 rounded-lg hover:bg-white/50 transition-all duration-200 flex items-center gap-1"
                          >
                            <FiX className="w-4 h-4" />
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* <!-- Search Box --> */}
                    <SearchInput
                      value={searchQuery}
                      onChange={setSearchQuery}
                      loading={loading}
                    />

                    {/* <!-- Category Filter --> */}
                    {filterLoading ? (
                      <FilterSkeleton title="Categories" itemCount={6} />
                    ) : filterError ? (
                      <ErrorBoundary
                        title="Categories"
                        error={filterError}
                        onRetry={() => window.location.reload()}
                      />
                    ) : (
                      <DynamicCategoryFilter
                        categories={filterOptions?.categories || []}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        loading={filterLoading}
                      />
                    )}

                    {/* <!-- Platform Filter --> */}
                    {filterLoading ? (
                      <FilterSkeleton title="Platforms" itemCount={5} />
                    ) : filterError ? (
                      <ErrorBoundary
                        title="Platforms"
                        error={filterError}
                        onRetry={() => window.location.reload()}
                      />
                    ) : (
                      <DynamicPlatformFilter
                        platforms={filterOptions?.platforms || []}
                        selectedPlatform={selectedPlatform}
                        onPlatformChange={setSelectedPlatform}
                        loading={filterLoading}
                      />
                    )}

                    {/* <!-- Region Filter --> */}
                    {filterLoading ? (
                      <FilterSkeleton title="Regions" itemCount={4} />
                    ) : filterError ? (
                      <ErrorBoundary
                        title="Regions"
                        error={filterError}
                        onRetry={() => window.location.reload()}
                      />
                    ) : (
                      <DynamicRegionFilter
                        regions={filterOptions?.regions || []}
                        selectedRegion={selectedRegion}
                        onRegionChange={setSelectedRegion}
                        loading={filterLoading}
                      />
                    )}

                    {/* <!-- Price Range Filter --> */}
                    {filterLoading ? (
                      <div className="bg-white rounded-xl shadow-2 border border-gray-3/30 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-2 rounded-lg animate-pulse"></div>
                            <div className="h-4 bg-gray-2 rounded w-24 animate-pulse"></div>
                          </div>
                          <div className="w-5 h-5 bg-gray-2 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-4">
                          <div className="h-6 bg-gray-2 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-2 rounded animate-pulse"></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-10 bg-gray-2 rounded animate-pulse"></div>
                            <div className="h-10 bg-gray-2 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      dynamicPriceRange && (
                        <DynamicPriceRangeFilter
                          priceRange={dynamicPriceRange}
                          selectedRange={priceRange}
                          onRangeChange={setPriceRange}
                          loading={filterLoading}
                        />
                      )
                    )}
                  </div>
                </form>
              </div>
              {/* // <!-- Sidebar End --> */}

              {/* <!-- Enhanced Content Start --> */}
              <div className="xl:max-w-[calc(100%-320px)] w-full">
                {/* Active Filters Display */}
                <ActiveFilters
                  filterOptions={filterOptions}
                  selectedCategory={selectedCategory}
                  selectedPlatform={selectedPlatform}
                  selectedRegion={selectedRegion}
                  priceRange={priceRange}
                  searchQuery={searchQuery}
                  onClearCategory={() => setSelectedCategory(null)}
                  onClearPlatform={() => setSelectedPlatform(null)}
                  onClearRegion={() => setSelectedRegion(null)}
                  onClearPriceRange={() => {
                    if (filterOptions) {
                      setPriceRange([
                        filterOptions.priceRange.min,
                        filterOptions.priceRange.max,
                      ]);
                    }
                  }}
                  onClearSearch={() => setSearchQuery("")}
                  onClearAll={clearAllFilters}
                />

                <div className="rounded-xl bg-white shadow-2 p-4 lg:p-6 mb-8 border border-gray-3/30">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* <!-- Enhanced top bar left --> */}
                    <div className="flex flex-wrap items-center gap-4">
                      <SortingSelect
                        options={sortOptions}
                        selectedValue={sortBy}
                        onSortChange={setSortBy}
                        loading={loading}
                      />

                      {/* Results Summary */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-light-4 to-green-light-5 rounded-lg flex items-center justify-center">
                          <FiCheckCircle className="w-3 h-3 text-blue" />
                        </div>
                        <span className="text-dark-2 text-sm font-medium">
                          {loading ? (
                            <div className="h-4 bg-gray-2 rounded w-32 animate-pulse"></div>
                          ) : (
                            <>
                              Showing{" "}
                              {Math.min(
                                (currentPage - 1) * 12 + 1,
                                totalProducts
                              )}{" "}
                              to {Math.min(currentPage * 12, totalProducts)} of{" "}
                              <span className="font-semibold text-blue">
                                {totalProducts}
                              </span>{" "}
                              products
                              {hasActiveFilters(
                                {
                                  category: selectedCategory,
                                  platform: selectedPlatform,
                                  region: selectedRegion,
                                  search: searchQuery,
                                  sort: sortBy,
                                  priceRange: priceRange,
                                },
                                filterOptions
                                  ? [
                                      filterOptions.priceRange.min,
                                      filterOptions.priceRange.max,
                                    ]
                                  : undefined
                              ) && (
                                <span className="text-blue-dark ml-1">
                                  (filtered)
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green rounded-full"></div>
                        <p className="text-dark-3">
                          Showing{" "}
                          <span className="font-semibold text-dark">
                            {products.length}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-dark">
                            {totalProducts}
                          </span>{" "}
                          products
                        </p>
                      </div>
                    </div>

                    {/* <!-- Enhanced view toggle buttons --> */}
                    <div className="flex items-center gap-2">
                      <span className="text-dark-4 text-sm font-medium mr-2">
                        View:
                      </span>
                      <div className="flex items-center bg-gray-1 rounded-lg p-1">
                        <button
                          onClick={() => setProductStyle("grid")}
                          aria-label="button for product grid tab"
                          className={`${
                            productStyle === "grid"
                              ? "bg-gradient-to-r from-blue to-blue-dark border-blue text-white shadow-1"
                              : "text-dark-3 hover:text-dark"
                          } flex items-center justify-center w-10 h-8 rounded-md border-0 transition-all duration-200 hover:bg-white/70`}
                        >
                          <FiGrid className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setProductStyle("list")}
                          aria-label="button for product list tab"
                          className={`${
                            productStyle === "list"
                              ? "bg-gradient-to-r from-blue to-blue-dark border-blue text-white shadow-1"
                              : "text-dark-3 hover:text-dark"
                          } flex items-center justify-center w-10 h-8 rounded-md border-0 transition-all duration-200 hover:bg-white/70`}
                        >
                          <FiList className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <!-- Enhanced Products Grid Section --> */}
                {loading ? (
                  <div
                    className={`${
                      productStyle === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 sm:gap-x-5 gap-y-8"
                        : "flex flex-col gap-7.5"
                    }`}
                  >
                    {/* Generate 12 skeleton cards */}
                    {[...Array(12)].map((_, index) => (
                      <ProductCardSkeleton
                        key={index}
                        gridView={productStyle === "grid"}
                      />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div
                    className={`${
                      productStyle === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 sm:gap-x-5 gap-y-8"
                        : "flex flex-col gap-7.5"
                    }`}
                  >
                    {products.map((item, key) =>
                      productStyle === "grid" ? (
                        <SingleGridItem item={item} key={key} />
                      ) : (
                        <SingleListItem item={item} key={key} />
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center items-center min-h-[500px]">
                    <div className="text-center max-w-md">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-light-5 to-green-light-6 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                          className="w-12 h-12 text-blue"
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
                        No Products Found
                      </h3>
                      <p className="text-dark-3 mb-6">
                        We couldn&apos;t find any products matching your
                        criteria. Try adjusting your filters or search terms.
                      </p>
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue to-blue-dark text-white px-6 py-3 rounded-lg hover:shadow-2 transition-all duration-200"
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
                        Reset Filters
                      </button>
                    </div>
                  </div>
                )}
                {/* <!-- Products Grid Tab Content End --> */}

                {/* Enhanced Pagination */}
                {!loading && products.length > 0 && totalPages > 1 && (
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
                            : "text-dark hover:bg-gradient-to-r hover:from-blue hover:to-blue-dark hover:text-white hover:shadow-1"
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
                                ? "bg-gradient-to-r from-blue to-blue-dark text-white shadow-1"
                                : "text-dark hover:bg-gray-1 hover:text-blue"
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
                            : "text-dark hover:bg-gradient-to-r hover:from-blue hover:to-blue-dark hover:text-white hover:shadow-1"
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
              {/* // <!-- Content End --> */}
            </div>
          </div>
        </section>
      </PageContainer>
    </>
  );
};

export default ShopWithSidebar;
