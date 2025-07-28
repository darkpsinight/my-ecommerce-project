import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/types/product';
import { getProductById } from '@/services/product';
import { updateproductDetails, clearProductDetails } from '@/redux/features/product-details';
import { addRecentlyViewedProduct } from '@/redux/features/recently-viewed-slice';
import { AppDispatch } from '@/redux/store';

interface UseProductDataOptions {
  productFromStorage?: Product | null;
}

export const useProductData = (options: UseProductDataOptions = {}) => {
  const { productFromStorage } = options;
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<Product | null>(null);
  const [fallbackProduct, setFallbackProduct] = useState<Product | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  // Initialize fallback product from localStorage or Redux store
  useEffect(() => {
    if (!productId && typeof window !== "undefined") {
      const storedProduct = localStorage.getItem("productDetails");
      if (storedProduct) {
        try {
          const parsedProduct = JSON.parse(storedProduct);
          setFallbackProduct(parsedProduct);
        } catch (error) {
          console.error("Error parsing stored product:", error);
          setFallbackProduct(productFromStorage || null);
        }
      } else {
        setFallbackProduct(productFromStorage || null);
      }
    }
  }, [productId, productFromStorage]);

  // Reset fallback product when productId changes
  useEffect(() => {
    if (productId) {
      setFallbackProduct(null);
    }
  }, [productId]);

  // Clear product details when component unmounts
  useEffect(() => {
    return () => {
      console.log("ShopDetails component unmounting, clearing product details");
      dispatch(clearProductDetails());

      if (typeof window !== "undefined") {
        localStorage.removeItem("productDetails");
      }
    };
  }, [dispatch]);

  // Fetch product data
  useEffect(() => {
    let isMounted = true;

    const fetchProductData = async () => {
      if (!isMounted) return;
      setLoading(true);

      if (productId) {
        try {
          console.log("Fetching product with ID:", productId);
          const data = await getProductById(productId, false);

          if (!isMounted) return;

          if (data) {
            console.log("Product data fetched successfully:", data.title);
            setProductData(data);

            // Save to localStorage for persistence
            localStorage.setItem("productDetails", JSON.stringify(data));

            // Update Redux store with fresh data
            dispatch(updateproductDetails({ ...data }));

            // Add to recently viewed products (Redux - legacy)
            dispatch(addRecentlyViewedProduct({ ...data }));
          } else {
            console.log("No product data found, using fallback");
            setProductData(fallbackProduct);
          }
        } catch (error) {
          if (!isMounted) return;
          console.error("Error fetching product:", error);
          setProductData(fallbackProduct);
        }
      } else {
        console.log("No product ID provided, using fallback product");
        setProductData(fallbackProduct);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    setProductData(null);
    fetchProductData();

    return () => {
      isMounted = false;
    };
  }, [productId, dispatch, fallbackProduct]);

  // Handle fallback product when no productId is provided
  useEffect(() => {
    if (!productId && !productData) {
      console.log("No product ID and no product data, using fallback");
      setProductData(fallbackProduct);
    }
  }, [productId, productData, fallbackProduct]);

  const product = productData || fallbackProduct;

  return {
    product,
    productId,
    loading,
    router
  };
};