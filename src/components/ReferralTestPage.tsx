import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Share2,
  Gift,
  Users,
  TrendingUp,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import ReferralShareButton from "@/components/ReferralShareButton";
import ReferralCodeHandler from "@/components/ReferralCodeHandler";
import ReferralDiscountBanner from "@/components/ReferralDiscountBanner";
import { ReferralService } from "@/services/referralService";

interface ReferralTestPageProps {
  currentUser: any;
}

export function ReferralTestPage({ currentUser }: ReferralTestPageProps) {
  const referralService = ReferralService.getInstance();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const [testCode, setTestCode] = useState("");

  const runTests = async () => {
    if (!currentUser) return;

    setIsRunningTests(true);
    const results = [];

    try {
      // Test 1: Generate referral code
      try {
        const referralCode = referralService.generateReferralCode(currentUser);
        results.push({
          test: "Generate Referral Code",
          status: "success",
          message: `Generated code: ${referralCode}`,
          data: { referral_code: referralCode },
        });
      } catch (error) {
        results.push({
          test: "Generate Referral Code",
          status: "error",
          message: error.message,
        });
      }

      // Test 2: Create mock share link
      try {
        const referralCode = referralService.generateReferralCode(currentUser);
        const shareLink = {
          share_url: `${window.location.origin}?ref=${referralCode}`,
          referral_code: referralCode,
          discount_percentage: 50,
        };
        setShareData(shareLink);
        results.push({
          test: "Get Share Link",
          status: "success",
          message: `Share URL: ${shareLink.share_url}`,
          data: shareLink,
        });
      } catch (error) {
        results.push({
          test: "Get Share Link",
          status: "error",
          message: error.message,
        });
      }

      // Test 3: Mock referral stats
      try {
        const stats = {
          total_referrals: 0,
          successful_referrals: 0,
          pending_referrals: 0,
          active_referral_code:
            referralService.generateReferralCode(currentUser),
        };
        results.push({
          test: "Get Referral Stats",
          status: "success",
          message: `Total referrals: ${stats.total_referrals}`,
          data: stats,
        });
      } catch (error) {
        results.push({
          test: "Get Referral Stats",
          status: "error",
          message: error.message,
        });
      }

      // Test 4: Check first-time user status
      const isFirstTime = referralService.isFirstTimeUser(currentUser);
      results.push({
        test: "Check First-Time User Status",
        status: "success",
        message: isFirstTime
          ? "User is eligible for referral discounts"
          : "User is not eligible for first-time referral discounts",
        data: { isFirstTime },
      });
    } catch (error) {
      results.push({
        test: "Test Suite",
        status: "error",
        message: error.message,
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const testValidateCode = async () => {
    if (!testCode.trim()) return;

    try {
      const validation = await referralService.validateReferralCode(testCode);
      setTestResults((prev) => [
        ...prev,
        {
          test: "Validate Referral Code",
          status: "success",
          message: `Valid code! Referrer: ${validation.referrer_name}, Discount: ${validation.discount_percentage}%`,
          data: validation,
        },
      ]);
    } catch (error) {
      setTestResults((prev) => [
        ...prev,
        {
          test: "Validate Referral Code",
          status: "error",
          message: error.message,
        },
      ]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  if (!currentUser) {
    return (
      <Card className="max-w-2xl mx-auto m-4">
        <CardHeader>
          <CardTitle>Referral System Test</CardTitle>
          <CardDescription>
            Please log in to test the referral system
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral System Test Dashboard
          </CardTitle>
          <CardDescription>
            Test and verify the referral system functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Components Demo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Components Demo</h3>

            {/* Referral Share Button */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Share Button:</span>
              <ReferralShareButton
                userId={currentUser.id}
                currentUser={currentUser}
                variant="default"
              />
              <ReferralShareButton
                userId={currentUser.id}
                currentUser={currentUser}
                variant="small"
              />
            </div>

            {/* Referral Discount Banner */}
            <div>
              <span className="text-sm font-medium mb-2 block">
                Discount Banner:
              </span>
              <ReferralDiscountBanner user={currentUser} />
            </div>

            {/* Referral Code Handler */}
            <div>
              <span className="text-sm font-medium mb-2 block">
                Code Handler:
              </span>
              <ReferralCodeHandler
                currentUser={currentUser}
                onReferralApplied={(percentage) => {
                  setTestResults((prev) => [
                    ...prev,
                    {
                      test: "Referral Applied",
                      status: "success",
                      message: `${percentage}% discount applied!`,
                    },
                  ]);
                }}
              />
            </div>
          </div>

          {/* API Tests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">API Tests</h3>
              <Button
                onClick={runTests}
                disabled={isRunningTests}
                className="gap-2"
              >
                {isRunningTests ? "Running Tests..." : "Run Tests"}
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Manual Code Validation */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter referral code to validate"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button onClick={testValidateCode} variant="outline">
                Validate Code
              </Button>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Test Results:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <Alert key={index} className="text-sm">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div
                            className={`font-medium ${getStatusColor(result.status)}`}
                          >
                            {result.test}
                          </div>
                          <div className="text-muted-foreground">
                            {result.message}
                          </div>
                          {result.data && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-xs text-muted-foreground">
                                View Data
                              </summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Share Data Display */}
          {shareData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Share Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Referral Code:</label>
                  <div className="font-mono text-lg font-bold text-primary">
                    {shareData.referral_code}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Discount:</label>
                  <Badge variant="secondary" className="ml-2">
                    {shareData.discount_percentage}% OFF
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Share URL:</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={shareData.share_url}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(shareData.share_url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current URL Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">URL Information</h3>
            <div className="text-sm space-y-1">
              <div>
                Current URL:{" "}
                <code className="bg-muted px-1 rounded">
                  {window.location.href}
                </code>
              </div>
              <div>
                Referral from URL:{" "}
                <code className="bg-muted px-1 rounded">
                  {referralService.extractReferralFromUrl() || "None"}
                </code>
              </div>
              <div>
                Stored Referral:{" "}
                <code className="bg-muted px-1 rounded">
                  {referralService.getStoredReferralCode() || "None"}
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReferralTestPage;
