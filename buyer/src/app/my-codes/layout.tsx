import ReduxProvider from "@/redux/provider";
import NProgressBar from "@/components/Common/NProgressBar";
import { Toaster } from "react-hot-toast";

import "../css/style.css";
import "../nprogress.css";

export default function MyCodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-satoshi text-base text-dark bg-white">
        <div className="page-wrapper relative z-[1] bg-white">
          <ReduxProvider>
            <NProgressBar />
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#fff",
                  color: "#374151",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                },
              }}
            />
          </ReduxProvider>
        </div>
      </body>
    </html>
  );
}