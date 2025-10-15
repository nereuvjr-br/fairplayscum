"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Server {
  serverId: string;
  serverName: string;
  serverRegion: string;
  serverFlag: string;
}

interface SteamData {
  personaname: string;
  profileurl: string;
  avatar: string;
  communityvisibilitystate: number;
  lastUpdated: string;
}

interface SteamBans {
  VACBanned: boolean;
  NumberOfVACBans: number;
  CommunityBanned: boolean;
  NumberOfGameBans: number;
  DaysSinceLastBan: number;
  EconomyBan: string;
  lastUpdated: string;
}

interface Player {
  $id: string;
  steamid: string;
  currentName: string;
  nameHistory: string[];
  firstSeen: string;
  lastSeen: string;
  steamData?: SteamData | null;
  steamBans?: SteamBans | null;
  lastServer?: Server | null;
  votes?: {
    likes: number;
    dislikes: number;
    neutral: number;
    total: number;
    userVote?: string | null;
  };
}

interface ServerOption {
  $id: string;
  name: string;
  region: string;
  flag: string;
}

export default function PlayersUnifiedPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedServer, setSelectedServer] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [filterBanned, setFilterBanned] = useState<string>("all");
  const [voterId, setVoterId] = useState<string>("");
  
  // Estado do modal de votação
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [selectedPlayerForVote, setSelectedPlayerForVote] = useState<{steamid: string, name: string} | null>(null);
  const [selectedVoteType, setSelectedVoteType] = useState<'like' | 'dislike' | 'neutral' | null>(null);
  const [voteReason, setVoteReason] = useState("");
  const [submittingVote, setSubmittingVote] = useState(false);
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([""]);
  const [medalLinks, setMedalLinks] = useState<string[]>([""]);

  // Gerar ou recuperar ID único do usuário (cookie)
  useEffect(() => {
    let id = localStorage.getItem("voterId");
    if (!id) {
      id = `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("voterId", id);
    }
    setVoterId(id);
  }, []);

  useEffect(() => {
    loadServers();
    loadPlayers();
  }, []);

  const loadServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      if (data.success) {
        setServers(data.servers);
      }
    } catch (error) {
      console.error("Erro ao carregar servidores:", error);
    }
  };

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedServer !== "all") params.append("serverId", selectedServer);

      const res = await fetch(`/api/players-unified?${params}`);
      const data = await res.json();
      if (data.success) {
        // Carregar votos para cada jogador
        const playersWithVotes = await Promise.all(
          data.players.map(async (player: Player) => {
            try {
              const votesRes = await fetch(
                `/api/player-votes?steamid=${player.steamid}&voterId=${voterId}`
              );
              const votesData = await votesRes.json();
              if (votesData.success) {
                return { ...player, votes: { ...votesData.stats, userVote: votesData.userVote } };
              }
            } catch (error) {
              console.error(`Erro ao carregar votos para ${player.steamid}:`, error);
            }
            return player;
          })
        );
        setPlayers(playersWithVotes);
      }
    } catch (error) {
      console.error("Erro ao carregar jogadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (steamid: string, name: string, voteType: 'like' | 'dislike' | 'neutral') => {
    setSelectedPlayerForVote({ steamid, name });
    setSelectedVoteType(voteType);
    setVoteReason("");
    setYoutubeLinks([""]);
    setMedalLinks([""]);
    setVoteModalOpen(true);
  };

  const submitVote = async () => {
    if (!voterId || !selectedPlayerForVote || !selectedVoteType || !voteReason.trim()) {
      alert("Por favor, preencha o motivo da avaliação");
      return;
    }

    // Montar array de clips
    const clips: Array<{type: string, url: string}> = [];
    youtubeLinks.forEach(link => {
      if (link.trim()) {
        clips.push({ type: 'youtube', url: link.trim() });
      }
    });
    medalLinks.forEach(link => {
      if (link.trim()) {
        clips.push({ type: 'medal', url: link.trim() });
      }
    });

    try {
      setSubmittingVote(true);
      const res = await fetch("/api/player-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          steamid: selectedPlayerForVote.steamid, 
          voteType: selectedVoteType, 
          voterId,
          reason: voteReason,
          clips: JSON.stringify(clips)
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Atualizar apenas o jogador votado
        setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.steamid === selectedPlayerForVote.steamid
              ? { ...p, votes: { ...data.stats, userVote: data.userVote } }
              : p
          )
        );
        setVoteModalOpen(false);
      } else {
        alert("Erro ao registrar voto: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao votar:", error);
      alert("Erro ao registrar voto");
    } finally {
      setSubmittingVote(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (voterId) loadPlayers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, selectedServer, voterId]);

  const getSortedPlayers = () => {
    let filtered = [...players];

    // Filtrar por banimentos
    if (filterBanned === "banned") {
      filtered = filtered.filter(p => p.steamBans?.VACBanned || p.steamBans?.CommunityBanned || (p.steamBans?.NumberOfGameBans ?? 0) > 0);
    } else if (filterBanned === "clean") {
      filtered = filtered.filter(p => !p.steamBans?.VACBanned && !p.steamBans?.CommunityBanned && (p.steamBans?.NumberOfGameBans ?? 0) === 0);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.currentName || "").localeCompare(b.currentName || "");
        case "steamid":
          return (a.steamid || "").localeCompare(b.steamid || "");
        case "server":
          return (a.lastServer?.serverName || "").localeCompare(b.lastServer?.serverName || "");
        case "lastSeen":
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getVisibilityLabel = (state?: number) => {
    if (!state) return "Desconhecido";
    switch (state) {
      case 1: return "Privado";
      case 3: return "Público";
      default: return `Estado ${state}`;
    }
  };

  const getBanBadges = (bans?: SteamBans | null) => {
    if (!bans) return <Badge variant="outline" className="text-slate-500">Não consultado</Badge>;

    const badges = [];
    
    if (bans.VACBanned) {
      badges.push(
        <Badge key="vac" variant="destructive" className="bg-red-600">
          VAC Ban ({bans.NumberOfVACBans})
        </Badge>
      );
    }
    
    if (bans.CommunityBanned) {
      badges.push(
        <Badge key="community" variant="destructive" className="bg-orange-600">
          Community Ban
        </Badge>
      );
    }
    
    if (bans.NumberOfGameBans > 0) {
      badges.push(
        <Badge key="game" variant="destructive" className="bg-yellow-600">
          Game Ban ({bans.NumberOfGameBans})
        </Badge>
      );
    }

    if (badges.length === 0) {
      badges.push(
        <Badge key="clean" variant="default" className="bg-green-600">
          ✓ Limpo
        </Badge>
      );
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const isPlayerBanned = (bans?: SteamBans | null) => {
    if (!bans) return false;
    return bans.VACBanned || bans.CommunityBanned || (bans.NumberOfGameBans ?? 0) > 0;
  };

  const sortedPlayers = getSortedPlayers();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Base de Jogadores
            </h1>
            <p className="text-slate-400 mt-1">Visão unificada de todos os dados</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
              🏠 Início
            </Button>
            <Button onClick={() => window.location.href = '/reports'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
              📋 Denúncias
            </Button>
            <Button onClick={() => window.location.href = '/upload'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
              📤 Upload
            </Button>
            <Button onClick={() => window.location.href = '/steam'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
              🔍 Steam
            </Button>
            <Button onClick={() => window.location.href = '/queue'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
              📋 Fila
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label className="text-slate-300">Buscar</Label>
                <Input
                  placeholder="Nome, SteamID ou perfil Steam..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <Label className="text-slate-300">Servidor</Label>
                <Select value={selectedServer} onValueChange={setSelectedServer}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os servidores</SelectItem>
                    {servers.map((server) => (
                      <SelectItem key={server.$id} value={server.$id}>
                        {server.flag} {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="steamid">SteamID</SelectItem>
                    <SelectItem value="server">Servidor</SelectItem>
                    <SelectItem value="lastSeen">Último visto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Banimentos</Label>
                <Select value={filterBanned} onValueChange={setFilterBanned}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="banned">Apenas banidos</SelectItem>
                    <SelectItem value="clean">Apenas limpos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total de Jogadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-100">{sortedPlayers.length}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Com Dados Steam</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">
                {sortedPlayers.filter(p => p.steamData).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Banidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">
                {sortedPlayers.filter(p => p.steamBans?.VACBanned || p.steamBans?.CommunityBanned || (p.steamBans?.NumberOfGameBans ?? 0) > 0).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Limpos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {sortedPlayers.filter(p => p.steamBans && !p.steamBans.VACBanned && !p.steamBans.CommunityBanned && p.steamBans.NumberOfGameBans === 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players Table */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Jogadores ({sortedPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-slate-400">Carregando...</div>
            ) : sortedPlayers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Nenhum jogador encontrado com os filtros selecionados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-300 font-medium">Avatar</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Nome</th>
                      <th className="text-left p-3 text-slate-300 font-medium">SteamID</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Perfil Steam</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Banimentos</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Último Visto</th>
                      <th className="text-center p-3 text-slate-300 font-medium">Avaliação</th>
                      <th className="text-center p-3 text-slate-300 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((player) => {
                      const isBanned = isPlayerBanned(player.steamBans);
                      return (
                      <tr key={player.$id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="p-3">
                          {isBanned ? (
                            player.steamData?.avatar ? (
                              <img
                                src={player.steamData.avatar}
                                alt={player.currentName}
                                className="w-12 h-12 rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
                                N/A
                              </div>
                            )
                          ) : (
                            <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center text-slate-500 text-xs">
                              🔒
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="text-slate-100 font-medium">{player.currentName}</div>
                              {player.nameHistory && player.nameHistory.length > 1 ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                      Ver {player.nameHistory.length} nome(s) →
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-slate-900 border-slate-700">
                                    <DialogHeader>
                                      <DialogTitle className="text-slate-100">Histórico de Nomes</DialogTitle>
                                      <DialogDescription className="text-slate-400">
                                        SteamID: {player.steamid}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                      {player.nameHistory.map((name, idx) => (
                                        <div
                                          key={idx}
                                          className={`p-3 rounded-lg border ${
                                            idx === 0
                                              ? "bg-blue-500/10 border-blue-500/30"
                                              : "bg-slate-800 border-slate-700"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-200 font-medium">{name}</span>
                                            {idx === 0 && (
                                              <Badge className="bg-blue-600 text-white">Atual</Badge>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <span className="text-xs text-slate-500">Nome único</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {isBanned ? (
                            <div className="font-mono text-sm text-slate-300">{player.steamid}</div>
                          ) : (
                            <div className="text-slate-500 text-sm">🔒 Oculto</div>
                          )}
                        </td>
                        <td className="p-3">
                          {isBanned ? (
                            player.steamData ? (
                              <div>
                                <div className="text-slate-200">{player.steamData.personaname}</div>
                                <div className="text-xs text-slate-400">
                                  {getVisibilityLabel(player.steamData.communityvisibilitystate)}
                                </div>
                                {player.steamData.profileurl && (
                                  <a
                                    href={player.steamData.profileurl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                  >
                                    Ver perfil →
                                  </a>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-slate-500">Não consultado</Badge>
                            )
                          ) : (
                            <div className="text-slate-500 text-sm">🔒 Oculto</div>
                          )}
                        </td>
                        <td className="p-3">
                          {getBanBadges(player.steamBans)}
                          {player.steamBans && player.steamBans.DaysSinceLastBan > 0 && (
                            <div className="text-xs text-slate-400 mt-1">
                              Último ban há {player.steamBans.DaysSinceLastBan} dias
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-slate-300">
                            {formatDate(player.lastSeen)}
                          </div>
                          <div className="text-xs text-slate-500">
                            Visto pela primeira vez: {formatDate(player.firstSeen)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col items-center gap-2">
                            {/* Vote counts */}
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-400">
                                👍 {player.votes?.likes || 0}
                              </span>
                              <span className="text-slate-400">
                                ⚪ {player.votes?.neutral || 0}
                              </span>
                              <span className="text-red-400">
                                👎 {player.votes?.dislikes || 0}
                              </span>
                            </div>
                            {/* Vote buttons */}
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant={player.votes?.userVote === 'like' ? 'default' : 'outline'}
                                className={`h-7 px-2 text-xs ${
                                  player.votes?.userVote === 'like'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                }`}
                                onClick={() => handleVote(player.steamid, player.currentName, 'like')}
                              >
                                👍
                              </Button>
                              <Button
                                size="sm"
                                variant={player.votes?.userVote === 'neutral' ? 'default' : 'outline'}
                                className={`h-7 px-2 text-xs ${
                                  player.votes?.userVote === 'neutral'
                                    ? 'bg-slate-600 hover:bg-slate-700 text-white'
                                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                }`}
                                onClick={() => handleVote(player.steamid, player.currentName, 'neutral')}
                              >
                                ⚪
                              </Button>
                              <Button
                                size="sm"
                                variant={player.votes?.userVote === 'dislike' ? 'default' : 'outline'}
                                className={`h-7 px-2 text-xs ${
                                  player.votes?.userVote === 'dislike'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                }`}
                                onClick={() => handleVote(player.steamid, player.currentName, 'dislike')}
                              >
                                👎
                              </Button>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/reports/${player.steamid}`}
                              className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs"
                            >
                              📋 Ver Denúncias
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Votação */}
      <Dialog open={voteModalOpen} onOpenChange={setVoteModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100 text-xl">
              Avaliar Jogador
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedPlayerForVote?.name} ({selectedPlayerForVote?.steamid})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Tipo de voto selecionado */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-300">Sua avaliação:</span>
              {selectedVoteType === 'like' && (
                <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                  👍 Positiva
                </Badge>
              )}
              {selectedVoteType === 'neutral' && (
                <Badge className="bg-slate-600 text-white text-lg px-4 py-2">
                  ⚪ Neutra
                </Badge>
              )}
              {selectedVoteType === 'dislike' && (
                <Badge className="bg-red-600 text-white text-lg px-4 py-2">
                  👎 Negativa
                </Badge>
              )}
            </div>

            {/* Aviso importante */}
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="space-y-2">
                  <p className="text-yellow-200 font-semibold text-sm">
                    IMPORTANTE: Avalie apenas sobre uso de CHEATS
                  </p>
                  <ul className="text-yellow-100 text-xs space-y-1 list-disc list-inside">
                    <li>NÃO avalie baseado em comportamento pessoal</li>
                    <li>NÃO avalie por discordâncias no jogo</li>
                    <li>APENAS se suspeita ou tem certeza de uso de trapaças</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Campo de motivo */}
            <div className="space-y-2">
              <Label className="text-slate-300 font-medium">
                Motivo da avaliação *
              </Label>
              <textarea
                value={voteReason}
                onChange={(e) => setVoteReason(e.target.value)}
                placeholder="Explique por que você acha que este jogador usa/não usa cheats..."
                className="w-full min-h-[120px] p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-slate-500 text-right">
                {voteReason.length}/1000 caracteres
              </p>
            </div>

            {/* Clips de Gameplay */}
            <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium text-sm">🎥 Links de Clips (Opcional)</span>
                <span className="text-slate-500 text-xs">Evidências de gameplay</span>
              </div>

              {/* YouTube Links */}
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </Label>
                {youtubeLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...youtubeLinks];
                        newLinks[index] = e.target.value;
                        setYoutubeLinks(newLinks);
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                    />
                    {index === youtubeLinks.length - 1 && index < 2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setYoutubeLinks([...youtubeLinks, ""])}
                        className="border-slate-600 text-slate-400 hover:bg-slate-800"
                      >
                        +
                      </Button>
                    )}
                    {youtubeLinks.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setYoutubeLinks(youtubeLinks.filter((_, i) => i !== index))}
                        className="border-slate-600 text-slate-400 hover:bg-slate-800"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Medal.tv Links */}
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  Medal.tv
                </Label>
                {medalLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...medalLinks];
                        newLinks[index] = e.target.value;
                        setMedalLinks(newLinks);
                      }}
                      placeholder="https://medal.tv/games/..."
                      className="flex-1 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                    />
                    {index === medalLinks.length - 1 && index < 2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setMedalLinks([...medalLinks, ""])}
                        className="border-slate-600 text-slate-400 hover:bg-slate-800"
                      >
                        +
                      </Button>
                    )}
                    {medalLinks.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setMedalLinks(medalLinks.filter((_, i) => i !== index))}
                        className="border-slate-600 text-slate-400 hover:bg-slate-800"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setVoteModalOpen(false)}
                disabled={submittingVote}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={submitVote}
                disabled={submittingVote || !voteReason.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {submittingVote ? "Enviando..." : "Confirmar Avaliação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
