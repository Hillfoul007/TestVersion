import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Home, Briefcase, MapPin, Trash2, Plus, Star } from "lucide-react";
import { AddressService, AddressData } from "@/services/addressService";
import { useToast } from "@/hooks/use-toast";

interface SavedAddressesProps {
  onAddressSelect?: (address: AddressData) => void;
  showSelectAction?: boolean;
  showAddButton?: boolean;
  onAddNew?: () => void;
}

const SavedAddresses: React.FC<SavedAddressesProps> = ({
  onAddressSelect,
  showSelectAction = false,
  showAddButton = true,
  onAddNew,
}) => {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<AddressData | null>(null);
  const { toast } = useToast();

  const addressService = AddressService.getInstance();

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const response = await addressService.getUserAddresses();
      if (response.success && Array.isArray(response.data)) {
        setAddresses(response.data);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
      toast({
        title: "Error",
        description: "Failed to load saved addresses",
        variant: "destructive",
      });
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (address: AddressData) => {
    setAddressToDelete(address);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      const response = await addressService.deleteAddress(
        addressToDelete.id || addressToDelete._id || ""
      );
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Address deleted successfully",
        });
        loadAddresses(); // Reload addresses
      } else {
        throw new Error(response.error || "Failed to delete address");
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSelectAddress = (address: AddressData) => {
    if (onAddressSelect) {
      onAddressSelect(address);
      toast({
        title: "Address Selected",
        description: "Address has been selected for your order",
      });
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="h-4 w-4" />;
      case "work":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case "home":
        return "bg-green-100 text-green-800";
      case "work":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-laundrify-purple mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading saved addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
        {showAddButton && (
          <Button
            onClick={onAddNew}
            size="sm"
            className="bg-laundrify-purple hover:bg-laundrify-purple/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
        )}
      </div>

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Saved Addresses
            </h4>
            <p className="text-gray-600 mb-4">
              Add your first address to make ordering faster next time.
            </p>
            {showAddButton && (
              <Button
                onClick={onAddNew}
                className="bg-laundrify-purple hover:bg-laundrify-purple/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card
              key={address.id || address._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Address Type Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className={`${getAddressTypeColor(address.type)} flex items-center gap-1`}
                      >
                        {getAddressTypeIcon(address.type)}
                        {address.label || address.type}
                      </Badge>
                      {address.status === "active" && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>

                    {/* Full Address */}
                    <p className="text-gray-900 font-medium mb-1">
                      {address.fullAddress}
                    </p>

                    {/* Address Details */}
                    <div className="text-sm text-gray-600 space-y-1">
                      {address.flatNo && (
                        <p>
                          <span className="font-medium">Flat/House:</span>{" "}
                          {address.flatNo}
                        </p>
                      )}
                      {address.landmark && (
                        <p>
                          <span className="font-medium">Landmark:</span>{" "}
                          {address.landmark}
                        </p>
                      )}
                      {address.phone && (
                        <p>
                          <span className="font-medium">Contact:</span>{" "}
                          {address.phone}
                        </p>
                      )}
                    </div>

                    {/* Coordinates */}
                    {address.coordinates && (
                      <p className="text-xs text-gray-500 mt-2">
                        📍 {address.coordinates.lat.toFixed(4)},{" "}
                        {address.coordinates.lng.toFixed(4)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {showSelectAction && (
                      <Button
                        onClick={() => handleSelectAddress(address)}
                        size="sm"
                        className="bg-laundrify-purple hover:bg-laundrify-purple/90"
                      >
                        Select
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteAddress(address)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {addressToDelete && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {addressToDelete.fullAddress}
              </p>
              <p className="text-sm text-gray-600">
                {addressToDelete.label || addressToDelete.type}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedAddresses;
