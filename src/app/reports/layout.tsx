import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Histórico de Denúncias",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}