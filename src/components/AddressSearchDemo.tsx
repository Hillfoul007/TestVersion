import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ZomatoAddAddressPage from "./ZomatoAddAddressPage";
import EnhancedAddressForm from "./EnhancedAddressForm";
import { MapPin, Plus } from "lucide-react";

interface AddressData {
  flatNo: string;
  street: string;
  landmark: string;
  village: string;
  city: string;
  pincode: string;
  fullAddress: string;
  coordinates?: { lat: number; lng: number };
  label?: string;
  type: "home" | "office" | "other";
  phone?: string;
  name?: string;
}

const AddressSearchDemo: React.FC = () => {
  const [showZomatoPage, setShowZomatoPage] = useState(false);
  const [savedAddress, setSavedAddress] = useState<AddressData | null>(null);
  const [currentUser] = useState({ id: "demo_user", name: "Demo User" });

  const handleAddressSave = (address: AddressData) => {
    setSavedAddress(address);
    setShowZomatoPage(false);
    console.log("Address saved:", address);
  };

  const handleFormAddressChange = (address: any) => {
    console.log("Form address changed:", address);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Enhanced Address Search with Google Maps
        </h1>
        <p className="text-gray-600">
          Test the new address search functionality with Google Places
          autocomplete and nearby places
        </p>
      </div>

      {/* Demo Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Zomato-style Address Page */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Full-Screen Address Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Complete address entry experience with map, autocomplete, and
              nearby places
            </p>
            <Button
              onClick={() => setShowZomatoPage(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>

            {savedAddress && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">
                  Last Saved Address:
                </h4>
                <p className="text-sm text-green-800">
                  {savedAddress.fullAddress}
                </p>
                {savedAddress.coordinates && (
                  <p className="text-xs text-green-600 mt-1">
                    📍 {savedAddress.coordinates.lat.toFixed(4)},{" "}
                    {savedAddress.coordinates.lng.toFixed(4)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Address Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Inline Address Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Compact address form with autocomplete and nearby places
              integration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Address Form Demo */}
      <EnhancedAddressForm
        onAddressChange={handleFormAddressChange}
        showLabel={true}
      />

      {/* Test House Number Detection */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test House Number Auto-Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Try searching for these example addresses to see house number
            auto-detection in action:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Simple Formats:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 font-mono bg-gray-50 p-3 rounded">
                <li>• "123, MG Road, Delhi"</li>
                <li>• "45B, Sector 21, Gurgaon"</li>
                <li>• "A-789, Laxmi Nagar, Delhi"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Complex Formats:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 font-mono bg-gray-50 p-3 rounded">
                <li>• "Plot 67, Phase 2, Gurgaon"</li>
                <li>• "Tower A-123, DLF Phase 3"</li>
                <li>• "House No 456, Vasant Vihar"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 New Features Added</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                🔍 Enhanced Search
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time autocomplete suggestions</li>
                <li>• Support for addresses, establishments, and localities</li>
                <li>• Restricted to India for relevant results</li>
                <li>• Fallback to multiple geocoding services</li>
                <li>
                  • <strong>🏠 Auto-detects house numbers</strong>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                🏠 House Number Detection
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Auto-fills house numbers: 123, A-45, Plot 67</li>
                <li>• Detects building names and tower info</li>
                <li>• Handles complex formats: Tower A-123</li>
                <li>• Visual feedback when auto-detected</li>
                <li>�� Works with current location and search</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zomato Address Page */}
      <ZomatoAddAddressPage
        isOpen={showZomatoPage}
        onClose={() => setShowZomatoPage(false)}
        onSave={handleAddressSave}
        currentUser={currentUser}
      />
    </div>
  );
};

export default AddressSearchDemo;
