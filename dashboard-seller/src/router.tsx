import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { RouteObject } from 'react-router';

import SidebarLayout from 'src/layouts/SidebarLayout';
import BaseLayout from 'src/layouts/BaseLayout';

import SuspenseLoader from 'src/components/SuspenseLoader';
import ProtectedRoute from 'src/components/ProtectedRoute';
import AuthenticatedRedirect from 'src/components/AuthenticatedRedirect';
import AuthRedirect from './pages/AuthRedirect';
import OAuthCallback from './pages/OAuthCallback';
import { AnalyticsProviderWrapper } from 'src/content/Dashboards/Analytics/context/AnalyticsContext';

const Loader = (Component) => (props) =>
(
  <Suspense fallback={<SuspenseLoader />}>
    <Component {...props} />
  </Suspense>
);

// Pages

const Overview = Loader(lazy(() => import('src/content/Overview')));
const Login = Loader(lazy(() => import('src/content/pages/Auth/Login')));

// Dashboards

const Crypto = Loader(lazy(() => import('src/content/Dashboards/Crypto')));
const Financials = Loader(lazy(() => import('src/content/Dashboards/Financials')));
const Listings = Loader(lazy(() => import('src/content/Dashboards/Listings')));
const Analytics = Loader(lazy(() => import('src/content/Dashboards/Analytics')));

// Analytics Sub-pages
const AnalyticsOverview = Loader(lazy(() => import('src/content/Dashboards/Analytics/AnalyticsOverview')));
const SalesPerformance = Loader(lazy(() => import('src/content/Dashboards/Analytics/SalesPerformance')));
const ProductAnalytics = Loader(lazy(() => import('src/content/Dashboards/Analytics/ProductAnalytics')));
const CustomerIntelligence = Loader(lazy(() => import('src/content/Dashboards/Analytics/CustomerIntelligence')));
const MarketInsights = Loader(lazy(() => import('src/content/Dashboards/Analytics/MarketInsights')));
const EngagementGrowth = Loader(lazy(() => import('src/content/Dashboards/Analytics/EngagementGrowth')));
const CACAnalytics = Loader(lazy(() => import('src/content/Dashboards/Analytics/CACAnalytics')));
const TransactionSuccessRate = Loader(lazy(() => import('src/content/Dashboards/Analytics/TransactionSuccessRate')));

// Applications

const Messenger = Loader(
  lazy(() => import('src/content/Applications/Messenger'))
);
const Transactions = Loader(
  lazy(() => import('src/content/Applications/Transactions'))
);
const UserProfile = Loader(
  lazy(() => import('src/content/Applications/Users/profile'))
);
const UserSettings = Loader(
  lazy(() => import('src/content/Applications/Users/settings'))
);
const PaymentSetup = Loader(
  lazy(() => import('src/content/Management/PaymentSetup'))
);

// Components

const Buttons = Loader(
  lazy(() => import('src/content/pages/Components/Buttons'))
);
const Modals = Loader(
  lazy(() => import('src/content/pages/Components/Modals'))
);
const Accordions = Loader(
  lazy(() => import('src/content/pages/Components/Accordions'))
);
const Tabs = Loader(lazy(() => import('src/content/pages/Components/Tabs')));
const Badges = Loader(
  lazy(() => import('src/content/pages/Components/Badges'))
);
const Tooltips = Loader(
  lazy(() => import('src/content/pages/Components/Tooltips'))
);
const Avatars = Loader(
  lazy(() => import('src/content/pages/Components/Avatars'))
);
const Cards = Loader(lazy(() => import('src/content/pages/Components/Cards')));
const Forms = Loader(lazy(() => import('src/content/pages/Components/Forms')));

// Status

