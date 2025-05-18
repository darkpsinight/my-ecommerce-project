import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const PageContainer = ({ children, className = "", fullWidth = false }: PageContainerProps) => {
  return (
    <section
      className={`overflow-hidden pt-[250px] sm:pt-[180px] lg:pt-[100px] bg-gray-2 ${className}`}
    >
      <div className={`${fullWidth ? 'max-w-[1920px]' : 'max-w-[1170px]'} w-full mx-auto px-4 sm:px-8 xl:px-0`}>
        {children}
      </div>
    </section>
  );
};

export default PageContainer;
