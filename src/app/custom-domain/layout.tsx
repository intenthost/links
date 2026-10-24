import type { Metadata } from "next";

// Infra route with site chrome, never indexed (custom domain parked page).
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function CustomDomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
