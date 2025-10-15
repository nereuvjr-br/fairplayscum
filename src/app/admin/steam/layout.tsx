import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consulta de Dados Steam",
};

export default function SteamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}