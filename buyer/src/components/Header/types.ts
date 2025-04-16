export interface SellerTokenResponse {
  statusCode: number;
  message: string;
  token: string;
}

export interface MenuItem {
  title: string;
  path: string;
  icon?: React.ReactNode;
  submenu?: MenuItem[];
  showLabel?: boolean;
  onClick?: (e?: React.MouseEvent) => void | Promise<void>;
}
