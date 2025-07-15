import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Clock,
  User,
  Phone,
  Calendar,
  Loader2,
  CreditCard,
  Home,
  DollarSign,
  CheckCircle,
  Tag,
  Utensils,
  Package,
  Timer,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  createSuccessNotification,
  createErrorNotification,
  createWarningNotification,
} from "@/utils/notificationUtils";
import DynamicServicesService from "@/services/dynamicServicesService";
import type { DynamicLaundryService } from "@/services/dynamicServicesService";
import SimplifiedAddressForm from "./SimplifiedAddressForm";
import ProfessionalDateTimePicker from "./ProfessionalDateTimePicker";
import { FormValidation, validateCheckoutForm } from "./FormValidation";
import SavedAddressesModal from "./SavedAddressesModal";

interface ZomatoStyleCartProps {
  onBack: () => void;
  onProceedToCheckout: (cartData: any) => void;
  onLoginRequired?: () => void;
  currentUser?: any;
}

const ZomatoStyleCart: React.FC<ZomatoStyleCartProps> = ({
  onBack,
  onProceedToCheckout,
  onLoginRequired,
  currentUser,
}) => {
  const { addNotification } = useNotifications();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [services, setServices] = useState<DynamicLaundryService[]>([]);
  const [addressData, setAddressData] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState(0);

  const dynamicServicesService = DynamicServicesService.getInstance();

  // Load services and cart data
  useEffect(() => {
    loadServices();
    loadCartData();

    if (currentUser) {
      setPhoneNumber(currentUser.phone || "");
    }
  }, [currentUser]);

  const loadServices = async () => {
    try {
      const allServices = await dynamicServicesService.getSortedServices();
      setServices(allServices);
    } catch (error) {
      console.error("Failed to load services:", error);
    }
  };

  const loadCartData = () => {
    const savedCart = localStorage.getItem("laundry_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("laundry_cart", JSON.stringify(cart));
    calculateSavings();
  }, [cart]);

  // Listen for cart clearing events
  useEffect(() => {
    const handleClearCart = () => {
      setCart({});
      localStorage.removeItem("laundry_cart");
    };

    window.addEventListener("clearCart", handleClearCart);
    return () => window.removeEventListener("clearCart", handleClearCart);
  }, []);

  const calculateSavings = () => {
    const cartItems = getCartItems();
    let totalSavings = 0;

    cartItems.forEach(({ service, quantity }) => {
      if (service && service.popular) {
        // Assume 10% savings on popular items
        totalSavings += service.price * quantity * 0.1;
      }
    });

    setSavingsAmount(Math.round(totalSavings));
  };

  const getServiceById = (id: string): DynamicLaundryService | undefined => {
    return services.find((service) => service.id === id);
  };

  const getCartItems = () => {
    return Object.entries(cart)
      .map(([serviceId, quantity]) => ({
        service: getServiceById(serviceId),
        quantity,
      }))
      .filter((item) => item.service && item.quantity > 0);
  };

  const getSubtotal = () => {
    return getCartItems().reduce((total, item) => {
      return total + item.service!.price * item.quantity;
    }, 0);
  };

  const getDeliveryCharge = () => {
    return 0; // Free delivery
  };

  const getHandlingFee = () => {
    return 0; // Free handling fee as shown in UI
  };

  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getSubtotal();
    return Math.round(subtotal * (appliedCoupon.discount / 100));
  };

  const getTotal = () => {
    return (
      getSubtotal() +
      getDeliveryCharge() +
      getHandlingFee() -
      getCouponDiscount()
    );
  };

  const applyCoupon = () => {
    const validCoupons = {
      FIRST10: { discount: 10, description: "10% off on first order" },
      SAVE20: { discount: 20, description: "20% off" },
      WELCOME5: { discount: 5, description: "5% welcome discount" },
      UPTO50: { discount: 50, description: "Upto 50% OFF applied!" },
    };

    const coupon = validCoupons[couponCode.toUpperCase()];
    if (coupon) {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discount: coupon.discount,
      });
      addNotification(
        createSuccessNotification("Coupon Applied", coupon.description),
      );
    } else {
      addNotification(
        createErrorNotification(
          "Invalid Coupon",
          "The coupon code you entered is not valid.",
        ),
      );
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const updateQuantity = (serviceId: string, change: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      const currentQuantity = newCart[serviceId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);

      if (newQuantity === 0) {
        delete newCart[serviceId];
      } else {
        newCart[serviceId] = newQuantity;
      }

      return newCart;
    });
  };

  const removeItem = (serviceId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[serviceId];
      return newCart;
    });
  };

  const handleProceedToCheckout = async () => {
    if (isProcessingCheckout) return;

    setIsProcessingCheckout(true);

    try {
      if (!currentUser) {
        if (onLoginRequired) onLoginRequired();
        return;
      }

      const errors = validateCheckoutForm(
        currentUser,
        addressData,
        phoneNumber,
        selectedDate,
        selectedTime,
      );

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      setValidationErrors([]);

      const cartItems = getCartItems();
      const services = cartItems.map((item) => ({
        id: item.service!.id,
        name: item.service!.name,
        category: item.service!.category,
        price: item.service!.price,
        quantity: item.quantity,
      }));

      const deliveryDate = new Date(selectedDate);
      deliveryDate.setDate(deliveryDate.getDate() + 2);

      const orderData = {
        services,
        totalAmount: getTotal(),
        pickupDate: selectedDate.toISOString().split("T")[0],
        deliveryDate: deliveryDate.toISOString().split("T")[0],
        pickupTime: selectedTime,
        deliveryTime: selectedTime,
        address: addressData,
        phone: phoneNumber || currentUser?.phone,
        instructions: specialInstructions,
      };

      await onProceedToCheckout(orderData);

      localStorage.removeItem("laundry_cart");
      setCart({});
    } catch (error) {
      console.error("Checkout failed:", error);
      addNotification(
        createErrorNotification(
          "Checkout Failed",
          "Unable to process your order. Please try again.",
        ),
      );
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const cartItems = getCartItems();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-4 sticky top-0 z-10">
          <Button variant="ghost" onClick={onBack} className="p-0 h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Cart</h1>
        </div>

        <div className="flex flex-col items-center justify-center h-96 px-4">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Add some items to get started
          </p>
          <Button onClick={onBack} className="bg-green-600 hover:bg-green-700">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Zomato Style */}
      <div className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-0 h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">CleanCare Pro</h1>
            <p className="text-sm text-gray-600">25-30 mins to Home</p>
          </div>
        </div>
      </div>

      {/* Savings Banner - Zomato Style */}
      {savingsAmount > 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 px-4 py-3 mx-4 my-2 rounded-r-lg">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              You saved ₹{savingsAmount} on this order
            </span>
          </div>
        </div>
      )}

      <div className="px-4 space-y-4 pb-32">
        {/* Cart Items */}
        <div className="space-y-3">
          {cartItems.map(({ service, quantity }) => (
            <Card key={service!.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Service Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {service!.image ? (
                      <img
                        src={service!.image}
                        alt={service!.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    {/* Fallback icon */}
                    <div
                      className={`w-full h-full flex items-center justify-center text-gray-400 ${service!.image ? "hidden" : ""}`}
                    >
                      <Package className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {service!.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                      NOT ELIGIBLE FOR COUPONS
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(service!.id, -1)}
                          className="h-8 w-8 p-0 rounded-md border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium min-w-[20px] text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(service!.id, 1)}
                          className="h-8 w-8 p-0 rounded-md border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ��{service!.price * quantity}
                        </div>
                        {quantity > 1 && (
                          <div className="text-xs text-gray-500">
                            ₹{service!.price} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add More Items */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full text-green-600 border border-green-600 hover:bg-green-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add more items
        </Button>

        {/* Special Instructions */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Don't send cutlery</span>
            </div>
          </CardContent>
        </Card>

        {/* Coupons Section - Zomato Style */}
        {!appliedCoupon ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Apply Coupon</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    applyCoupon();
                  }}
                  variant="outline"
                  disabled={!couponCode.trim()}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  type="button"
                >
                  Apply
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Try "UPTO50" for up to 50% off!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Upto {appliedCoupon.discount}% OFF applied!
                  </span>
                </div>
                <Button
                  onClick={removeCoupon}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:bg-green-100"
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Time */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Delivery in 25-30 mins</span>
            </div>
            <p className="text-sm text-gray-600">
              Want this later? Schedule it
            </p>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Delivery at Home</span>
              </div>
              <Button variant="ghost" size="sm" className="text-green-600">
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
            {addressData ? (
              <p className="text-sm text-gray-600">
                {addressData.fullAddress || "Address not specified"}
              </p>
            ) : (
              <SimplifiedAddressForm
                onAddressChange={setAddressData}
                initialAddress={addressData}
              />
            )}
            <p className="text-sm text-green-600 mt-2">
              Add instructions for delivery partner
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-gray-600" />
              <span className="font-medium">
                Contact: {currentUser?.name || phoneNumber}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Pickup */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Schedule Pickup</span>
            </div>
            <ProfessionalDateTimePicker
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateChange={setSelectedDate}
              onTimeChange={setSelectedTime}
            />
          </CardContent>
        </Card>

        {/* Bill Details - Zomato Style */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Total Bill ₹{getSubtotal()}</span>
              <span className="text-sm text-green-600 font-medium">
                ₹{getTotal()}
              </span>
              <Button variant="ghost" size="sm" className="ml-auto">
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Item Total</span>
                <span>₹{getSubtotal()}</span>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Delivery Fee</span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-gray-400 text-sm">
                    ₹30
                  </span>
                  <span className="font-medium">FREE</span>
                </div>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Handling Fee</span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-gray-400 text-sm">₹9</span>
                  <span className="font-medium">FREE</span>
                </div>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-₹{getCouponDiscount()}</span>
                </div>
              )}

              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Grand Total</span>
                <span>₹{getTotal()}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Incl. taxes and charges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="fixed top-20 left-0 right-0 mx-4 z-20">
          <FormValidation errors={validationErrors} />
        </div>
      )}

      {/* Fixed Bottom Payment Button - Zomato Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 safe-area-bottom">
        <Button
          onClick={handleProceedToCheckout}
          disabled={cartItems.length === 0 || isProcessingCheckout}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessingCheckout ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>Proceed to Pay ₹{getTotal()}</>
          )}
        </Button>

        {/* Donation Section - Zomato Style */}
        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xl">👨‍👩‍👧‍👦</span>
              </div>
              <div>
                <p className="font-medium text-orange-800 text-sm">
                  Let's serve a brighter future
                </p>
                <p className="text-xs text-orange-600">
                  Through nutritious meals, you can empower young minds for
                  greatness
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="font-semibold text-orange-800">
                Donate to Feeding India
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-800">₹2</span>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-600 text-orange-600 hover:bg-orange-100"
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 text-sm mb-2">
            CANCELLATION POLICY
          </h4>
          <p className="text-xs text-gray-600">
            Help us reduce food waste by avoiding cancellations. The amount paid
            is non-refundable after placing the order.
          </p>
        </div>
      </div>

      {/* Payment Options - Zomato Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-2 border-t">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">Z</span>
          </div>
          <span className="text-sm font-medium">Zomato Money</span>
          <Badge
            variant="secondary"
            className="text-xs bg-red-100 text-red-600"
          >
            NEW
          </Badge>
        </div>
        <p className="text-xs text-gray-600">
          Single tap payments. Zero failures
        </p>
      </div>

      {/* Saved Addresses Modal */}
      <SavedAddressesModal
        isOpen={showSavedAddresses}
        onClose={() => setShowSavedAddresses(false)}
        onSelectAddress={(address) => {
          setAddressData(address);
          setShowSavedAddresses(false);
        }}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ZomatoStyleCart;
