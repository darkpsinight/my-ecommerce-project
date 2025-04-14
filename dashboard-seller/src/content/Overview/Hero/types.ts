import { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import { ReactNode } from 'react';

export interface ButtonProps extends MuiButtonProps {
  component?: React.ElementType;
  to?: string;
}

export interface Testimonial {
  id: number;
  name: string;
  title: string;
  avatar: string;
  content: string;
}

export interface Stat {
  value: string;
  label: string;
}

export type FeatureIconKey = 'marketplace' | 'security' | 'analytics' | 'support';

export interface Feature {
  iconKey: FeatureIconKey;
  title: string;
  metric: string;
  description: string;
}

export interface HeroProps {
  appName: string;
} 