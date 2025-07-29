import React, { useState } from 'react';
import { openCageService } from '@/services/openCageService';
import { locationService } from '@/services/locationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const OpenCageTest: React.FC = () => {
  const [testAddress, setTestAddress] = useState('New Delhi, India');
  const [testCoords, setTestCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testForwardGeocoding = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Testing forward geocoding with address:', testAddress);
      const result = await openCageService.forwardGeocode(testAddress);
      setResults({
        type: 'forward',
        input: testAddress,
        result: result
      });
      console.log('✅ Forward geocoding result:', result);
    } catch (err) {
      setError(`Forward geocoding failed: ${err.message}`);
      console.error('❌ Forward geocoding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testReverseGeocoding = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Testing reverse geocoding with coordinates:', testCoords);
      const result = await openCageService.reverseGeocode(testCoords);
      setResults({
        type: 'reverse',
        input: testCoords,
        result: result
      });
      console.log('✅ Reverse geocoding result:', result);
    } catch (err) {
      setError(`Reverse geocoding failed: ${err.message}`);
      console.error('❌ Reverse geocoding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testLocationService = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('���� Testing location service reverse geocoding with coordinates:', testCoords);
      const result = await locationService.reverseGeocode(testCoords);
      setResults({
        type: 'locationService',
        input: testCoords,
        result: result
      });
      console.log('✅ Location service result:', result);
    } catch (err) {
      setError(`Location service failed: ${err.message}`);
      console.error('❌ Location service error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testApiStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Testing OpenCage API status');
      const status = await openCageService.checkApiStatus();
      setResults({
        type: 'status',
        input: 'API Status Check',
        result: status
      });
      console.log('✅ API status result:', status);
    } catch (err) {
      setError(`API status check failed: ${err.message}`);
      console.error('❌ API status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Getting current location');
      const position = await locationService.getCurrentPosition();
      const address = await locationService.reverseGeocode(position);
      setResults({
        type: 'currentLocation',
        input: 'Browser Geolocation',
        result: {
          coordinates: position,
          address: address
        }
      });
      console.log('✅ Current location result:', { position, address });
    } catch (err) {
      setError(`Get current location failed: ${err.message}`);
      console.error('❌ Current location error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OpenCage Geocoding Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Forward Geocoding Test */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Address:</label>
            <div className="flex gap-2">
              <Input
                value={testAddress}
                onChange={(e) => setTestAddress(e.target.value)}
                placeholder="Enter address to geocode"
                className="flex-1"
              />
              <Button onClick={testForwardGeocoding} disabled={loading}>
                Forward Geocode
              </Button>
            </div>
          </div>

          {/* Reverse Geocoding Test */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Coordinates:</label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="any"
                value={testCoords.lat}
                onChange={(e) => setTestCoords({...testCoords, lat: parseFloat(e.target.value)})}
                placeholder="Latitude"
                className="flex-1"
              />
              <Input
                type="number"
                step="any"
                value={testCoords.lng}
                onChange={(e) => setTestCoords({...testCoords, lng: parseFloat(e.target.value)})}
                placeholder="Longitude"
                className="flex-1"
              />
              <Button onClick={testReverseGeocoding} disabled={loading}>
                Reverse Geocode
              </Button>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testLocationService} disabled={loading} variant="outline">
              Test Location Service
            </Button>
            <Button onClick={testApiStatus} disabled={loading} variant="outline">
              Check API Status
            </Button>
            <Button onClick={getCurrentLocation} disabled={loading} variant="outline">
              Get Current Location
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Testing...</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">Error:</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {results && !loading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Results ({results.type})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Input:</p>
                    <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                      {typeof results.input === 'string' ? results.input : JSON.stringify(results.input, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Result:</p>
                    <pre className="text-sm bg-muted p-2 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {typeof results.result === 'string' ? results.result : JSON.stringify(results.result, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenCageTest;
