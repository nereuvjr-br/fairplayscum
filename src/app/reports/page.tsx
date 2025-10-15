"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
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
} from "@/components/ui/dialog";

interface Report {
  $id: string;
  steamid: string;
  voteType: string;
  reason: string;
  clips: Array<{ type: string; url: string }>;
  createdAt: string;
  updatedAt: string;
  player: {
    currentName: string;
    nameHistory: string[];
    firstSeen: string;
    lastSeen: string;
  } | null;
  steamData: {
    personaname: string;
    avatar: string;
    profileurl: string;
    communityvisibilitystate: number;
  } | null;
  steamBans: {
    VACBanned: boolean;
    NumberOfVACBans: number;
    CommunityBanned: boolean;
    NumberOfGameBans: number;
    DaysSinceLastBan: number;
  } | null;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filterType, loadReports]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReports();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, loadReports]);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("voteType", filterType);
      if (search) params.append("search", search);
      params.append("limit", "100");

      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Erro ao carregar denúncias:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getVoteBadge = (voteType: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      like: { bg: "bg-green-600", text: "text-white", label: "👍 Positivo" },
      neutral: { bg: "bg-slate-600", text: "text-white", label: "⚪ Neutro" },
      dislike: { bg: "bg-red-600", text: "text-white", label: "👎 Negativo" },
    };
    const config = configs[voteType] || configs.neutral;
    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {config.label}
      </Badge>
    );
  };

  const getBanBadges = (bans: Report["steamBans"]) => {
    if (!bans) return <Badge variant="outline" className="text-slate-500">Sem dados</Badge>;

    const badges = [];
    if (bans.VACBanned) {
      badges.push(
        <Badge key="vac" className="bg-red-600 text-white">
          VAC Ban ({bans.NumberOfVACBans})
        </Badge>
      );
    }
    if (bans.CommunityBanned) {
      badges.push(
        <Badge key="community" className="bg-orange-600 text-white">
          Community Ban
        </Badge>
      );
    }
    if (bans.NumberOfGameBans > 0) {
      badges.push(
        <Badge key="game" className="bg-yellow-600 text-white">
          Game Ban ({bans.NumberOfGameBans})
        </Badge>
      );
    }
    if (badges.length === 0) {
      return <Badge className="bg-green-600 text-white">✓ Limpo</Badge>;
    }
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const openDetails = (report: Report) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const stats = {
    total: reports.length,
    negativas: reports.filter(r => r.voteType === "dislike").length,
    neutras: reports.filter(r => r.voteType === "neutral").length,
    positivas: reports.filter(r => r.voteType === "like").length,
    comClips: reports.filter(r => r.clips && r.clips.length > 0).length,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button onClick={() => window.location.href = '/upload'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                📤 Upload de Logs
              </Button>
              <Button onClick={() => window.location.href = '/players'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                👥 Base de Jogadores
              </Button>
              <Button onClick={() => window.location.href = '/steam'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                🔍 Consultar Steam
              </Button>
              <Button onClick={() => window.location.href = '/queue'} variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                📋 Gerenciar Fila
              </Button>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            📋 Histórico de Denúncias
          </h1>
          <p className="text-slate-400 text-lg">
            Todas as avaliações registradas pelos usuários
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Negativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{stats.negativas}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Neutras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-400">{stats.neutras}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Positivas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{stats.positivas}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Com Clips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{stats.comClips}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label className="text-slate-300">Buscar</Label>
                <Input
                  placeholder="Nome, SteamID ou motivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <Label className="text-slate-300">Tipo de Avaliação</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="dislike">👎 Negativas</SelectItem>
                    <SelectItem value="neutral">⚪ Neutras</SelectItem>
                    <SelectItem value="like">👍 Positivas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Denúncias ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-slate-400">Carregando...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Nenhuma denúncia encontrada
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.$id}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                    onClick={() => openDetails(report)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-lg bg-slate-700 flex-shrink-0">
                          {report.steamData?.avatar ? (
                            <Image
                              src={report.steamData.avatar}
                              alt={report.player?.currentName || "Player"}
                              width={64}
                              height={64}
                              className="w-full h-full rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                              N/A
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-slate-100 font-semibold truncate">
                              {report.player?.currentName || "Nome desconhecido"}
                            </h3>
                            {getVoteBadge(report.voteType)}
                            {report.clips && report.clips.length > 0 && (
                              <Badge variant="outline" className="border-purple-500 text-purple-400">
                                🎥 {report.clips.length} clip(s)
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                            {report.reason}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{formatDate(report.createdAt)}</span>
                            <span>•</span>
                            <span className="font-mono">{report.steamid}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bans */}
                      <div className="flex-shrink-0">
                        {getBanBadges(report.steamBans)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-3">
              {selectedReport?.steamData?.avatar && (
                <Image
                  src={selectedReport.steamData.avatar}
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded"
                />
              )}
              <div>
                <div>{selectedReport?.player?.currentName || "Nome desconhecido"}</div>
                <div className="text-sm text-slate-400 font-mono">
                  {selectedReport?.steamid}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Detalhes completos da denúncia
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              {/* Tipo de Avaliação */}
              <div>
                <Label className="text-slate-400 text-sm">Tipo de Avaliação</Label>
                <div className="mt-1">{getVoteBadge(selectedReport.voteType)}</div>
              </div>

              {/* Motivo */}
              <div>
                <Label className="text-slate-400 text-sm">Motivo</Label>
                <p className="mt-1 p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm whitespace-pre-wrap">
                  {selectedReport.reason}
                </p>
              </div>

              {/* Clips */}
              {selectedReport.clips && selectedReport.clips.length > 0 && (
                <div>
                  <Label className="text-slate-400 text-sm">Clips de Gameplay</Label>
                  <div className="mt-2 space-y-2">
                    {selectedReport.clips.map((clip, index) => (
                      <a
                        key={index}
                        href={clip.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-500 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {clip.type === "youtube" ? (
                            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-300 text-sm font-medium capitalize">
                            {clip.type === "youtube" ? "YouTube" : "Medal.tv"}
                          </div>
                          <div className="text-slate-500 text-xs truncate">{clip.url}</div>
                        </div>
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Steam Data */}
              {selectedReport.steamData && (
                <div>
                  <Label className="text-slate-400 text-sm">Perfil Steam</Label>
                  <div className="mt-1 p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="text-slate-200 font-medium">{selectedReport.steamData.personaname}</div>
                    {selectedReport.steamData.profileurl && (
                      <a
                        href={selectedReport.steamData.profileurl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                      >
                        Ver perfil →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Bans */}
              <div>
                <Label className="text-slate-400 text-sm">Status de Banimentos</Label>
                <div className="mt-1">{getBanBadges(selectedReport.steamBans)}</div>
                {selectedReport.steamBans && selectedReport.steamBans.DaysSinceLastBan > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Último ban há {selectedReport.steamBans.DaysSinceLastBan} dias
                  </p>
                )}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
                <div>
                  <Label className="text-slate-400 text-xs">Denúncia criada</Label>
                  <p className="text-slate-300 text-sm">{formatDate(selectedReport.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Última atualização</Label>
                  <p className="text-slate-300 text-sm">{formatDate(selectedReport.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