const Status404 = Loader(
  lazy(() => import('src/content/pages/Status/Status404'))
);
const Status500 = Loader(
  lazy(() => import('src/content/pages/Status/Status500'))
);
const StatusComingSoon = Loader(
  lazy(() => import('src/content/pages/Status/ComingSoon'))
);
const StatusMaintenance = Loader(
  lazy(() => import('src/content/pages/Status/Maintenance'))
);

const routes: RouteObject[] = [
  {
    path: '',
    element: <BaseLayout />,
    children: [
      {
        path: '/login',
        element: <AuthenticatedRedirect><Login /></AuthenticatedRedirect>
      },
      {
        path: '/auth-redirect',
        element: <AuthRedirect />
      },
      {
        path: '/oauth/callback',
        element: <OAuthCallback />
      },
      {
        path: '/',
        element: <Overview />
      },
      {
        path: 'overview',
        element: <Navigate to="/" replace />
      },
      {
        path: 'status',
        children: [
          {
            path: '',
            element: <Navigate to="404" replace />
          },
          {
            path: '404',
            element: <Status404 />
          },
          {
            path: '500',
            element: <Status500 />
          },
          {
            path: 'maintenance',
            element: <StatusMaintenance />
          },
          {
            path: 'coming-soon',
            element: <StatusComingSoon />
          }
        ]
      },
      {
        path: '*',
        element: <Status404 />
      }
    ]
  },
  {
    path: 'dashboards',
    element: <ProtectedRoute><SidebarLayout /></ProtectedRoute>,
    children: [
      {
        path: '',
        element: <Navigate to="listings" replace />
      },
      {
        path: 'listings',
        element: <Listings />
      },
      {
        path: 'crypto',
        element: <Crypto />
      },
      {
        path: 'financials',
        element: <Financials />
      },
      {
        path: 'analytics',
        element: <AnalyticsProviderWrapper />,
        children: [
          {
            path: '',
            element: <Navigate to="overview" replace />
          },
          {
            path: 'overview',
            element: <AnalyticsOverview />
          },
          {
            path: 'sales',
            element: <SalesPerformance />
          },
          {
            path: 'products',
            element: <ProductAnalytics />
          },
          {
            path: 'customers',
            element: <CustomerIntelligence />
          },
          {
            path: 'market',
            element: <MarketInsights />
          },
          {
            path: 'engagement',
            element: <EngagementGrowth />
          },
          {
            path: 'cac',
            element: <CACAnalytics />
          },
          {
            path: 'transaction-success-rate',
            element: <TransactionSuccessRate />
          }
        ]
      },
      {
        path: 'messenger',
        element: <Messenger />
      }
    ]
  },
  {
    path: 'management',
    element: <ProtectedRoute><SidebarLayout /></ProtectedRoute>,
    children: [
      {
        path: '',
        element: <Navigate to="transactions" replace />
      },
      {
        path: 'transactions',
        element: <Transactions />
      },
      {
        path: 'payment-setup',
        element: <PaymentSetup />
      },
      {
        path: 'profile',
        children: [
          {
            path: '',
            element: <Navigate to="details" replace />
          },
          {
            path: 'details',
            element: <UserProfile />
          },
          {
            path: 'settings',
            element: <UserSettings />
          }
        ]
      }
    ]
  },
  {
    path: '/components',
    element: <ProtectedRoute><SidebarLayout /></ProtectedRoute>,
    children: [
      {
        path: '',
        element: <Navigate to="buttons" replace />
      },
      {
        path: 'buttons',
        element: <Buttons />
      },
      {
        path: 'modals',
        element: <Modals />
      },
      {
        path: 'accordions',
        element: <Accordions />
      },
      {
        path: 'tabs',
        element: <Tabs />
      },
      {
        path: 'badges',
        element: <Badges />
      },
      {
        path: 'tooltips',
        element: <Tooltips />
      },
      {
        path: 'avatars',
        element: <Avatars />
      },
      {
        path: 'cards',
        element: <Cards />
      },
      {
        path: 'forms',
        element: <Forms />
      }
    ]
  }
];

export default routes;
