"use client";
import Link from "next/link";
import Image from "next/image";

const AuthHeader = () => {
  return (
    <header className="fixed left-0 top-0 w-full z-50 bg-white">
      <div className="py-4 border-b border-gray-3">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex justify-center">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo/logo.svg"
                alt="logo"
                width={110}
                height={25}
                className="w-auto"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader; 