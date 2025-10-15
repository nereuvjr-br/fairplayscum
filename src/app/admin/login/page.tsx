"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await login(email, password);
    if (res.success) {
      // Navegação client-side preserva estado
      router.replace('/admin/dashboard');
    } else {
      alert(res.error || 'Erro ao autenticar');
    }
  };

  useEffect(() => {
    console.log('[AdminLoginPage] useEffect triggered:', { user, loading });
    if (!loading && user) {
      console.log('[AdminLoginPage] Redirecting to /admin/dashboard');
      router.replace('/admin/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return <div className="p-8 text-slate-400">Verificando sessão...</div>;
  // Não redireciona automaticamente se já estiver logado, apenas após login

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-8">
      <div className="max-w-md mx-auto mt-20">
        <Card className="bg-slate-900/50 border-slate-800 p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">🔐 Admin Login</h1>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
            <Button onClick={handleLogin} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">Entrar</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
