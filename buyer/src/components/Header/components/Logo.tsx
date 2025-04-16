import React from "react";
import Link from "next/link";
import Image from "next/image";

const Logo: React.FC = () => {
  return (
    <Link className="flex-shrink-0" href="/">
      <Image
        src="/images/logo/logo.svg"
        alt="Logo"
        width={219}
        height={36}
      />
    </Link>
  );
};

export default Logo;
