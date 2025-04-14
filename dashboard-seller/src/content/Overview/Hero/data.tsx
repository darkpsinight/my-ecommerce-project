import React from 'react';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Feature, Stat, Testimonial } from './types';

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Alex Johnson",
    title: "Game Developer",
    avatar: "/static/images/avatars/1.jpg",
    content: "This platform revolutionized how I distribute my indie games. The analytics are comprehensive and the payment processing is seamless."
  },
  {
    id: 2,
    name: "Sarah Chen",
    title: "Software Entrepreneur",
    avatar: "/static/images/avatars/2.jpg",
    content: "After trying multiple platforms, this is the only one that offers the security and ease of use I needed for my digital products."
  }
];

export const stats: Stat[] = [
  { value: "99.9%", label: "Uptime" },
  { value: "1,240+", label: "Products" },
  { value: "24/7", label: "Support" },
  { value: "128+", label: "Countries" }
];

export const features: Feature[] = [
  {
    icon: <StorefrontIcon />,
    title: "Digital Marketplace",
    metric: "1,240+ Products",
    description: "List and manage your digital products with ease. Support for game keys, software licenses, and more."
  },
  {
    icon: <SecurityIcon />,
    title: "Enterprise Security",
    metric: "99.9% Uptime",
    description: "Advanced security measures to protect your inventory and transactions with full encryption."
  },
  {
    icon: <AnalyticsIcon />,
    title: "Advanced Analytics",
    metric: "30+ Metrics",
    description: "Track your performance with detailed analytics, sales reports, and customer insights."
  },
  {
    icon: <SupportAgentIcon />,
    title: "Priority Support",
    metric: "5 Min Response",
    description: "Our dedicated support team is always here to help you succeed with your digital business."
  }
]; 