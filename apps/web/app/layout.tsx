import type {
  Metadata,
} from "next";

import "./globals.css";

export const metadata: Metadata = {
  title:
    "Algorithmic Accountability",
  description:
    "Governance for accountable algorithmic and automated decision deployments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
