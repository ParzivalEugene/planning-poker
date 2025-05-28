"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/contexts/I18nContext";
import { useUser } from "@/contexts/UserContext";
import { generateRoomId, isValidRoomId } from "@/lib/utils";
import {
  ArrowRight,
  Crown,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
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

  const features = [
    {
      icon: Zap,
      title: t("home.features.realtime"),
      description: "Instant updates across all devices",
    },
    {
      icon: Share2,
      title: t("home.features.sharing"),
      description: "Share rooms with simple links",
    },
    {
      icon: RotateCcw,
      title: t("home.features.rounds"),
      description: "Multiple estimation rounds",
    },
    {
      icon: Users,
      title: t("home.features.capacity"),
      description: "Support for large teams",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

      <div className="absolute top-6 right-6 z-10">
        <LanguageSelector />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-12">
          <div className="space-y-8 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl ring-1 shadow-blue-500/25 ring-white/20">
                  <span className="text-3xl font-bold text-white">PP</span>
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="h-5 w-5 animate-pulse text-yellow-400" />
                  </div>
                </div>
                <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 opacity-30 blur-xl"></div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-5xl leading-tight font-bold text-transparent md:text-6xl dark:from-white dark:via-blue-100 dark:to-indigo-100">
                {t("home.title")}
              </h1>
              <p className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-600 dark:text-slate-300">
                {t("home.subtitle")}
              </p>
            </div>

            {user && (
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("home.welcomeBack", { username: user.username })}
                </span>
              </div>
            )}
          </div>

          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            <Card className="group relative overflow-hidden border-0 bg-white/70 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900/70">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <CardHeader className="relative">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {t("home.createRoom.title")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {t("home.createRoom.description")}
                </p>
                <Button
                  onClick={handleCreateRoom}
                  className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                  size="lg"
                >
                  <span>{t("home.createRoom.button")}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white/70 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900/70">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <CardHeader className="relative">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {t("home.joinRoom.title")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="roomId" className="text-sm font-medium">
                    {t("common.roomId")}
                  </Label>
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
                    className="border-slate-200 bg-white/50 transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800/50"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("home.joinRoom.description")}
                  </p>
                </div>
                <Button
                  onClick={handleJoinRoom}
                  variant="outline"
                  className="group w-full border-emerald-200 text-emerald-700 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                  size="lg"
                  disabled={!roomId.trim()}
                >
                  <span>{t("home.joinRoom.button")}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold text-slate-800 dark:text-slate-200">
                {t("home.features.title")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {t("home.features.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group rounded-xl border border-slate-200/50 bg-white/50 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-lg dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:bg-slate-900/80"
                >
                  <div className="mx-auto mb-3 w-fit rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 p-3 transition-transform duration-300 group-hover:scale-110 dark:from-slate-800 dark:to-slate-700">
                    <feature.icon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="inline-block rounded-2xl border border-slate-200/50 bg-white/60 p-6 shadow-lg backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t("home.features.enterprise").split("{contactLink}")[0]}
                <a
                  href="mailto:contact@michkoff.com"
                  className="font-medium text-blue-600 underline decoration-2 underline-offset-2 transition-colors duration-200 hover:text-blue-700 hover:decoration-blue-600 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:decoration-blue-400"
                >
                  {t("home.features.contactUs")}
                </a>
                {t("home.features.enterprise").split("{contactLink}")[1]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
