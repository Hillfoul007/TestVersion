import React, { useState, useEffect, useRef } from "react";
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
import { logAuthEvent } from "@/utils/iosAuthDebug";

const ForceLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true); // Auto-open auth modal
  const { addNotification } = useNotifications();
  const isNavigatingRef = useRef(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Prevent iOS auto-refresh and session restoration interference
  useEffect(() => {
    if (isIOS) {
      console.log("🍎 ForceLoginPage: Initializing iOS stability measures");

      // Prevent automatic auth restoration on this page
      localStorage.setItem("force_login_active", "true");

      // Disable page restoration from cache - but avoid infinite reload
      if ('pageshow' in window) {
        const handlePageShow = (event: PageTransitionEvent) => {
          if (event.persisted && !isNavigatingRef.current) {
            console.log("🍎 ForceLoginPage: iOS page cache restoration detected");

            // Check if we just reloaded recently to prevent infinite loops
            const lastReload = localStorage.getItem('ios_force_login_reload');
            const now = Date.now();
            if (lastReload && (now - parseInt(lastReload)) < 3000) {
              console.log("🍎 ForceLoginPage: Skipping reload - too recent");
              return;
            }

            // Mark reload timestamp to prevent loops
            localStorage.setItem('ios_force_login_reload', now.toString());
            console.log("🍎 ForceLoginPage: Performing controlled reload to clear cache");

            // Use replace instead of reload to avoid history stack issues
            window.location.replace(window.location.href);
          }
        };

        window.addEventListener('pageshow', handlePageShow);

        return () => {
          window.removeEventListener('pageshow', handlePageShow);
        };
      }
    }
  }, [isIOS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem("force_login_active");
      localStorage.removeItem("ios_force_login_reload");
    };
  }, []);

  const handleAuthSuccess = async (user: any) => {
    console.log("🎉 Auth successful:", user);
    logAuthEvent('force_login_auth_success', { user });

    // Close the auth modal first to prevent any UI conflicts
    setIsAuthModalOpen(false);

    addNotification(
      createSuccessNotification(
        "Welcome to Laundrify!",
        "You're all set to book your first service!"
      )
    );

    // For iOS devices, add enhanced auth persistence and navigation handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    try {
      // Always ensure auth data is properly saved regardless of platform
      const authToken = `user_token_${user.phone || user.id}_persistent`;
      const userStr = JSON.stringify(user);

      // Set all auth data with multiple redundancy
      localStorage.setItem("current_user", userStr);
      localStorage.setItem("cleancare_user", userStr);
      localStorage.setItem("auth_token", authToken);
      localStorage.setItem("cleancare_auth_token", authToken);

      // Clear any iOS logout flags that might interfere
      localStorage.removeItem("ios_intentional_logout");
      localStorage.removeItem("ios_logout_timestamp");

      console.log("✅ Auth state saved with redundancy");

      if (isIOS) {
        console.log("🍎 iOS device detected - using enhanced navigation strategy");

        // For iOS, use a more reliable navigation method with better timing
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Verify auth persisted properly
        const savedUser = localStorage.getItem("current_user");
        const savedToken = localStorage.getItem("auth_token");

        if (!savedUser || !savedToken) {
          console.warn("🍎⚠️ Re-attempting auth save...");
          localStorage.setItem("current_user", userStr);
          localStorage.setItem("cleancare_user", userStr);
          localStorage.setItem("auth_token", authToken);
          localStorage.setItem("cleancare_auth_token", authToken);

          // Wait a bit more after re-save
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Clear force login flags before navigation
        localStorage.removeItem("force_login_active");
        localStorage.removeItem("ios_force_login_reload");
        logAuthEvent('force_login_flags_cleared');

        // Mark that we're navigating
        isNavigatingRef.current = true;

        console.log("🍎 Navigating to home page via React Router...");
        logAuthEvent('force_login_navigation_start', { method: 'react_router' });

        // Try React Router first for better SPA experience
        try {
          navigate("/", { replace: true });
          logAuthEvent('force_login_react_router_called');

          // Fallback to window.location if React Router fails
          setTimeout(() => {
            if (window.location.pathname === "/force-login") {
              console.log("🍎 React Router navigation failed, using window.location");
              logAuthEvent('force_login_fallback_to_window_location');
              window.location.href = "/";
            } else {
              logAuthEvent('force_login_react_router_success');
            }
          }, 1000);
        } catch (navError) {
          console.warn("🍎 React Router failed, using window.location:", navError);
          logAuthEvent('force_login_react_router_error', { error: navError?.toString() });
          window.location.href = "/";
        }

        return;
      }

      // For non-iOS devices, use standard navigation after short delay
      await new Promise(resolve => setTimeout(resolve, 300));
      isNavigatingRef.current = true;
      navigate("/");

    } catch (error) {
      console.error("❌ Error in auth success handler:", error);
      // Fallback navigation
      isNavigatingRef.current = true;
      window.location.href = "/";
    }
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
