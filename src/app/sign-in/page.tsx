"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/contexts/I18nContext";
import { useUser } from "@/contexts/UserContext";
import { isValidRoomId } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, isLoading } = useUser();
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomId = searchParams.get("room");
  const callbackUrl = searchParams.get("callback") || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      if (roomId && isValidRoomId(roomId)) {
        router.push(`/room/${roomId}`);
      } else {
        router.push(callbackUrl);
      }
    }
  }, [user, isLoading, roomId, callbackUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim());
      toast.success(t("signIn.welcomeMessage"));

      // Redirect to room or callback URL
      if (roomId && isValidRoomId(roomId)) {
        router.push(`/room/${roomId}`);
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      // Silent error handling - user will see they're still on the sign-in page
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <span className="text-primary-foreground text-2xl font-bold">
              PP
            </span>
          </div>
          <h1 className="text-3xl font-bold">{t("signIn.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {roomId
              ? t("signIn.subtitleWithRoom", { roomId })
              : t("signIn.subtitle")}
          </p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t("signIn.welcome")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("common.username")}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t("signIn.enterUsername")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !username.trim()}
                size="lg"
              >
                {isSubmitting ? t("signIn.signingIn") : t("common.signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Room Info */}
        {roomId && isValidRoomId(roomId) && (
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {t("signIn.redirectMessage", { roomId })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
