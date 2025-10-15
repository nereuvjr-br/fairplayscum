"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QueueItem {
  $id: string;
  steamid: string;
  queryType: string;
  status: string;
  priority: number;
  scheduledFor: string;
  lastAttempt?: string;
  attempts: number;
  error?: string;
  $createdAt: string;
}

interface Stats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export default function QueueManagement() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoProcess, setAutoProcess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastProcessTime, setLastProcessTime] = useState<Date | null>(null);

  const loadQueue = async () => {
    try {
      const res = await fetch(`/api/steam/queue-list?status=${filter}&limit=200`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error("Erro ao carregar fila:", error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/steam/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Deseja realmente remover este item da fila?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/steam/queue-delete?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await loadQueue();
        await loadStats();
      } else {
        alert("Erro ao remover item: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao remover item:", error);
      alert("Erro ao remover item da fila");
    } finally {
      setLoading(false);
    }
  };

  const retryItem = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/steam/queue-retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id }),
      });
      const data = await res.json();
      if (data.success) {
        await loadQueue();
        await loadStats();
      } else {
        alert("Erro ao reagendar: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao reagendar:", error);
      alert("Erro ao reagendar item");
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = async (status: string) => {
    const confirmMsg =
      status === "all"
        ? "Deseja realmente LIMPAR TODA A FILA?"
        : `Deseja realmente remover todos os itens com status "${status}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      setLoading(true);
      const res = await fetch("/api/steam/queue-clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await loadQueue();
        await loadStats();
      } else {
        alert("Erro ao limpar fila: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao limpar fila:", error);
      alert("Erro ao limpar fila");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    loadStats();
  }, [filter]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadQueue();
      loadStats();
    }, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  // Sistema de processamento automático
  useEffect(() => {
    if (!autoProcess) return;

    let isRunning = true;

    const processQueue = async () => {
      while (isRunning && autoProcess) {
        try {
          setProcessing(true);
          
          // Verificar se há itens pendentes
          const statusRes = await fetch("/api/steam/auto-process");
          const statusData = await statusRes.json();
          
          if (statusData.success && statusData.canProcess) {
            // Processar lote de 5 itens
            const res = await fetch("/api/steam/auto-process", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ batchSize: 5 }),
            });

            const data = await res.json();
            if (data.success && data.processed > 0) {
              console.log(`✅ Processados ${data.processed} itens`);
              setLastProcessTime(new Date());
              await loadQueue();
              await loadStats();
            }
          }

          // Aguardar 35 segundos antes do próximo lote (respeitar rate limits)
          await new Promise(resolve => setTimeout(resolve, 35000));
        } catch (error) {
          console.error("Erro no processamento automático:", error);
          await new Promise(resolve => setTimeout(resolve, 60000)); // Aguardar 1 minuto em caso de erro
        }
      }
      setProcessing(false);
    };

    processQueue();

    return () => {
      isRunning = false;
      setProcessing(false);
    };
  }, [autoProcess]);

  const toggleAutoProcess = () => {
    setAutoProcess(!autoProcess);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      processing: { variant: "default", label: "Processando" },
      completed: { variant: "default", label: "✓ Concluído" },
      failed: { variant: "destructive", label: "✗ Falhou" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return (
      <Badge variant={config.variant} className={status === "completed" ? "bg-green-600" : ""}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "summary" ? (
      <Badge variant="outline" className="border-blue-500 text-blue-400">
        Perfil
      </Badge>
    ) : (
      <Badge variant="outline" className="border-orange-500 text-orange-400">
        Bans
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds > 0) {
      if (seconds < 60) return `em ${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `em ${minutes}m`;
      const hours = Math.floor(minutes / 60);
      return `em ${hours}h`;
    }

    return date.toLocaleString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Gerenciamento de Fila</h1>
            <p className="text-slate-400 mt-1">Controle total sobre as consultas Steam</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => window.location.href = '/upload'} variant="outline" size="sm">
              📤 Upload de Logs
            </Button>
            <Button onClick={() => window.location.href = '/players'} variant="outline" size="sm">
              👥 Base de Jogadores
            </Button>
            <Button onClick={() => window.location.href = '/steam'} variant="outline" size="sm">
              🔍 Consultar Steam
            </Button>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-atualizar
            </label>
            <Button onClick={() => { loadQueue(); loadStats(); }} variant="outline" size="sm">
              🔄 Atualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Processando</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{stats.processing}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Falhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-100">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* Processamento Automático */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-slate-100">⚙️ Processamento Automático</span>
              <div className="flex items-center gap-3">
                {autoProcess && processing && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400">Processando...</span>
                  </div>
                )}
                {lastProcessTime && (
                  <span className="text-xs text-slate-500">
                    Último processamento: {lastProcessTime.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  onClick={toggleAutoProcess}
                  variant={autoProcess ? "destructive" : "default"}
                  className={autoProcess ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {autoProcess ? "⏸ Parar Processamento" : "▶ Iniciar Processamento"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">
                {autoProcess ? (
                  <>
                    <span className="text-green-400 font-semibold">✓ Ativo:</span> A fila está sendo processada automaticamente em lotes de 5 itens a cada 35 segundos.
                  </>
                ) : (
                  <>
                    <span className="text-yellow-400 font-semibold">⚠ Inativo:</span> Clique em "Iniciar Processamento" para processar automaticamente a fila.
                  </>
                )}
              </p>
              {autoProcess && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-blue-200 text-xs">
                    💡 <strong>Dica:</strong> Você pode minimizar esta página. O processamento continuará em background enquanto a aba estiver aberta.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Actions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  size="sm"
                >
                  Todos
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  onClick={() => setFilter("pending")}
                  size="sm"
                >
                  Pendentes
                </Button>
                <Button
                  variant={filter === "processing" ? "default" : "outline"}
                  onClick={() => setFilter("processing")}
                  size="sm"
                >
                  Processando
                </Button>
                <Button
                  variant={filter === "completed" ? "default" : "outline"}
                  onClick={() => setFilter("completed")}
                  size="sm"
                >
                  Concluídos
                </Button>
                <Button
                  variant={filter === "failed" ? "default" : "outline"}
                  onClick={() => setFilter("failed")}
                  size="sm"
                >
                  Falhas
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => clearQueue("completed")}
                  disabled={loading || stats.completed === 0}
                  size="sm"
                >
                  Limpar Concluídos
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => clearQueue("failed")}
                  disabled={loading || stats.failed === 0}
                  size="sm"
                >
                  Limpar Falhas
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => clearQueue("all")}
                  disabled={loading || stats.total === 0}
                  size="sm"
                >
                  Limpar Tudo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Items */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Itens da Fila ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Nenhum item na fila com o filtro selecionado
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.$id}
                    className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="font-mono text-sm text-slate-300">
                        {item.steamid}
                      </div>
                      {getTypeBadge(item.queryType)}
                      {getStatusBadge(item.status)}
                      <div className="text-xs text-slate-400">
                        Tentativas: {item.attempts}
                      </div>
                      <div className="text-xs text-slate-500">
                        Agendado: {formatDate(item.scheduledFor)}
                      </div>
                      {item.error && (
                        <div className="text-xs text-red-400 max-w-md truncate" title={item.error}>
                          Erro: {item.error}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {(item.status === "failed" || item.status === "completed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryItem(item.$id)}
                          disabled={loading}
                        >
                          🔄 Reagendar
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteItem(item.$id)}
                        disabled={loading}
                      >
                        🗑️ Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
