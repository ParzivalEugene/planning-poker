"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

export function LoginDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [username, setUsername] = useState("");
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Username required", {
        description: "Please enter a username to continue.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim());
      toast.success("Login successful", {
        description: "Welcome to Planning Poker!",
      });
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to login:", error);
      toast.error("Login failed", {
        description: "There was an error logging in. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleLogin}>
          <DialogHeader>
            <DialogTitle>Welcome to Planning Poker</DialogTitle>
            <DialogDescription>
              Enter a username to join the planning session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="col-span-1">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
                placeholder="Enter your username"
                autoComplete="off"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Logging in..." : "Join Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
