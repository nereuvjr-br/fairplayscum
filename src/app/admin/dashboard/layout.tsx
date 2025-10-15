import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel do Admin",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}