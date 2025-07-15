import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  X,
  Plus,
  Home,
  Building2,
  MapPin,
  MoreHorizontal,
  ArrowRight,
  Phone,
  Edit,
  Trash2,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface SavedAddress {
  id: string;
  type: "home" | "office" | "other";
  label?: string;
  flatNo: string;
  fullAddress: string;
  landmark?: string;
  phone?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
}

interface ZomatoAddressSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: SavedAddress) => void;
  onAddNewAddress: () => void;
  onEditAddress?: (address: SavedAddress) => void;
  currentUser?: any;
  selectedAddressId?: string;
}

const ZomatoAddressSelector: React.FC<ZomatoAddressSelectorProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
  onAddNewAddress,
  onEditAddress,
  currentUser,
  selectedAddressId,
}) => {
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadSavedAddresses();
    }
  }, [isOpen, currentUser]);

  const loadSavedAddresses = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Try to load from backend first using apiClient
      const userId = currentUser._id || currentUser.id || currentUser.phone;

      const response = await apiClient.getAddresses(userId);

      if (response.data) {
        // Transform backend format to frontend format
        const transformedAddresses = response.data.map((addr: any) => ({
          id: addr._id,
          type: addr.address_type || "other",
          label: addr.title,
          flatNo: addr.full_address.split(",")[0] || "",
          fullAddress: addr.full_address,
          landmark: addr.landmark || "",
          phone: addr.contact_phone || currentUser.phone,
          coordinates: addr.coordinates,
          createdAt: addr.created_at,
        }));
        setSavedAddresses(transformedAddresses);
        setLoading(false);
        return;
      }

      // Fallback to localStorage if backend fails
      console.log("Falling back to localStorage for addresses");
      const savedAddressesKey = `addresses_${userId}`;
      const addresses = JSON.parse(
        localStorage.getItem(savedAddressesKey) || "[]",
      );
      setSavedAddresses(addresses);
    } catch (error) {
      console.error("Error loading addresses:", error);
      // Fallback to localStorage
      const userId = currentUser._id || currentUser.id || currentUser.phone;
      const savedAddressesKey = `addresses_${userId}`;
      const addresses = JSON.parse(
        localStorage.getItem(savedAddressesKey) || "[]",
      );
      setSavedAddresses(addresses);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!currentUser) return;

    try {
      const userId = currentUser._id || currentUser.id || currentUser.phone;
      const response = await apiClient.deleteAddress(userId, addressId);

      if (response.data) {
        // Remove from state
        setSavedAddresses((prev) =>
          prev.filter((addr) => addr.id !== addressId),
        );

        // Also remove from localStorage as backup
        const savedAddressesKey = `addresses_${userId}`;
        const localAddresses = JSON.parse(
          localStorage.getItem(savedAddressesKey) || "[]",
        );
        const updatedLocalAddresses = localAddresses.filter(
          (addr: any) => addr.id !== addressId,
        );
        localStorage.setItem(
          savedAddressesKey,
          JSON.stringify(updatedLocalAddresses),
        );
      } else {
        console.error("Failed to delete address from backend");
        // Still try to remove from localStorage
        const savedAddressesKey = `addresses_${userId}`;
        const localAddresses = JSON.parse(
          localStorage.getItem(savedAddressesKey) || "[]",
        );
        const updatedLocalAddresses = localAddresses.filter(
          (addr: any) => addr.id !== addressId,
        );
        localStorage.setItem(
          savedAddressesKey,
          JSON.stringify(updatedLocalAddresses),
        );
        setSavedAddresses((prev) =>
          prev.filter((addr) => addr.id !== addressId),
        );
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="h-4 w-4" />;
      case "office":
        return <Building2 className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case "home":
        return "Home";
      case "office":
        return "Work";
      default:
        return "Other";
    }
  };

  const formatDistance = (address: SavedAddress) => {
    // Mock distance calculation - in real app, calculate from user's current location
    return "0 m";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Select an address
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Add Address Button */}
        <div className="p-4 border-b border-gray-100">
          <Button
            onClick={onAddNewAddress}
            variant="ghost"
            className="w-full h-14 justify-start text-green-600 hover:bg-green-50"
          >
            <Plus className="h-5 w-5 mr-3 text-green-600" />
            <span className="font-medium">Add Address</span>
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                SAVED ADDRESSES
              </h3>
              <p className="text-sm text-blue-600 font-medium">DELIVERS TO</p>
            </div>

            <div className="space-y-3">
              {savedAddresses.map((address) => (
                <Card
                  key={address.id}
                  className={`border cursor-pointer transition-all ${
                    selectedAddressId === address.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onSelectAddress(address)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Address Type and Distance */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {getAddressIcon(address.type)}
                            <span className="font-medium text-gray-900">
                              {getAddressTypeLabel(address.type)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDistance(address)}
                          </span>
                        </div>

                        {/* Address Details */}
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700">
                            {address.flatNo && `${address.flatNo}, `}
                            {address.fullAddress}
                          </p>

                          {address.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>Phone number: {address.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 sm:text-gray-400 sm:hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditAddress) {
                                  onEditAddress(address);
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(address.id);
                              }}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAddress(address);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {savedAddresses.length === 0 && (
          <div className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No saved addresses
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first address to get started
            </p>
            <Button
              onClick={onAddNewAddress}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        )}

        {/* Powered by Google */}
        <div className="p-4 text-center border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <span>powered by</span>
            <span className="font-medium">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZomatoAddressSelector;
