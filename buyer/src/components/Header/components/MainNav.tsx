import React from "react";
import Link from "next/link";
import Dropdown from "../Dropdown";
import { menuData } from "../menuData";

interface MainNavProps {
  navigationOpen: boolean;
  stickyMenu: boolean;
}

const MainNav: React.FC<MainNavProps> = ({ navigationOpen, stickyMenu }) => {
  return (
    <div
      className={`w-[288px] absolute right-4 top-full xl:static xl:w-auto h-0 xl:h-auto invisible xl:visible xl:flex items-center justify-between ${
        navigationOpen &&
        `!visible bg-white shadow-lg border border-gray-3 !h-auto max-h-[400px] overflow-y-scroll rounded-md p-5`
      }`}
    >
      <nav>
        <ul className="flex xl:items-center flex-col xl:flex-row gap-5 xl:gap-6">
          {menuData.map((menuItem, i) =>
            menuItem.submenu ? (
              <Dropdown
                key={i}
                menuItem={menuItem}
                stickyMenu={stickyMenu}
              />
            ) : (
              <li
                key={i}
                className="group relative before:w-0 before:h-[3px] before:bg-blue before:absolute before:left-0 before:top-0 before:rounded-b-[3px] before:ease-out before:duration-200 hover:before:w-full"
              >
                <Link
                  href={menuItem.path}
                  className={`hover:text-blue text-custom-sm font-medium text-dark flex ${
                    stickyMenu ? "xl:py-4" : "xl:py-6"
                  }`}
                >
                  {menuItem.title}
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>
    </div>
  );
};

export default MainNav;
