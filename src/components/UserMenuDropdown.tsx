import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Phone,
  LogOut,
  Package,
  Settings,
  MapPin,
  ChevronDown,
  MessageCircle,
  Gift,
} from "lucide-react";
import ReferralShareButton from "@/components/ReferralShareButton";
import ProfileSettingsModal from "./ProfileSettingsModal";
import SavedAddressesModal from "./SavedAddressesModal";
import PreferencesModal from "./PreferencesModal";

interface UserMenuDropdownProps {
  currentUser: any;
  onLogout: () => void;
  onViewBookings: () => void;
  onUpdateProfile?: (updatedUser: any) => void;
}

const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  currentUser,
  onLogout,
  onViewBookings,
  onUpdateProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressesModal, setShowAddressesModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhone = (phone: string) => {
    if (phone && phone.startsWith("91") && phone.length === 12) {
      const number = phone.slice(2);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
    return phone || "";
  };

  const handleWhatsAppShare = () => {
    const websiteUrl = window.location.origin;
    const message = `Check out CleanCare Pro - Professional Laundry Services! ${websiteUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleItemClick = (itemId: string, action: () => void) => {
    setClickedItem(itemId);
    // Add a slight delay for the pop effect before executing action
    setTimeout(() => {
      action();
      // Reset clicked state after action
      setTimeout(() => setClickedItem(null), 300);
    }, 150);
  };

  const handleReferralClick = () => {
    setClickedItem("referral");
    // Close the dropdown with a delay to allow the dialog to open properly
    setTimeout(() => {
      setIsOpen(false);
      // Reset clicked state after dropdown closes
      setTimeout(() => setClickedItem(null), 300);
    }, 100);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-auto p-2 hover:bg-green-50 touch-manipulation"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-green-600 text-white text-sm">
                {getInitials(currentUser.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {currentUser.name || "User"}
                </span>
              </div>
              <span className="text-xs text-gray-500 -mt-1">
                {formatPhone(currentUser.phone)}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 sm:w-80 touch-manipulation border-0 shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-green-50/20 backdrop-blur-sm"
        >
          <DropdownMenuLabel className="p-0">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-4 ring-white/30 shadow-lg">
                  <AvatarFallback className="bg-white/20 text-white text-lg font-bold backdrop-blur-sm">
                    {getInitials(currentUser.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-white truncate">
                      {currentUser.name || "User"}
                    </p>
                  </div>
                  <p className="text-sm text-green-100 truncate">
                    {formatPhone(currentUser.phone)}
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-xs text-green-100">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-0" />

          <div className="p-2 space-y-1">
            <DropdownMenuItem
              onClick={() =>
                handleItemClick("bookings", () => {
                  setIsOpen(false);
                  onViewBookings();
                })
              }
              className={`cursor-pointer rounded-xl p-3 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group transform hover:scale-[1.02] ${
                clickedItem === "bookings"
                  ? "scale-110 bg-blue-100 shadow-lg ring-2 ring-blue-300 ring-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-center w-full">
                <div
                  className={`w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 ${
                    clickedItem === "bookings"
                      ? "animate-pulse bg-blue-200 scale-110"
                      : ""
                  }`}
                >
                  <Package
                    className={`h-4 w-4 text-blue-600 transition-all duration-200 ${
                      clickedItem === "bookings" ? "scale-125" : ""
                    }`}
                  />
                </div>
                <span className="font-medium">My Bookings</span>
              </div>
            </DropdownMenuItem>

            <ReferralShareButton
              userId={currentUser.id}
              currentUser={currentUser}
              variant="menu-item"
              className="w-full justify-start p-3 h-auto font-medium hover:bg-green-50 hover:text-green-700 rounded-xl transition-all duration-200 group transform hover:scale-[1.02] cursor-pointer mx-2"
            />

            <DropdownMenuItem
              onClick={() =>
                handleItemClick("profile", () => {
                  setIsOpen(false);
                  setShowProfileModal(true);
                })
              }
              className={`cursor-pointer rounded-xl p-3 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 group transform hover:scale-[1.02] ${
                clickedItem === "profile"
                  ? "scale-110 bg-purple-100 shadow-lg ring-2 ring-purple-300 ring-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-center w-full">
                <div
                  className={`w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 ${
                    clickedItem === "profile"
                      ? "animate-pulse bg-purple-200 scale-110"
                      : ""
                  }`}
                >
                  <User
                    className={`h-4 w-4 text-purple-600 transition-all duration-200 ${
                      clickedItem === "profile" ? "scale-125" : ""
                    }`}
                  />
                </div>
                <span className="font-medium">Profile Settings</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                handleItemClick("addresses", () => {
                  setIsOpen(false);
                  setShowAddressesModal(true);
                })
              }
              className={`cursor-pointer rounded-xl p-3 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 group transform hover:scale-[1.02] ${
                clickedItem === "addresses"
                  ? "scale-110 bg-orange-100 shadow-lg ring-2 ring-orange-300 ring-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-center w-full">
                <div
                  className={`w-8 h-8 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 ${
                    clickedItem === "addresses"
                      ? "animate-pulse bg-orange-200 scale-110"
                      : ""
                  }`}
                >
                  <MapPin
                    className={`h-4 w-4 text-orange-600 transition-all duration-200 ${
                      clickedItem === "addresses" ? "scale-125" : ""
                    }`}
                  />
                </div>
                <span className="font-medium">Saved Addresses</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                handleItemClick("preferences", () => {
                  setIsOpen(false);
                  setShowPreferencesModal(true);
                })
              }
              className={`cursor-pointer rounded-xl p-3 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 group transform hover:scale-[1.02] ${
                clickedItem === "preferences"
                  ? "scale-110 bg-indigo-100 shadow-lg ring-2 ring-indigo-300 ring-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-center w-full">
                <div
                  className={`w-8 h-8 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 ${
                    clickedItem === "preferences"
                      ? "animate-pulse bg-indigo-200 scale-110"
                      : ""
                  }`}
                >
                  <Settings
                    className={`h-4 w-4 text-indigo-600 transition-all duration-200 ${
                      clickedItem === "preferences" ? "scale-125" : ""
                    }`}
                  />
                </div>
                <span className="font-medium">Preferences</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                handleItemClick("share", () => {
                  setIsOpen(false);
                  handleWhatsAppShare();
                })
              }
              className={`cursor-pointer rounded-xl p-3 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 group transform hover:scale-[1.02] ${
                clickedItem === "share"
                  ? "scale-110 bg-emerald-100 shadow-lg ring-2 ring-emerald-300 ring-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-center w-full">
                <div
                  className={`w-8 h-8 bg-emerald-100 group-hover:bg-emerald-200 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 ${
                    clickedItem === "share"
                      ? "animate-pulse bg-emerald-200 scale-110"
                      : ""
                  }`}
                >
                  <MessageCircle
                    className={`h-4 w-4 text-emerald-600 transition-all duration-200 ${
                      clickedItem === "share" ? "scale-125" : ""
                    }`}
                  />
                </div>
                <span className="font-medium">Share with Friends</span>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onUpdateProfile={(updatedUser) => {
          if (onUpdateProfile) {
            onUpdateProfile(updatedUser);
          }
          setShowProfileModal(false);
        }}
        onLogout={onLogout}
      />

      <SavedAddressesModal
        isOpen={showAddressesModal}
        onClose={() => setShowAddressesModal(false)}
        currentUser={currentUser}
      />

      <PreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        currentUser={currentUser}
      />
    </>
  );
};

export default UserMenuDropdown;
