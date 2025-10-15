import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            SCUM Server Management
          </h1>
          <p className="text-xl text-slate-400">
            Sistema completo de gestão de servidores e jogadores SCUM
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/upload">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur hover:border-blue-500 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  📤 Upload de Logs
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Importe arquivos de log do servidor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 mb-4">
                  Faça upload dos logs do SCUM para extrair dados de jogadores e sincronizar com o banco de dados.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Acessar Upload
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/players">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur hover:border-purple-500 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  👥 Base de Jogadores
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Visualize todos os dados unificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 mb-4">
                  Veja informações completas de jogadores, servidores, perfis Steam e banimentos.
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Ver Jogadores
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/steam">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur hover:border-cyan-500 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  🔍 Consulta Steam
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Busque informações dos jogadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 mb-4">
                  Consulte perfis da Steam e histórico de banimentos dos jogadores registrados.
                </p>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                  Consultar Jogadores
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Link href="/queue">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur hover:border-teal-500 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  📋 Gerenciar Fila
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Controle das consultas à API Steam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 mb-4">
                  Visualize e gerencie a fila de processamento das consultas à API da Steam.
                </p>
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                  Gerenciar Fila
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="max-w-3xl mx-auto border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-slate-100">🎮 Sobre o Sistema</CardTitle>
            <CardDescription className="text-slate-400">
              Gerencie seu servidor SCUM de forma eficiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-slate-300">
              <p className="text-sm">
                Este sistema permite que você gerencie jogadores do seu servidor SCUM através de três módulos principais:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong className="text-blue-400">Upload de Logs:</strong> Importe logs do servidor para extrair dados de jogadores automaticamente</li>
                <li><strong className="text-purple-400">Base de Jogadores:</strong> Visualize todos os dados unificados em uma única interface</li>
                <li><strong className="text-cyan-400">Consulta Steam:</strong> Busque informações detalhadas dos perfis e histórico de banimentos via API Steam</li>
                <li><strong className="text-teal-400">Gerenciamento de Fila:</strong> Controle total sobre as consultas pendentes, processadas e com erro</li>
              </ul>
              <p className="text-sm text-slate-400 pt-4">
                Desenvolvido com Next.js 15, React, TypeScript, Tailwind CSS v4 e integrado com Appwrite Database.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
