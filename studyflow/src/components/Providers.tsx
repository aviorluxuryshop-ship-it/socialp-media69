"use client";

import { AppProvider } from "@/lib/app";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store/provider";
import { AppShell } from "./AppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
