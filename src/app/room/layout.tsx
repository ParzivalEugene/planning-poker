"use client";

import { useUser } from "@/contexts/UserContext";
import { LoginDialog } from "@/components/LoginDialog";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Show login dialog if user is not authenticated and app has loaded
  useEffect(() => {
    if (!isLoading && !user) {
      setShowLoginDialog(true);
    }
  }, [user, isLoading]);

  // Show login dialog if user is not logged in
  if (!isLoading && !user) {
    return (
      <>
        <LoginDialog
          isOpen={showLoginDialog}
          onOpenChange={(open) => {
            // Prevent closing if user is not logged in
            if (!user && !open) return;
            setShowLoginDialog(open);
          }}
        />
        <Toaster position="bottom-center" />
      </>
    );
  }

  return (
    <>
      {children}
      <Toaster position="bottom-center" />
    </>
  );
}
