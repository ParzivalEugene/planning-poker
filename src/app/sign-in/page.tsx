"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts";
import { useDumbSaluteAssistant } from "@/hooks/useSaluteAssistant";
import { isValidRoomId } from "@/lib/utils";
import { Sparkles, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, isLoading } = useUser();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomId = searchParams.get("room");
  const callbackUrl = searchParams.get("callback") ?? "/";

  useDumbSaluteAssistant();

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
      toast.success("Добро пожаловать в Planning Poker!");

      if (roomId && isValidRoomId(roomId)) {
        router.push(`/room/${roomId}`);
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-60"></div>
        <div className="relative flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Загрузка...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-60"></div>

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
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

            <div className="mt-8 space-y-4">
              <h1 className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:via-blue-100 dark:to-indigo-100">
                Вход
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {roomId
                  ? `Введите ваше имя пользователя для присоединения к комнате ${roomId}`
                  : "Введите ваше имя пользователя для продолжения"}
              </p>
            </div>
          </div>

          <Card className="group relative overflow-hidden border-0 bg-white/70 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900/70">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-center gap-3">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  Добро пожаловать в Planning Poker
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Имя пользователя
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Введите ваше имя пользователя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                    required
                    className="border-slate-200 bg-white/50 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                  disabled={isSubmitting || !username.trim()}
                  size="lg"
                >
                  {isSubmitting ? "Вход..." : "Войти"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {roomId && isValidRoomId(roomId) && (
            <div className="text-center">
              <div className="inline-block rounded-2xl border border-slate-200/50 bg-white/60 p-4 shadow-lg backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Вы будете перенаправлены в комнату {roomId} после входа
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-60"></div>
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Загрузка...</p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignInForm />
    </Suspense>
  );
}
