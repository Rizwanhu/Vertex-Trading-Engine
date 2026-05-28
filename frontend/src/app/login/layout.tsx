import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — AlgoTrader Pro",
  description: "Sign in or create an account to access your algorithmic trading dashboard.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
