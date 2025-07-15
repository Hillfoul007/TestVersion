import React, { Suspense, lazy } from "react";

// Lazy loading wrapper component for better performance
const LazyWrapper: React.FC<{
  importFunc: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}> = ({
  importFunc,
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  children,
}) => {
  const LazyComponent = lazy(importFunc);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent>{children}</LazyComponent>
    </Suspense>
  );
};

// Pre-defined lazy components for common use cases
export const LazyEnhancedBookingHistory = lazy(
  () => import("./EnhancedBookingHistory"),
);
export const LazyMobileBookingHistory = lazy(
  () => import("./MobileBookingHistory"),
);
export const LazyLaundryCart = lazy(() => import("./LaundryCart"));
export const LazyServiceEditor = lazy(() => import("./ServiceEditor"));

// Loading fallbacks
export const BookingHistoryFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading your bookings...</p>
    </div>
  </div>
);

export const CartFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse bg-gray-200 h-32 w-80 rounded-lg mx-auto mb-4"></div>
      <p className="text-gray-600">Loading cart...</p>
    </div>
  </div>
);

export default LazyWrapper;
