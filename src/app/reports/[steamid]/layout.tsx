import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: { steamid: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const steamid = params.steamid;

  // For now, we'll just use the steamid in the title.
  // In a real app, you'd fetch the player's name here.
  const playerName = `Denúncias de ${steamid}`;

  return {
    title: playerName,
  };
}

export default function PlayerReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}