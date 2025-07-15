import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Share2,
  Copy,
  MessageCircle,
  Twitter,
  Facebook,
  Send,
  Mail,
  Smartphone,
  Gift,
  Users,
  TrendingUp,
  Check,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ReferralService } from "@/services/referralService";

interface ReferralShareButtonProps {
  userId: string;
  currentUser: any;
  variant?: "default" | "outline" | "ghost" | "small" | "menu-item";
  className?: string;
  onClick?: () => void;
}

export const ReferralShareButton = React.forwardRef<
  HTMLButtonElement,
  ReferralShareButtonProps
>(
  (
    { userId, currentUser, variant = "default", className = "", onClick },
    ref,
  ) => {
    const referralService = ReferralService.getInstance();
    const [isOpen, setIsOpen] = useState(false);
    const [shareData, setShareData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Memoize social share buttons to prevent re-computation on every render
    const socialShareButtons = React.useMemo(() => {
      if (!shareData) return null;

      const socialUrls = referralService.generateSocialShareUrls(
        shareData.share_url,
        shareData.referral_code,
      );

      return [
        {
          name: "WhatsApp",
          icon: MessageCircle,
          url: socialUrls.whatsapp,
          color: "text-green-600",
        },
        {
          name: "Twitter",
          icon: Twitter,
          url: socialUrls.twitter,
          color: "text-blue-500",
        },
        {
          name: "Facebook",
          icon: Facebook,
          url: socialUrls.facebook,
          color: "text-blue-600",
        },
        {
          name: "Telegram",
          icon: Send,
          url: socialUrls.telegram,
          color: "text-blue-400",
        },
        {
          name: "SMS",
          icon: Smartphone,
          url: socialUrls.sms,
          color: "text-gray-600",
        },
        {
          name: "Email",
          icon: Mail,
          url: socialUrls.email,
          color: "text-gray-600",
        },
      ];
    }, [shareData?.share_url, shareData?.referral_code]);

    useEffect(() => {
      if (isOpen && !shareData) {
        loadShareData();
      }
    }, [isOpen]);

    const loadShareData = async () => {
      setIsLoading(true);
      try {
        console.log("🎯 Loading referral share data...");

        // Generate referral code using the service
        const referralCode = referralService.generateReferralCode(currentUser);

        setShareData({
          share_url: `${window.location.origin}?ref=${referralCode}`,
          referral_code: referralCode,
          discount_percentage: 50,
        });
        setStats({
          total_referrals: 0,
          successful_referrals: 0,
          pending_referrals: 0,
          active_referral_code: referralCode,
          available_discounts: [],
          referral_history: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    const handleCopy = async (text: string, type: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        toast.success(`${type} copied to clipboard!`);
        setTimeout(() => setCopied(null), 2000);
      } catch (error) {
        toast.error("Failed to copy to clipboard");
      }
    };

    const handleSocialShare = (platform: string, url: string) => {
      window.open(url, "_blank", "width=600,height=400");
    };

    const getButtonText = () => {
      if (variant === "small") return "";
      if (variant === "menu-item") return "Refer and Earn";
      return "Share & Earn";
    };

    const getButtonIcon = () => {
      if (variant === "small") return Share2;
      if (variant === "menu-item") return Gift;
      return Gift;
    };

    const ButtonIcon = getButtonIcon();

    if (!currentUser) return null;

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            ref={ref}
            variant={variant === "menu-item" ? "ghost" : variant}
            className={`${
              variant === "small"
                ? "h-8 w-8 p-0"
                : variant === "menu-item"
                  ? "gap-2 h-auto"
                  : "gap-2"
            } touch-manipulation ${className}`}
            title="Share and earn rewards"
            onClick={variant === "menu-item" ? undefined : onClick}
          >
            {variant === "menu-item" ? (
              <div className="flex items-center w-full">
                <div className="w-8 h-8 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
                  <ButtonIcon className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">{getButtonText()}</span>
              </div>
            ) : (
              <>
                <ButtonIcon
                  className={variant === "small" ? "h-4 w-4" : "h-4 w-4"}
                />
                {getButtonText()}
              </>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Share & Earn 50% OFF
            </DialogTitle>
            <DialogDescription>
              Share CleanCare Pro with friends and both of you get 50% OFF!
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* How it works */}
              <Alert>
                <Gift className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">How it works:</p>
                    <ol className="text-sm list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Share your referral link</li>
                      <li>Friend signs up & gets 50% OFF first order</li>
                      <li>After their payment, you get 50% OFF too!</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <Users className="h-4 w-4" />
                      <span className="font-bold text-lg">
                        {stats.total_referrals}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total Referrals
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-bold text-lg">
                        {stats.successful_referrals}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Successful</p>
                  </div>
                </div>
              )}

              {/* Share Link */}
              {shareData && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="shareLink">Your Referral Link</Label>
                    <div className="flex gap-2">
                      <Input
                        id="shareLink"
                        value={shareData.share_url}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => handleCopy(shareData.share_url, "Link")}
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {copied === "Link" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Your Referral Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="referralCode"
                        value={shareData.referral_code}
                        readOnly
                        className="font-mono text-sm font-bold"
                      />
                      <Button
                        onClick={() =>
                          handleCopy(shareData.referral_code, "Code")
                        }
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {copied === "Code" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="space-y-3">
                    <Label>Share via</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {socialShareButtons?.map((social) => {
                        const Icon = social.icon;
                        return (
                          <Button
                            key={social.name}
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSocialShare(social.name, social.url)
                            }
                            className="flex items-center justify-center gap-2 h-10"
                          >
                            <Icon className={`h-4 w-4 ${social.color}`} />
                            <span className="text-sm">{social.name}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Discounts */}
                  {stats?.available_discounts &&
                    stats.available_discounts.length > 0 && (
                      <div className="space-y-2">
                        <Label>Your Available Discounts</Label>
                        <div className="space-y-2">
                          {stats.available_discounts
                            .filter(
                              (d) =>
                                !d.used && new Date() < new Date(d.expires_at),
                            )
                            .map((discount, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="w-full justify-center py-2"
                              >
                                🎉 {discount.percentage}% OFF -{" "}
                                {discount.type === "referee_discount"
                                  ? "Welcome Bonus"
                                  : "Referral Reward"}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

ReferralShareButton.displayName = "ReferralShareButton";

export default ReferralShareButton;
