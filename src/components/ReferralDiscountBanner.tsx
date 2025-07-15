import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Timer } from "lucide-react";
import { ReferralService } from "@/services/referralService";

interface ReferralDiscountBannerProps {
  user: any;
  className?: string;
}

export function ReferralDiscountBanner({
  user,
  className = "",
}: ReferralDiscountBannerProps) {
  // Since this component uses methods not implemented in our basic service, return null for now
  return null;
}

export default ReferralDiscountBanner;
