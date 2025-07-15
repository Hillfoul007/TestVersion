import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Save, X, LogOut, Gift, Copy, Calendar } from "lucide-react";
import { ReferralService } from "@/services/referralService";
import { useToast } from "@/hooks/use-toast";
import UserService from "@/services/userService";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdateProfile: (updatedUser: any) => void;
  onLogout?: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
  });
  const { toast } = useToast();
  const userService = UserService.getInstance();

  const referralService = ReferralService.getInstance();
  const userCoupons = referralService.getUserCoupons(currentUser);
  const userReferralCode = referralService.generateReferralCode(currentUser);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedUser = await userService.updateUser(
        currentUser.phone,
        formData,
      );
      if (updatedUser) {
        onUpdateProfile(updatedUser);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[95vw] mx-4 sm:mx-auto border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-green-50/30 animate-in zoom-in-95 duration-300 fade-in-0">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Profile Settings
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24 shadow-xl ring-4 ring-green-100 ring-offset-4 ring-offset-white transition-all duration-300 hover:ring-green-200 hover:shadow-2xl">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-2xl font-bold">
                  {getInitials(formData.name || "User")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
                <Edit className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            <div className="group">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700 mb-2 block"
              >
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
                className={`transition-all duration-200 rounded-xl border-2 ${
                  !isEditing
                    ? "bg-gray-50/80 border-gray-200 text-gray-600"
                    : "bg-white border-green-200 focus:border-green-400 focus:ring-green-400/20 shadow-sm hover:shadow-md"
                }`}
              />
            </div>

            <div className="group">
              <Label
                htmlFor="phone"
                className="text-sm font-semibold text-gray-700 mb-2 block"
              >
                Phone Number
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                disabled={true}
                className="bg-gray-50/80 border-2 border-gray-200 text-gray-600 rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                Phone number cannot be changed
              </p>
            </div>

            <div className="group">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-gray-700 mb-2 block"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your email address"
                className={`transition-all duration-200 rounded-xl border-2 ${
                  !isEditing
                    ? "bg-gray-50/80 border-gray-200 text-gray-600"
                    : "bg-white border-green-200 focus:border-green-400 focus:ring-green-400/20 shadow-sm hover:shadow-md"
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-semibold py-3 rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {/* Offers & Coupons Section */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Offers & Coupons
              </h3>
            </div>

            {/* Your Referral Code */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Your Referral Code
                  </h4>
                  <p className="text-sm text-gray-600">
                    Share with friends to earn rewards
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white px-3 py-2 rounded-lg border border-green-300 font-mono text-green-700 font-bold">
                    {userReferralCode}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(userReferralCode);
                      toast({
                        title: "Copied!",
                        description: "Referral code copied to clipboard",
                      });
                    }}
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Available Coupons */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Available Coupons</h4>
              {userCoupons.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userCoupons.map((coupon, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        coupon.type === "referral"
                          ? "bg-purple-50 border-purple-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm">
                              {coupon.code}
                            </span>
                            {coupon.type === "referral" && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                Referral Bonus
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {coupon.description}
                          </p>
                          {coupon.expiresAt && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Expires:{" "}
                              {new Date(coupon.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            toast({
                              title: "Copied!",
                              description: "Coupon code copied to clipboard",
                            });
                          }}
                          className="text-xs"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Gift className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No coupons available</p>
                  <p className="text-xs">
                    Refer friends to earn coupon rewards!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          {onLogout && (
            <div className="pt-6 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent">
              <Button
                onClick={() => {
                  // Use iOS fixes for logout
                  import("../utils/iosAuthFix").then(
                    ({ clearIosAuthState }) => {
                      clearIosAuthState();
                    },
                  );
                  onLogout();
                  onClose();
                }}
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-2 border-red-200 hover:border-red-300 font-semibold py-3 rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettingsModal;
