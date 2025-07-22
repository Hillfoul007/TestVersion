import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PhoneOtpAuthModal from "@/components/PhoneOtpAuthModal";
import { DVHostingSmsService } from "@/services/dvhostingSmsService";
import { ReferralService } from "@/services/referralService";
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

const ReferralLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const { addNotification } = useNotifications();
  const dvhostingSmsService = DVHostingSmsService.getInstance();
  const referralService = ReferralService.getInstance();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const currentUser = dvhostingSmsService.getCurrentUser();
      
      if (currentUser) {
        // User is already logged in, redirect to home with referral notification
        const ref = searchParams.get("ref") || searchParams.get("referral");
        if (ref) {
          addNotification(
            createSuccessNotification(
              "Welcome Back!",
              `You're already logged in! Use referral code ${ref} on your next order.`
            )
          );
        }
        navigate("/");
        return;
      }

      // Extract referral code from URL
      const ref = searchParams.get("ref") || searchParams.get("referral");
      if (ref) {
        setReferralCode(ref);
        // Store it for later use during auth
        referralService.storeReferralCode(ref);
      }

      // Auto-open auth modal for referral links
      setIsAuthModalOpen(true);
    };

    checkAuthAndRedirect();
  }, [searchParams, navigate, addNotification, dvhostingSmsService, referralService]);

  const handleAuthSuccess = (user: any) => {
    console.log("🎉 Auth successful for referral user:", user);
    
    // Check if this is a new user for FIRST30 notification
    const isFirstTime = referralService.isFirstTimeUser(user);
    setIsNewUser(isFirstTime);

    // Set flag for showing FIRST30 notification on home screen
    if (isFirstTime) {
      localStorage.setItem("show_first30_notification", "true");
    }

    addNotification(
      createSuccessNotification(
        "Welcome to CleanCare Pro!",
        referralCode 
          ? `Great! You'll get discounts with referral code ${referralCode}`
          : "You're all set to book your first service!"
      )
    );

    // Navigate to home
    navigate("/");
  };

  const benefits = [
    {
      icon: <Gift className="h-6 w-6 text-laundrify-red" />,
      title: "50% Off First Order",
      description: "Get amazing savings on your first laundry service"
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
          
          {referralCode && (
            <div className="bg-gradient-to-r from-laundrify-mint/20 to-laundrify-purple/20 border border-laundrify-mint rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-laundrify-blue" />
                <span className="font-semibold text-laundrify-blue">Special Offer!</span>
              </div>
              <p className="text-laundrify-blue">
                You've been invited with referral code: <span className="font-bold text-laundrify-blue">{referralCode}</span>
              </p>
              <p className="text-laundrify-blue text-sm mt-1">
                Sign in to get 50% off your first order!
              </p>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Benefits */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {referralCode ? "Welcome to Our Family!" : "Join CleanCare Pro"}
                </h2>
                <p className="text-gray-600">
                  {referralCode 
                    ? "A friend has invited you to experience premium laundry service with exclusive benefits!"
                    : "Experience premium laundry service with amazing benefits"
                  }
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
                    Sign In to Get Started
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    {referralCode 
                      ? "Login to claim your 50% discount!"
                      : "Quick sign-in with your phone number"
                    }
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

                  {referralCode && (
                    <div className="bg-laundrify-mint/20 border border-laundrify-mint rounded-lg p-3">
                      <div className="flex items-center gap-2 text-laundrify-blue">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Referral code {referralCode} will be automatically applied
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <Button
                      variant="link"
                      onClick={() => navigate("/")}
                      className="text-gray-500 text-sm"
                    >
                      Continue to website instead
                    </Button>
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
                <Check className="h-5 w-5 text-green-600" />
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

export default ReferralLoginPage;
