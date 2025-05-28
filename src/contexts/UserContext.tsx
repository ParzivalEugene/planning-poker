"use client";

import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

export type User = {
  id: string;
  username: string;
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = "poker-planning-user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const loginMutation = api.auth.login.useMutation();
  const userQuery = api.auth.getCurrentUser.useQuery(
    { userId: user?.id },
    { enabled: !!user?.id },
  );

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else if (!isLoading) {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user, isLoading]);
  useEffect(() => {
    if (
      userQuery.data === null &&
      user &&
      !userQuery.isLoading &&
      !userQuery.isError &&
      !loginMutation.isPending
    ) {
      console.log("User not found on server, re-registering:", user.username);
      loginMutation.mutate({ username: user.username });
    }
  }, [
    userQuery.data,
    user,
    userQuery.isLoading,
    userQuery.isError,
    loginMutation,
  ]);

  const login = async (username: string) => {
    try {
      const newUser = await loginMutation.mutateAsync({ username });
      setUser(newUser);
      return;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setIsLoggingOut(true);
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    router.push("/");
  };

  return (
    <UserContext.Provider
      value={{ user, isLoading, isLoggingOut, login, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
