import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  X, 
  Sparkles, 
  Star,
  ArrowRight,
  Users
} from "lucide-react";

interface First30OfferNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
  userName?: string;
}

const First30OfferNotification: React.FC<First30OfferNotificationProps> = ({
  isVisible,
  onDismiss,
  userName
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <Card 
        className={`max-w-sm w-full shadow-2xl border-0 bg-gradient-to-br from-green-50 to-emerald-100 transition-all duration-300 ${
          isAnimating ? 'animate-in slide-in-from-top-4 fade-in' : 'animate-out slide-out-to-top-4 fade-out'
        }`}
      >
        <CardContent className="p-4 relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-white/50 rounded-full"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>

          <div className="space-y-3">
            {/* Header with sparkles */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-full">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-sm">
                  🎉 Welcome{userName ? `, ${userName}` : ''}!
                </h3>
                <p className="text-green-700 text-xs">Special first-time offer</p>
              </div>
            </div>

            {/* Offer details */}
            <div className="bg-white/70 rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  <span className="font-bold text-green-800 text-lg">FIRST30</span>
                </div>
                <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  30% OFF
                </div>
              </div>
              
              <p className="text-green-700 text-sm mb-2">
                Get <span className="font-bold">30% off</span> your first laundry order!
              </p>
              
              <div className="text-xs text-green-600 space-y-1">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>Free pickup & delivery</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Professional eco-friendly cleaning</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs py-2 rounded-lg shadow-lg"
                onClick={() => {
                  // Scroll to services section or trigger booking flow
                  const servicesSection = document.querySelector('[data-section="services"]') || 
                                         document.querySelector('.services-section') ||
                                         document.querySelector('#services');
                  if (servicesSection) {
                    servicesSection.scrollIntoView({ behavior: 'smooth' });
                  }
                  handleDismiss();
                }}
              >
                <Gift className="h-3 w-3 mr-1" />
                Book Now
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="text-green-600 border-green-200 hover:bg-green-50 text-xs py-2 px-3 rounded-lg"
              >
                Maybe Later
              </Button>
            </div>

            {/* Trust indicator */}
            <p className="text-center text-xs text-green-600">
              Code: <span className="font-mono font-bold">FIRST30</span> • No minimum order
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default First30OfferNotification;
