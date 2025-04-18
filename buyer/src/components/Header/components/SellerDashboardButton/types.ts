import { ReactNode } from 'react';

export interface SellerDashboardButtonProps {
  handleDashboardClick: (e?: React.MouseEvent) => Promise<void>;
}

export interface DashboardSettings {
  popoverDismissed: boolean;
  dismissedAt: number;
  lastInteraction: number;
}

export interface FeatureItemProps {
  icon: ReactNode;
  text: string;
}

export interface PopoverContentProps {
  onDismiss: () => void;
  onNavigate: (e?: React.MouseEvent) => Promise<void>;
}
