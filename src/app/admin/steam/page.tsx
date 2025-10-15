"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

interface Player {
  $id: string;
  steamid: string;
  currentName: string;
  nameHistory: string[];
  firstSeen: string;
  lastSeen: string;
  hasData?: boolean;
  hasBans?: boolean;
}

const AdminSteamDataPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [queuing, setQueuing] = useState(false);
  const [queryTypes, setQueryTypes] = useState({ summary: true, bans: true });
  const [search, setSearch] = useState("");
  const [queueStats, setQueueStats] = useState({ pending: 0, processing: 0, completed: 0, errors: 0 });
  const [autoProcess, setAutoProcess] = useState(false);
  const [showQueried, setShowQueried] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/admin/login");
    }
  }, [user, authLoading, router]);

  const loadQueueStats = useCallback(async () => {
    try {
      const res = await fetch("/api/steam/stats");
      const data = await res.json();
      if (data.success) {
        setQueueStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  }, []);

  const processNext = useCallback(async () => {
    try {
      await fetch("/api/steam/process");
      loadQueueStats();
    } catch (error) {
      console.error("Erro ao processar fila:", error);
    }
  }, [loadQueueStats]);

  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/players?limit=100&search=${search}&includeQueried=${showQueried}`);
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players);
      }
    } catch (error) {
      console.error("Erro ao carregar jogadores:", error);
    } finally {
      setLoading(false);
    }
  }, [search, showQueried]);

  useEffect(() => {
    if (user) {
      loadPlayers();
      loadQueueStats();
      const interval = setInterval(loadQueueStats, 5000);
      return () => clearInterval(interval);
    }
  }, [user, loadPlayers, loadQueueStats]);

  const togglePlayer = (steamid: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(steamid)) {
      newSelected.delete(steamid);
    } else {
      newSelected.add(steamid);
    }
    setSelectedPlayers(newSelected);
  };

  const selectAll = () => {
    setSelectedPlayers(new Set(players.map(p => p.steamid)));
  };

  const deselectAll = () => {
    setSelectedPlayers(new Set());
  };

  const queueSelected = async () => {
    if (selectedPlayers.size === 0) {
      alert("Selecione pelo menos um jogador");
      return;
    }

    const types = [];
    if (queryTypes.summary) types.push("summary");
    if (queryTypes.bans) types.push("bans");

    if (types.length === 0) {
      alert("Selecione pelo menos um tipo de consulta");
      return;
    }

    const selectedPlayersList = Array.from(selectedPlayers);
    const playersToQueue = players.filter(p => 
      selectedPlayersList.includes(p.steamid) && 
      (!p.hasData || queryTypes.summary) && 
      (!p.hasBans || queryTypes.bans)
    );

    if (playersToQueue.length === 0) {
      alert("Todos os jogadores selecionados já foram consultados para os tipos escolhidos.");
      return;
    }

    try {
      setQueuing(true);
      const res = await fetch("/api/steam/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steamids: playersToQueue.map(p => p.steamid),
          queryTypes: types,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`${data.queued} consultas adicionadas à fila`);
        loadQueueStats();
        deselectAll();
        await loadPlayers();
      } else {
        alert("Erro ao adicionar à fila: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao adicionar à fila:", error);
      alert("Erro ao adicionar consultas à fila");
    } finally {
      setQueuing(false);
    }
  };



  if (authLoading || !user) {
    return <p className="text-center p-8">Carregando...</p>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-3 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button onClick={() => router.push('/admin/upload')} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                📤 Upload de Logs
              </Button>
              <Button onClick={() => router.push('/players')} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                👥 Base de Jogadores
              </Button>
              <Button onClick={() => router.push('/admin/queue')} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                📋 Gerenciar Fila
              </Button>
            </div>
            <div></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Consulta Steam API
          </h1>
          <p className="text-slate-400 text-lg">
            Gerencie consultas de perfis e bans da Steam
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-100">Status da Fila</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={autoProcess ? "default" : "outline"}
                  onClick={() => setAutoProcess(!autoProcess)}
                  className={autoProcess ? "bg-green-600 hover:bg-green-700 text-white" : "border-slate-600 text-slate-200 hover:bg-slate-800"}
                >
                  {autoProcess ? "🟢 Auto-Process ON" : "⚪ Auto-Process OFF"}
                </Button>
                <Button size="sm" variant="outline" onClick={processNext} className="border-slate-600 text-slate-200 hover:bg-slate-800">
                  Processar Próximo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                <div className="text-xs text-yellow-400 mb-1">Pendentes</div>
                <div className="text-2xl font-bold text-yellow-400">{queueStats.pending}</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <div className="text-xs text-blue-400 mb-1">Processando</div>
                <div className="text-2xl font-bold text-blue-400">{queueStats.processing}</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                <div className="text-xs text-green-400 mb-1">Concluídos</div>
                <div className="text-2xl font-bold text-green-400">{queueStats.completed}</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                <div className="text-xs text-red-400 mb-1">Erros</div>
                <div className="text-2xl font-bold text-red-400">{queueStats.errors}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-slate-100">Selecionar Jogadores</CardTitle>
            <CardDescription className="text-slate-400">
              Escolha jogadores e tipos de consulta para adicionar à fila
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <Button onClick={loadPlayers} variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                Buscar
              </Button>
              <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-200 cursor-pointer hover:bg-slate-750">
                <input
                  type="checkbox"
                  checked={showQueried}
                  onChange={(e) => setShowQueried(e.target.checked)}
                  className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                Mostrar já consultados
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="sm" variant="outline" onClick={selectAll} className="border-slate-600 text-slate-200 hover:bg-slate-800">
                Selecionar Todos
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAll} className="border-slate-600 text-slate-200 hover:bg-slate-800">
                Desmarcar Todos
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <label className="flex items-center gap-2 text-sm text-slate-200 bg-slate-800 px-3 py-2 rounded-md border border-slate-700">
                  <input
                    type="checkbox"
                    checked={queryTypes.summary}
                    onChange={(e) => setQueryTypes({ ...queryTypes, summary: e.target.checked })}
                    className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                  />
                  Perfil
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200 bg-slate-800 px-3 py-2 rounded-md border border-slate-700">
                  <input
                    type="checkbox"
                    checked={queryTypes.bans}
                    onChange={(e) => setQueryTypes({ ...queryTypes, bans: e.target.checked })}
                    className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                  />
                  Bans
                </label>
              </div>
              <Button onClick={queueSelected} disabled={queuing || selectedPlayers.size === 0} className="bg-cyan-600 hover:bg-cyan-700">
                {queuing ? "Adicionando..." : `Adicionar ${selectedPlayers.size} à Fila`}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-100">Jogadores ({players.length})</CardTitle>
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {selectedPlayers.size} selecionados
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-slate-400 py-8">Carregando jogadores...</div>
            ) : players.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p className="mb-2">Nenhum jogador {!showQueried && "pendente"} encontrado.</p>
                {!showQueried && (
                  <p className="text-sm text-slate-500">
                    Ative &quot;Mostrar já consultados&quot; para ver todos os jogadores.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {players.map((player) => {
                  const isQueried = player.hasData || player.hasBans;
                  const isDisabled = isQueried && !showQueried;
                  
                  return (
                    <div
                      key={player.$id}
                      onClick={() => !isDisabled && togglePlayer(player.steamid)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed bg-slate-800/30 border-slate-800"
                          : selectedPlayers.has(player.steamid)
                          ? "bg-cyan-500/20 border-cyan-500/50"
                          : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-slate-100 font-medium">{player.currentName}</p>
                            {player.hasData && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                ✓ Perfil
                              </Badge>
                            )}
                            {player.hasBans && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                ✓ Bans
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm font-mono">{player.steamid}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 text-xs">
                            Visto: {new Date(player.lastSeen).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgb(30 41 59);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(71 85 105);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(100 116 139);
        }
      `}</style>
    </main>
  );
};

export default AdminSteamDataPage;
