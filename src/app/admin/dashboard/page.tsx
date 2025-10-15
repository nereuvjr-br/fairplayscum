"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[AdminDashboardPage] useEffect triggered:', { user, loading });
    if (!loading && !user) {
      console.log('[AdminDashboardPage] Redirecting to /admin/login');
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-100">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto mt-20">
        <Card className="bg-slate-900/50 border-slate-800 p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Painel do Admin</h1>
          <div className="mb-4 text-center">
            <span className="text-lg">Bem-vindo, <b>{user?.email}</b></span>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="/admin/reports">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white w-full">Ver Denúncias</Button>
            </Link>
            <Link href="/admin/upload">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Upload</Button>
            </Link>
            <Link href="/admin/steam">
              <Button className="bg-green-600 hover:bg-green-700 text-white w-full">Steam</Button>
            </Link>
            <Link href="/admin/queue">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">Queue</Button>
            </Link>
            <Button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white">Sair</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
