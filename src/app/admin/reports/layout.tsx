import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel de Denúncias",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}