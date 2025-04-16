import React from "react";

interface HamburgerButtonProps {
  navigationOpen: boolean;
  setNavigationOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ navigationOpen, setNavigationOpen }) => {
  return (
    <button
      id="Toggle"
      aria-label="Toggler"
      className="lg:hidden block"
      onClick={() => setNavigationOpen(!navigationOpen)}
    >
      <span className="block relative cursor-pointer w-5.5 h-5.5">
        <span className="du-block absolute right-0 w-full h-full">
          <span
            className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-[0] ${
              !navigationOpen && "!w-full delay-300"
            }`}
          ></span>
          <span
            className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-150 ${
              !navigationOpen && "!w-full delay-400"
            }`}
          ></span>
          <span
            className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-200 ${
              !navigationOpen && "!w-full delay-500"
            }`}
          ></span>
        </span>

        <span className="block absolute right-0 w-full h-full rotate-45">
          <span
            className={`block bg-dark rounded-sm ease-in-out duration-200 delay-300 absolute left-2.5 top-0 w-0.5 h-full ${
              !navigationOpen && "!h-0 delay-[0] "
            }`}
          ></span>
          <span
            className={`block bg-dark rounded-sm ease-in-out duration-200 delay-400 absolute left-0 top-2.5 w-full h-0.5 ${
              !navigationOpen && "!h-0 dealy-200"
            }`}
          ></span>
        </span>
      </span>
    </button>
  );
};

export default HamburgerButton;
