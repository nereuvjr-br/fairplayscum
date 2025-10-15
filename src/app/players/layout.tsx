import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Base de Jogadores",
};

export default function PlayersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}