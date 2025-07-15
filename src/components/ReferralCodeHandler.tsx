import React, { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gift, UserCheck, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ReferralService } from "@/services/referralService";

interface ReferralCodeHandlerProps {
  currentUser: any;
  onReferralApplied?: (discountPercentage: number) => void;
}

export function ReferralCodeHandler({
  currentUser,
  onReferralApplied,
}: ReferralCodeHandlerProps) {
  const referralService = ReferralService.getInstance();
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [validatedReferral, setValidatedReferral] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for referral code in URL when component mounts
    const urlReferralCode = referralService.extractReferralFromUrl();

    if (urlReferralCode) {
      // Store for later use if user isn't logged in yet
      referralService.storeReferralCode(urlReferralCode);

      if (currentUser) {
        // If user is already logged in, show the referral dialog
        setReferralCode(urlReferralCode);
        setShowReferralDialog(true);
        validateReferralCode(urlReferralCode);
      } else {
        // Show welcome message for non-logged-in users
        toast.success(
          "🎉 Referral code detected! Sign up to claim your 50% OFF discount!",
        );
      }
    }
  }, [currentUser]);

  useEffect(() => {
    // Handle stored referral code when user logs in
    if (currentUser && !currentUser.referred_by) {
      const storedCode = referralService.getStoredReferralCode();
      if (storedCode) {
        setReferralCode(storedCode);
        setShowReferralDialog(true);
        validateReferralCode(storedCode);
      }
    }
  }, [currentUser]);

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) return;

    setIsValidating(true);
    setError(null);

    try {
      const validation = referralService.validateReferralCode(
        code,
        currentUser,
      );
      setValidatedReferral(validation);
    } catch (error: any) {
      setError(error.message);
      setValidatedReferral(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!validatedReferral || !currentUser) return;

    setIsApplying(true);

    try {
      const result = await referralService.applyReferralCode(
        referralCode,
        currentUser.id,
      );

      // Clear stored referral code
      referralService.clearStoredReferralCode();

      // Close dialog
      setShowReferralDialog(false);

      // Show success message
      toast.success(result.message);

      // Notify parent component
      if (onReferralApplied) {
        onReferralApplied(result.discount_percentage);
      }
    } catch (error: any) {
      toast.error(error.message);
      setError(error.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setReferralCode(value.toUpperCase());
    setValidatedReferral(null);
    setError(null);

    if (value.length >= 6) {
      validateReferralCode(value);
    }
  };

  // Don't show anything if user has already been referred
  if (currentUser?.referred_by) {
    return null;
  }

  return (
    <>
      {/* URL-based referral welcome banner */}
      {referralService.extractReferralFromUrl() && !currentUser && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <Gift className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🎉 You've been invited to join CleanCare Pro! Sign up now and get{" "}
            <strong>50% OFF</strong> on your first order!
          </AlertDescription>
        </Alert>
      )}

      {/* Referral Code Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Apply Referral Code
            </DialogTitle>
            <DialogDescription>
              Enter a referral code to get 50% OFF on your first order!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="font-mono text-center text-lg tracking-wider"
                disabled={isApplying}
              />

              {isValidating && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating code...
                </div>
              )}
            </div>

            {/* Validation Result */}
            {validatedReferral && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-green-800 font-medium">
                      Valid referral code!
                    </p>
                    <div className="text-sm text-green-700">
                      <p>
                        • Referred by:{" "}
                        <strong>{validatedReferral.referrer_name}</strong>
                      </p>
                      <p>
                        • You'll get:{" "}
                        <strong>
                          {validatedReferral.discount_percentage}% OFF
                        </strong>{" "}
                        on your first order
                      </p>
                      <p>
                        • Expires:{" "}
                        {new Date(
                          validatedReferral.expires_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReferralDialog(false)}
                className="flex-1"
                disabled={isApplying}
              >
                Skip
              </Button>
              <Button
                onClick={handleApplyReferral}
                disabled={!validatedReferral || isApplying}
                className="flex-1"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Apply Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReferralCodeHandler;
