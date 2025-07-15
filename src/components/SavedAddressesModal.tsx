import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building2,
  Navigation,
  X,
  MoreHorizontal,
  ArrowRight,
  Phone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ZomatoAddAddressPage from "./ZomatoAddAddressPage";
import { AddressService } from "@/services/addressService";

interface AddressData {
  flatNo: string;
  flatHouseNo?: string;
  street: string;
  landmark: string;
  village: string;
  city: string;
  pincode: string;
  fullAddress: string;
  coordinates?: { lat: number; lng: number };
  label: string;
  type: "home" | "work" | "other";
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SavedAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (address: AddressData) => void;
  currentUser?: any;
}

const SavedAddressesModal: React.FC<SavedAddressesModalProps> = React.memo(
  ({ isOpen, onClose, onSelectAddress, currentUser }) => {
    const [addresses, setAddresses] = useState<AddressData[]>([]);
    const [showAddAddressPage, setShowAddAddressPage] = useState(false);
    const [editingAddress, setEditingAddress] = useState<AddressData | null>(
      null,
    );
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
      null,
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
      if (isOpen) {
        loadSavedAddresses();
      }
    }, [isOpen, currentUser]);

    const loadSavedAddresses = () => {
      if (!currentUser?.id && !currentUser?._id && !currentUser?.phone) return;

      const userId = currentUser._id || currentUser.id || currentUser.phone;
      const savedAddresses = localStorage.getItem(`addresses_${userId}`);

      if (savedAddresses) {
        try {
          const parsedAddresses = JSON.parse(savedAddresses);
          setAddresses(Array.isArray(parsedAddresses) ? parsedAddresses : []);
        } catch (error) {
          console.error("Error parsing saved addresses:", error);
          setAddresses([]);
        }
      } else {
        setAddresses([]);
      }
    };

    const saveAddresses = (newAddresses: AddressData[]) => {
      if (!currentUser?.id && !currentUser?._id && !currentUser?.phone) return;

      const userId = currentUser._id || currentUser.id || currentUser.phone;
      localStorage.setItem(`addresses_${userId}`, JSON.stringify(newAddresses));
      setAddresses(newAddresses);
    };

    const handleNewAddressSave = (newAddress: any) => {
      if (!currentUser) return;

      try {
        const addressWithId = {
          ...newAddress,
          id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedAddresses = [...addresses, addressWithId];
        saveAddresses(updatedAddresses);

        setShowAddAddressPage(false);
        console.log("✅ New address saved successfully");
      } catch (error) {
        console.error("Failed to save new address:", error);
      }
    };

    const handleEditAddress = (updatedAddress: AddressData) => {
      if (!editingAddress?.id) {
        console.error("No editing address ID found");
        return;
      }

      console.log("💾 Saving edited address:", editingAddress.id);

      const updatedAddresses = addresses.map((addr) =>
        addr.id === editingAddress.id
          ? {
              ...updatedAddress,
              id: editingAddress.id,
              createdAt: editingAddress.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : addr,
      );

      saveAddresses(updatedAddresses);
      setEditingAddress(null);
      setShowAddAddressPage(false);
      console.log("✅ Address updated successfully");
    };

    const handleDeleteAddress = async (id: string) => {
      if (!id) {
        console.error("No address ID provided for deletion");
        setDeletingId(null);
        return;
      }

      try {
        console.log("🗑️ Deleting address with ID:", id);

        // Immediately remove from UI for better UX
        const updatedAddresses = addresses.filter(
          (addr) => addr.id !== id && addr._id !== id,
        );

        // Update localStorage first
        saveAddresses(updatedAddresses);

        // Try to delete from backend (don't await to avoid blocking UI)
        const addressService = AddressService.getInstance();
        addressService
          .deleteAddress(id)
          .then((result) => {
            if (result.success) {
              console.log("✅ Address deleted from backend:", result.message);
            } else {
              console.warn(
                "⚠️ Backend deletion failed, but local deletion succeeded:",
                result.error,
              );
            }
          })
          .catch((error) => {
            console.warn("❌ Backend deletion error:", error);
            // Keep local deletion even if backend fails
          });

        console.log("✅ Address deleted from UI and localStorage");
      } catch (error) {
        console.error("❌ Failed to delete address:", error);
        // Try to reload addresses if something went wrong
        loadSavedAddresses();
      } finally {
        setDeletingId(null);
      }
    };

    const getAddressIcon = (type: string) => {
      switch (type) {
        case "home":
          return <Home className="h-4 w-4" />;
        case "office":
        case "work":
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
        case "work":
          return "Work";
        default:
          return "Other";
      }
    };

    const formatDistance = (address: AddressData) => {
      // Mock distance calculation - in real app, calculate from user's current location
      return "0 m";
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
        <div className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Manage your addresses
            </h2>
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="h-10 w-10 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Add Address Button */}
          <div className="p-4 border-b border-gray-100">
            <Button
              onClick={() => setShowAddAddressPage(true)}
              variant="ghost"
              className="w-full h-14 justify-start text-green-600 hover:bg-green-50"
            >
              <Plus className="h-5 w-5 mr-3 text-green-600" />
              <span className="font-medium">Add Address</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                  SAVED ADDRESSES
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  MANAGE YOUR ADDRESSES
                </p>
              </div>

              <div className="space-y-3">
                {addresses.map((address) => (
                  <Card
                    key={address.id}
                    className={`border cursor-pointer transition-all ${
                      selectedAddressId === address.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
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

                        {/* Actions - 3 Dot Menu and Select Button */}
                        <div className="flex items-center gap-2 ml-4 relative z-10">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 relative z-20 sm:text-gray-400 sm:hover:text-gray-600"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 z-[60] bg-white shadow-lg border"
                              side="bottom"
                              sideOffset={5}
                            >
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  console.log(
                                    "✏️ Editing address:",
                                    address.id,
                                  );
                                  setEditingAddress(address);
                                  setShowAddAddressPage(true);
                                }}
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4" />
                                Edit Address
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  console.log(
                                    "🗑️ Deleting address:",
                                    address.id,
                                  );
                                  setDeletingId(address.id || "");
                                }}
                                className="flex items-center gap-2 cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Address
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {onSelectAddress && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAddress(address);
                                onClose();
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Delete Confirmation Dialog */}
                      <AlertDialog
                        open={deletingId === address.id}
                        onOpenChange={(open) => !open && setDeletingId(null)}
                      >
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this address? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                await handleDeleteAddress(address.id!);
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {addresses.length === 0 && (
            <div className="p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No saved addresses
              </h3>
              <p className="text-gray-600 mb-6">
                Add your first address to get started
              </p>
              <Button
                onClick={() => setShowAddAddressPage(true)}
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

        {/* Zomato Add Address Page */}
        <ZomatoAddAddressPage
          isOpen={showAddAddressPage}
          onClose={() => {
            setShowAddAddressPage(false);
            setEditingAddress(null);
          }}
          onSave={editingAddress ? handleEditAddress : handleNewAddressSave}
          currentUser={currentUser}
          editingAddress={editingAddress}
        />
      </div>
    );
  },
);

SavedAddressesModal.displayName = "SavedAddressesModal";

export default SavedAddressesModal;
