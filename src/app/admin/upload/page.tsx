"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

interface LogData {
  player: string;
  steamid: string;
}

interface Server {
  $id: string;
  serverId: string;
  name: string;
  region: string;
  flag: string;
  active: boolean;
}

interface UploadStats {
  total: number;
  new: number;
  updated: number;
  errors: number;
}

interface FileUploadStatus {
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  stats: UploadStats;
  totalPlayers?: number; // Total de jogadores encontrados no arquivo
  error?: string;
}

function parseLog(content: string): LogData[] {
  const regex = /LogSCUM: Message from user: ([^\(]+) \((\d+)\)/g;
  const steamidMap = new Map<string, LogData>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    const player = match[1].trim();
    const steamid = match[2];
    if (!steamidMap.has(steamid)) {
      steamidMap.set(steamid, { player, steamid });
    }
  }
  return Array.from(steamidMap.values());
}

const AdminUploadPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jsonResult, setJsonResult] = useState<LogData[] | null>(null);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [servers, setServers] = useState<Server[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [stats, setStats] = useState<UploadStats>({ total: 0, new: 0, updated: 0, errors: 0 });
  const [currentProcessing, setCurrentProcessing] = useState<string>("");
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/admin/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadServers();
    }
  }, [user]);

  const loadServers = async () => {
    try {
      setLoadingServers(true);
      const res = await fetch("/api/servers");
      const data = await res.json();
      if (data.success) {
        setServers(data.servers);
      } else {
        console.error("Erro ao carregar servidores:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar servidores:", error);
    } finally {
      setLoadingServers(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!selectedServer) {
      alert("Por favor, selecione um servidor antes de fazer upload.");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setUploadProgress(0);
    setStats({ total: 0, new: 0, updated: 0, errors: 0 });
    setCurrentProcessing(`Processando ${files.length} arquivo(s)...`);

    const selectedServerData = servers.find(s => s.serverId === selectedServer);

    const initialStatuses: FileUploadStatus[] = Array.from(files).map(file => ({
      fileName: file.name,
      status: 'pending',
      progress: 0,
      stats: { total: 0, new: 0, updated: 0, errors: 0 },
      totalPlayers: 0
    }));
    setFileStatuses(initialStatuses);

    try {
      const filePromises = Array.from(files).map(async (file, fileIndex) => {
        try {
          setFileStatuses(prev => {
            const updated = [...prev];
            updated[fileIndex].status = 'processing';
            return updated;
          });

          const text = await file.text();
          const data = parseLog(text);
          
          setFileStatuses(prev => {
            const updated = [...prev];
            updated[fileIndex].totalPlayers = data.length;
            return updated;
          });
          
          if (data.length === 0) {
            setFileStatuses(prev => {
              const updated = [...prev];
              updated[fileIndex].status = 'error';
              updated[fileIndex].error = 'Nenhum jogador encontrado';
              return updated;
            });
            return;
          }

          const total = data.length;
          let newPlayers = 0;
          let updatedPlayers = 0;
          let errors = 0;

          const batchSize = 5;
          for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, Math.min(i + batchSize, data.length));
            
            await Promise.all(
              batch.map(async (player) => {
                try {
                  const response = await fetch("/api/upload-players", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      steamid: player.steamid,
                      player: player.player,
                      server: selectedServerData?.name || selectedServer,
                      serverId: selectedServer,
                    }),
                  });

                  const result = await response.json();
                  if (result.success) {
                    if (result.isNew) {
                      newPlayers++;
                    } else {
                      updatedPlayers++;
                    }
                  } else {
                    errors++;
                  }
                } catch (error) {
                  console.error(`Erro ao processar jogador:`, error);
                  errors++;
                }
              })
            );

            const processed = Math.min(i + batchSize, data.length);
            const fileProgress = (processed / total) * 100;
            
            setFileStatuses(prev => {
              const updated = [...prev];
              updated[fileIndex].progress = fileProgress;
              updated[fileIndex].stats = {
                total: processed,
                new: newPlayers,
                updated: updatedPlayers,
                errors: errors
              };
              return updated;
            });
          }

          setFileStatuses(prev => {
            const updated = [...prev];
            updated[fileIndex].status = 'completed';
            updated[fileIndex].progress = 100;
            return updated;
          });

        } catch (error) {
          console.error(`Erro ao processar arquivo ${file.name}:`, error);
          setFileStatuses(prev => {
            const updated = [...prev];
            updated[fileIndex].status = 'error';
            updated[fileIndex].error = 'Erro ao processar arquivo';
            return updated;
          });
        }
      });

      await Promise.all(filePromises);

      setStats(prev => {
        const totalStats = initialStatuses.reduce((acc, status) => ({
          total: acc.total + status.stats.total,
          new: acc.new + status.stats.new,
          updated: acc.updated + status.stats.updated,
          errors: acc.errors + status.stats.errors
        }), { total: 0, new: 0, updated: 0, errors: 0 });
        return totalStats;
      });

      setCurrentProcessing("Upload concluído!");
      setUploadSuccess(true);
      setUploadProgress(100);
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
      alert("Erro ao processar os arquivos de log.");
    } finally {
      setUploading(false);
    }
  };

  const downloadJSON = () => {
    if (!jsonResult) return;
    const dataStr = JSON.stringify(jsonResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scum-players-${selectedServer}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const reset = () => {
    setJsonResult(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    setFileStatuses([]);
    setStats({ total: 0, new: 0, updated: 0, errors: 0 });
    setCurrentProcessing("");
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  if (authLoading || !user) {
    return <p className="text-center p-8">Carregando...</p>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-3 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button onClick={() => router.push('/players')} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                👥 Base de Jogadores
              </Button>
              <Button onClick={() => router.push('/admin/steam')} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                🔍 Consultar Steam
              </Button>
              <Button onClick={() => router.push('/admin/queue')} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                📋 Gerenciar Fila
              </Button>
            </div>
            <div></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            SCUM Log Analyzer
          </h1>
          <p className="text-slate-400 text-lg">
            Sistema de gestão de jogadores e servidores
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-100">Upload de Logs</CardTitle>
                <CardDescription className="text-slate-400">
                  Processe múltiplos arquivos de log simultaneamente
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                v3.0 - Multi-Upload
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="server-select" className="text-slate-200 text-base font-medium">
                  Servidor
                </Label>
                <Select 
                  value={selectedServer} 
                  onValueChange={setSelectedServer} 
                  disabled={uploading || loadingServers}
                >
                  <SelectTrigger id="server-select" className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder={loadingServers ? "Carregando servidores..." : "Escolha um servidor"} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {servers.map((server) => (
                      <SelectItem key={server.$id} value={server.serverId}>
                        <div className="flex items-center gap-2">
                          <span>{server.flag}</span>
                          <span>{server.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs text-slate-400 border-slate-600">
                            {server.region}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-slate-200 text-base font-medium">
                  Arquivos de Log
                </Label>
                <div className="relative">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".log,.txt"
                    multiple
                    onChange={handleFileChange}
                    disabled={!selectedServer || uploading}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-cyan-400 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Você pode selecionar múltiplos arquivos. Todos os jogadores de cada arquivo serão processados.
                </p>
              </div>
            </div>

            {uploading && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{currentProcessing}</span>
                  <span className="text-cyan-400 font-medium">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                
                {stats.total > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div className="text-xs text-slate-400 mb-1">Total</div>
                      <div className="text-xl font-bold text-slate-100">{stats.total}</div>
                    </div>
                    <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                      <div className="text-xs text-emerald-400 mb-1">Novos</div>
                      <div className="text-xl font-bold text-emerald-400">{stats.new}</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <div className="text-xs text-blue-400 mb-1">Atualizados</div>
                      <div className="text-xl font-bold text-blue-400">{stats.updated}</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <div className="text-xs text-red-400 mb-1">Erros</div>
                      <div className="text-xl font-bold text-red-400">{stats.errors}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadSuccess && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-emerald-400 font-medium">Upload concluído com sucesso!</p>
                  <p className="text-emerald-400/70 text-sm">
                    {stats.new} novos jogadores, {stats.updated} atualizados
                    {stats.errors > 0 && `, ${stats.errors} erros`}
                  </p>
                </div>
              </div>
            )}

            {fileStatuses.length > 0 && (
              <div className="space-y-3">
                <Label className="text-slate-200">Status dos Arquivos</Label>
                {fileStatuses.map((fileStatus, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {fileStatus.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-500 animate-pulse" />
                        )}
                        {fileStatus.status === 'processing' && (
                          <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                        )}
                        {fileStatus.status === 'completed' && (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {fileStatus.status === 'error' && (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <p className="text-slate-300 text-sm truncate">{fileStatus.fileName}</p>
                      </div>
                      <div className="text-xs text-slate-400 ml-2 flex items-center gap-2">
                        {fileStatus.totalPlayers && fileStatus.totalPlayers > 0 && (
                          <span className="text-cyan-400 font-medium">
                            {fileStatus.totalPlayers} jogador{fileStatus.totalPlayers !== 1 ? 'es' : ''}
                          </span>
                        )}
                        {fileStatus.status === 'pending' && <span>Aguardando...</span>}
                        {fileStatus.status === 'processing' && <span>{Math.round(fileStatus.progress)}%</span>}
                        {fileStatus.status === 'completed' && <span className="text-green-400">✓ Concluído</span>}
                        {fileStatus.status === 'error' && <span className="text-red-400">{fileStatus.error}</span>}
                      </div>
                    </div>
                    
                    {fileStatus.status === 'processing' && (
                      <Progress value={fileStatus.progress} className="h-1 mb-2" />
                    )}
                    
                    {(fileStatus.status === 'processing' || fileStatus.status === 'completed') && fileStatus.stats.total > 0 && (
                      <div className="flex gap-3 text-xs mt-2">
                        <span className="text-slate-400">
                          Total: <span className="text-cyan-400">{fileStatus.stats.total}</span>
                        </span>
                        <span className="text-slate-400">
                          Novos: <span className="text-green-400">{fileStatus.stats.new}</span>
                        </span>
                        <span className="text-slate-400">
                          Atualizados: <span className="text-blue-400">{fileStatus.stats.updated}</span>
                        </span>
                        {fileStatus.stats.errors > 0 && (
                          <span className="text-slate-400">
                            Erros: <span className="text-red-400">{fileStatus.stats.errors}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {jsonResult && jsonResult.length > 0 && (
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-slate-100">Resultado da Extração</CardTitle>
                  <CardDescription className="text-slate-400">
                    Jogadores únicos identificados no log
                  </CardDescription>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400 text-lg px-4 py-1">
                  {jsonResult.length} jogador{jsonResult.length !== 1 ? 'es' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {jsonResult.map((player, index) => (
                  <div
                    key={player.steamid}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-100 font-medium truncate">{player.player}</p>
                        <p className="text-slate-400 text-sm font-mono">{player.steamid}</p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <details className="group">
                <summary className="cursor-pointer text-sm text-slate-400 hover:text-cyan-400 transition-colors list-none flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Ver JSON completo
                </summary>
                <pre className="mt-3 bg-slate-950 p-4 rounded-lg text-sm text-slate-300 overflow-x-auto border border-slate-800">
                  {JSON.stringify(jsonResult, null, 2)}
                </pre>
              </details>

              <div className="flex gap-3 pt-2">
                <Button onClick={downloadJSON} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar JSON
                </Button>
                <Button onClick={reset} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Novo Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-slate-500 text-sm space-y-1">
          <p>💡 Dica: Os logs são processados localmente e enviados diretamente para o banco de dados</p>
          <p className="text-xs">Suporte para arquivos .log e .txt</p>
        </div>
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

export default AdminUploadPage;
