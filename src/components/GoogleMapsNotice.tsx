import React from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';

interface GoogleMapsNoticeProps {
  className?: string;
}

const GoogleMapsNotice: React.FC<GoogleMapsNoticeProps> = ({ className = "" }) => {
  const isGoogleMapsConfigured = Boolean(process.env.REACT_APP_GOOGLE_MAPS_API_KEY?.trim());

  if (isGoogleMapsConfigured) {
    return null; // Don't show notice if Google Maps is properly configured
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Limited search functionality:</span> Google Maps API not configured. 
            Address search is using fallback suggestions.
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-amber-700">
            <MapPin className="h-3 w-3" />
            <span>You can still add addresses manually</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsNotice;
