"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Profile } from "@/lib/data/types";

const UserContext = createContext<Profile | null>(null);

/** Provides the signed-in profile (or null) to client components like AppShell. */
export function UserProvider({
  user,
  children,
}: {
  user: Profile | null;
  children: ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): Profile | null {
  return useContext(UserContext);
}
