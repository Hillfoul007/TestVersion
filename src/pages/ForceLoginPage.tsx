import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PhoneOtpAuthModal from "@/components/PhoneOtpAuthModal";
import { useNotifications } from "@/contexts/NotificationContext";
import { createSuccessNotification } from "@/utils/notificationUtils";
import { 
  Gift, 
  Phone, 
  Users, 
  ArrowRight, 
  Star,
  Check,
  Sparkles 
} from "lucide-react";

const ForceLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true); // Auto-open auth modal
  const { addNotification } = useNotifications();

  const handleAuthSuccess = (user: any) => {
    console.log("🎉 Auth successful:", user);
    
    addNotification(
      createSuccessNotification(
        "Welcome to Laundrify!",
        "You're all set to book your first service!"
      )
    );

    // Navigate to home
    navigate("/");
  };

  const benefits = [
    {
      icon: <Gift className="h-6 w-6 text-laundrify-red" />,
      title: "Quick & Convenient",
      description: "Professional laundry service at your doorstep"
    },
    {
      icon: <Phone className="h-6 w-6 text-blue-600" />,
      title: "Free Pickup & Delivery",
      description: "Convenient door-to-door service at no extra cost"
    },
    {
      icon: <Star className="h-6 w-6 text-yellow-600" />,
      title: "Premium Quality",
      description: "Professional cleaning with eco-friendly products"
    },
    {
      icon: <Users className="h-6 w-6 text-purple-600" />,
      title: "Refer & Earn",
      description: "Earn rewards by referring friends and family"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-laundrify-purple/10 via-laundrify-pink/10 to-laundrify-mint/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-to-r from-laundrify-purple to-laundrify-pink p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-laundrify-purple to-laundrify-pink bg-clip-text text-transparent">
              Laundrify
            </h1>
          </div>
          
          <div className="bg-gradient-to-r from-laundrify-mint/20 to-laundrify-purple/20 border border-laundrify-mint rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-laundrify-blue" />
              <span className="font-semibold text-laundrify-blue">Welcome to Laundrify!</span>
            </div>
            <p className="text-laundrify-blue">
              Please sign in to start using our laundry services
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Benefits */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Join Laundrify Today
                </h2>
                <p className="text-gray-600">
                  Experience premium laundry service with amazing benefits
                </p>
              </div>

              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Login Card */}
            <div>
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Sign In Required
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    Quick sign-in with your phone number to continue
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full bg-gradient-to-r from-laundrify-purple to-laundrify-pink hover:from-laundrify-purple/90 hover:to-laundrify-pink/90 text-white py-3 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                    size="lg"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Sign In with Phone
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-laundrify-mint/40 p-2 rounded-full">
                <Check className="h-5 w-5 text-laundrify-blue" />
              </div>
              <span>Trusted by 10,000+ customers</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <span>4.8/5 average rating</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-full">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <span>24/7 customer support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <PhoneOtpAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default ForceLoginPage;
