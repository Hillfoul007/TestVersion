import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RouteDebugger: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const testRoutes = [
    '/',
    '/login',
    '/refer',
    '/address-demo',
    '/admin/location-config'
  ];

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Route Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <strong>Current Location:</strong> {location.pathname}
          </div>
          
          <div>
            <strong>Test Routes:</strong>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {testRoutes.map((route) => (
                <Button
                  key={route}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(route)}
                  className={location.pathname === route ? 'bg-blue-100' : ''}
                >
                  {route === '/' ? 'Home' : route}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <strong>Share URL Test:</strong>
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/`;
                  navigator.clipboard.writeText(shareUrl);
                  alert(`Copied to clipboard: ${shareUrl}`);
                }}
              >
                Copy Home URL
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteDebugger;
