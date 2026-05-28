"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "linear-gradient(145deg, rgba(22,30,50,0.98), rgba(10,14,26,0.98))",
            color: "#f1f5f9",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
            backdropFilter: "blur(12px)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#0a0e1a" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#0a0e1a" } },
        }}
      />
    </QueryClientProvider>
  );
}
