import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Sparkles, X } from "lucide-react";

interface LocationUnavailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedLocation?: string;
  onExplore: () => void;
}

const LocationUnavailableModal: React.FC<LocationUnavailableModalProps> = ({
  isOpen,
  onClose,
  detectedLocation,
  onExplore,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[90vw] mx-auto border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center py-6 px-2">
          {/* Icon with Green Theme */}
          <div className="mx-auto mb-6 relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="h-10 w-10 text-white" />
            </div>
            {/* Decorative sparkles */}
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              Service Not Available
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base leading-relaxed">
              We're not available in your location yet, but we're expanding
              soon!
              {detectedLocation && (
                <div className="mt-2 text-sm text-green-600 font-medium">
                  📍 {detectedLocation}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Current Coverage Info */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 border border-green-100">
            <div className="text-sm text-green-800 font-medium mb-1">
              🏠 Currently Serving
            </div>
            <div className="text-green-700 font-semibold">
              Sector 69, Gurgaon
            </div>
            <div className="text-xs text-green-600 mt-1">
              More locations coming soon!
            </div>
          </div>

          {/* Action Button */}
          <DialogFooter className="flex flex-col gap-3">
            <Button
              onClick={() => {
                onExplore();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-base"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Explore Available Services
            </Button>

            {/* Secondary Action */}
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Maybe Later
            </Button>
          </DialogFooter>

          {/* Footer Note */}
          <div className="mt-4 text-xs text-gray-500">
            💚 We'll notify you when we reach your area
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationUnavailableModal;
