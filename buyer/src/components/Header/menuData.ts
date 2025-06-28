import { Menu } from "@/types/Menu";

export const menuData: Menu[] = [
  {
    id: 1,
    title: "Popular",
    newTab: false,
    path: "/",
  },
  {
    id: 2,
    title: "Shop",
    newTab: false,
    path: "/products",
  },
  {
    id: 3,
    title: "Library",
    newTab: false,
    path: "/library",
  },
  {
    id: 4,
    title: "Contact",
    newTab: false,
    path: "/contact",
  },
  {
    id: 5,
    title: "pages",
    newTab: false,
    path: "/",
    submenu: [
      {
        id: 61,
        title: "Products",
        newTab: false,
        path: "/products",
      },
      {
        id: 62,
        title: "Marketplaces",
        newTab: false,
        path: "/marketplaces",
      },
      {
        id: 64,
        title: "Checkout",
        newTab: false,
        path: "/checkout",
      },
      {
        id: 65,
        title: "Cart",
        newTab: false,
        path: "/cart",
      },
      {
        id: 66,
        title: "Wishlist",
        newTab: false,
        path: "/wishlist",
      },
      {
        id: 67,
        title: "Recently Viewed",
        newTab: false,
        path: "/viewed-products",
      },
      {
        id: 68,
        title: "Sign in",
        newTab: false,
        path: "/signin",
      },
      {
        id: 69,
        title: "Sign up",
        newTab: false,
        path: "/signup",
      },
      {
        id: 70,
        title: "My Account",
        newTab: false,
        path: "/my-account",
      },
      {
        id: 71,
        title: "Digital Library",
        newTab: false,
        path: "/library",
      },
      {
        id: 72,
        title: "Wallet",
        newTab: false,
        path: "/wallet",
      },
      {
        id: 73,
        title: "Contact",
        newTab: false,
        path: "/contact",
      },
      {
        id: 74,
        title: "Error",
        newTab: false,
        path: "/error",
      },
      {
        id: 75,
        title: "Mail Success",
        newTab: false,
        path: "/mail-success",
      },
    ],
  },
  {
    id: 6,
    title: "blogs",
    newTab: false,
    path: "/",
    submenu: [
      {
        id: 71,
        title: "Blog Grid with sidebar",
        newTab: false,
        path: "/blogs/blog-grid-with-sidebar",
      },
      {
        id: 72,
        title: "Blog Grid",
        newTab: false,
        path: "/blogs/blog-grid",
      },
      {
        id: 73,
        title: "Blog details with sidebar",
        newTab: false,
        path: "/blogs/blog-details-with-sidebar",
      },
      {
        id: 74,
        title: "Blog details",
        newTab: false,
        path: "/blogs/blog-details",
      },
    ],
  },
];
