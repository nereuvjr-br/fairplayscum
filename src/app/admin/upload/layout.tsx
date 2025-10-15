import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload de Logs",
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}