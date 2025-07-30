import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Plus, Clock } from "lucide-react";
import SavedAddresses from "./SavedAddresses";
import ZomatoAddAddressPage from "./ZomatoAddAddressPage";
import { AddressData } from "@/services/addressService";
import { getCurrentUser } from "@/utils/authUtils";

interface AddressSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: AddressData) => void;
  selectedAddress?: AddressData | null;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({
  isOpen,
  onClose,
  onAddressSelect,
  selectedAddress,
}) => {
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [currentUser] = useState(() => getCurrentUser());

  const handleAddressSelect = (address: AddressData) => {
    onAddressSelect(address);
    onClose();
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddAddressForm(true);
  };

  const handleEditAddress = (address: AddressData) => {
    setEditingAddress(address);
    setShowAddAddressForm(true);
  };

  const handleAddressSave = (address: AddressData) => {
    setShowAddAddressForm(false);
    setEditingAddress(null);
    onAddressSelect(address);
    onClose();
  };

  if (!isOpen) return null;

  if (showAddAddressForm) {
    return (
      <ZomatoAddAddressPage
        isOpen={true}
        onClose={() => setShowAddAddressForm(false)}
        onSave={handleAddressSave}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Select Address</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          {selectedAddress && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-medium">Current:</span>{" "}
                {selectedAddress.fullAddress}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <Tabs defaultValue="saved" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Saved Addresses
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saved" className="mt-6">
              <SavedAddresses
                onAddressSelect={handleAddressSelect}
                showSelectAction={true}
                showAddButton={true}
                onAddNew={handleAddNewAddress}
                onEditAddress={handleEditAddress}
              />
            </TabsContent>

            <TabsContent value="new" className="mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 text-laundrify-purple mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Add New Address
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Enter a new delivery address with Google Maps integration
                  </p>
                  <Button
                    onClick={handleAddNewAddress}
                    className="bg-laundrify-purple hover:bg-laundrify-purple/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Adding Address
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressSelection;
