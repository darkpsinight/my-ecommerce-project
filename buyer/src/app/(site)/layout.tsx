"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "../css/euclid-circular-a-font.css";
import "../css/style.css";
import "../nprogress.css";
import "@/app/css/phone-input.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AuthHeader from "@/components/Auth/AuthHeader";
import { NProgressBar } from "@/components/Common/NProgressBar";

import { ModalProvider } from "../context/QuickViewModalContext";
import { CartModalProvider } from "../context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import AuthProvider from "@/providers/AuthProvider";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import { PreviewSliderProvider } from "../context/PreviewSliderContext";
import PreviewSliderModal from "@/components/Common/PreviewSlider";

import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import CartInitializer from "@/components/Common/CartInitializer";
import WishlistInitializer from "@/components/Common/WishlistInitializer";
import { ViewedProductsProvider } from "@/components/ViewedProducts/ViewedProductsProvider";
import { Toaster } from "react-hot-toast";
import { AuthRefreshMonitor } from "@/components/Common/AuthRefreshMonitor";
import { SimpleAuthMonitor } from "@/components/Common/SimpleAuthMonitor";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();

  // Check if current route is an auth route
  const isAuthRoute = ["/signin", "/signup", "/confirmation", "/forgot-password", "/change-password", "/auth/callback/google"].includes(pathname);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        <NProgressBar />
        {loading ? (
          <PreLoader />
        ) : (
          <>
            <ReduxProvider>
              <AuthProvider>
                <ViewedProductsProvider>
                  <CartInitializer />
                  <WishlistInitializer />
                  <CartModalProvider>
                  <ModalProvider>
                    <PreviewSliderProvider>
                      {isAuthRoute ? <AuthHeader /> : <Header />}
                      {children}

                      <QuickViewModal />
                      <CartSidebarModal />
                      <PreviewSliderModal />
                    </PreviewSliderProvider>
                  </ModalProvider>
                  </CartModalProvider>
                </ViewedProductsProvider>
                <AuthRefreshMonitor />
              </AuthProvider>
            </ReduxProvider>
            <Toaster 
              position="top-right" 
              toastOptions={{
                style: {
                  zIndex: 999999,
                },
              }}
              containerStyle={{
                zIndex: 999999,
              }}
            />
            <ScrollToTop />
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
