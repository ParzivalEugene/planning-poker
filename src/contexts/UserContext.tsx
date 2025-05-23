"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/trpc/react";

export type User = {
  id: string;
  username: string;
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = "poker-planning-user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = api.auth.login.useMutation();
  const userQuery = api.auth.getCurrentUser.useQuery(
    { userId: user?.id },
    { enabled: !!user?.id },
  );

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Update local storage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else if (!isLoading) {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user, isLoading]);

  // Refresh user data if needed from the server
  useEffect(() => {
    if (userQuery.data === null && user) {
      // If the user doesn't exist on the server anymore, log them out
      setUser(null);
    }
  }, [userQuery.data, user]);

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
    setUser(null);
    // Clear from local storage
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout }}>
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
