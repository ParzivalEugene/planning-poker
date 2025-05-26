"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/contexts/I18nContext";
import { useUser } from "@/contexts/UserContext";
import { generateRoomId, isValidRoomId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const { user } = useUser();
  const { t } = useI18n();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const newRoomId = generateRoomId();
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      return;
    }

    const cleanRoomId = roomId.trim().toLowerCase();

    if (!isValidRoomId(cleanRoomId)) {
      return;
    }

    if (!user) {
      router.push(`/sign-in?room=${cleanRoomId}`);
      return;
    }

    router.push(`/room/${cleanRoomId}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
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
          <h1 className="text-3xl font-bold">{t("home.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("home.subtitle")}</p>
        </div>

        {/* User Status */}
        {user && (
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {t("home.welcomeBack", { username: user.username })}
            </p>
          </div>
        )}

        {/* Main Actions */}
        <div className="space-y-4">
          {/* Create Room */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("home.createRoom.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateRoom} className="w-full" size="lg">
                {t("home.createRoom.button")}
              </Button>
              <p className="text-muted-foreground mt-2 text-center text-xs">
                {t("home.createRoom.description")}
              </p>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("home.joinRoom.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">{t("common.roomId")}</Label>
                <Input
                  id="roomId"
                  placeholder={t("home.joinRoom.placeholder")}
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleJoinRoom();
                    }
                  }}
                />
                <p className="text-muted-foreground text-xs">
                  {t("home.joinRoom.description")}
                </p>
              </div>
              <Button
                onClick={handleJoinRoom}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={!roomId.trim()}
              >
                {t("home.joinRoom.button")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="text-muted-foreground text-center text-sm">
          <p className="mb-2">{t("home.features.title")}</p>
          <div className="space-y-1">
            <p>{t("home.features.realtime")}</p>
            <p>{t("home.features.sharing")}</p>
            <p>{t("home.features.rounds")}</p>
            <p>{t("home.features.capacity")}</p>
          </div>
          <div className="mt-3 text-xs">
            <p>
              {t("home.features.enterprise").split("{contactLink}")[0]}
              <a
                href="mailto:contact@michkoff.com"
                className="text-primary hover:text-primary/80 underline"
              >
                {t("home.features.contactUs")}
              </a>
              {t("home.features.enterprise").split("{contactLink}")[1]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
