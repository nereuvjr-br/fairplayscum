"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Report {
  $id: string;
  voteType: string;
  reason: string;
  clips: Array<{ type: string; url: string }>;
  createdAt: string;
  updatedAt: string;
}

interface PlayerData {
  currentName: string;
  nameHistory: string[];
  firstSeen: string;
  lastSeen: string;
}

interface SteamData {
  personaname: string;
  avatar: string;
  avatarfull: string;
  profileurl: string;
  communityvisibilitystate: number;
}

interface SteamBans {
  VACBanned: boolean;
  NumberOfVACBans: number;
  CommunityBanned: boolean;
  NumberOfGameBans: number;
  DaysSinceLastBan: number;
}

interface Stats {
  total: number;
  totalApproved: number;
  totalPending: number;
  withClips: number;
}

export default function PlayerReportsPage() {
  const params = useParams();
  const steamid = params.steamid as string;

  const [reports, setReports] = useState<Report[]>([]);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [steamData, setSteamData] = useState<SteamData | null>(null);
  const [steamBans, setSteamBans] = useState<SteamBans | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, totalApproved: 0, totalPending: 0, withClips: 0 });
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/${steamid}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
        setPlayer(data.player);
        setSteamData(data.steamData);
        setSteamBans(data.steamBans);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar denúncias:", error);
    } finally {
      setLoading(false);
    }
  }, [steamid]);

  useEffect(() => {
    if (steamid) {
      loadReports();
    }
  }, [steamid, loadReports]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getBanBadges = (bans: SteamBans | null) => {
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => window.location.href = '/players'} 
            variant="outline" 
            size="sm"
            className="border-slate-600 text-slate-200 hover:bg-slate-800"
          >
            ← Voltar para Jogadores
          </Button>
          <Button 
            onClick={() => window.location.href = '/reports'} 
            variant="outline" 
            size="sm"
            className="border-slate-600 text-slate-200 hover:bg-slate-800"
          >
            📋 Ver Todas as Denúncias
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Carregando...</div>
        ) : (
          <>
            {/* Player Info Card */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {steamData?.avatarfull ? (
                      <Image
                        src={steamData.avatarfull}
                        alt={player?.currentName || "Player"}
                        width={128}
                        height={128}
                        className="w-32 h-32 rounded-lg border-2 border-slate-700"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500">
                        N/A
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-100">
                        {player?.currentName || "Nome Desconhecido"}
                      </h1>
                      {steamData?.personaname && (
                        <p className="text-slate-400 mt-1">
                          Steam: {steamData.personaname}
                        </p>
                      )}
                    </div>

                    <div className="font-mono text-sm text-slate-400">
                      SteamID: <span className="text-cyan-400">{steamid}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getBanBadges(steamBans)}
                    </div>

                    {steamData?.profileurl && (
                      <a
                        href={steamData.profileurl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-blue-400 hover:text-blue-300"
                      >
                        Ver perfil no Steam →
                      </a>
                    )}

                    {player && (
                      <div className="text-xs text-slate-500">
                        Primeiro visto: {formatDate(player.firstSeen)} • 
                        Último visto: {formatDate(player.lastSeen)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Denúncias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-400">{stats.total}</div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Aprovadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">{stats.totalApproved}</div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-400">{stats.totalPending}</div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Com Clips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">{stats.withClips}</div>
                </CardContent>
              </Card>
            </div>

            {/* Reports List */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Denúncias Aprovadas ({reports.length})
                </CardTitle>
                <p className="text-sm text-slate-400 mt-2">
                  Apenas denúncias aprovadas pela moderação são exibidas aqui.
                </p>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Nenhuma avaliação registrada para este jogador
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.$id}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-red-600 text-white">
                              🚨 Denúncia Aprovada
                            </Badge>
                            {report.clips && report.clips.length > 0 && (
                              <Badge variant="outline" className="border-purple-500 text-purple-400">
                                🎥 {report.clips.length} clip(s)
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDate(report.createdAt)}
                          </span>
                        </div>

                        {/* Reason */}
                        <p className="text-slate-300 text-sm mb-3 whitespace-pre-wrap">
                          {report.reason}
                        </p>

                        {/* Clips */}
                        {report.clips && report.clips.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-slate-700">
                            <div className="text-xs text-slate-400 font-medium mb-2">
                              Clips Anexados:
                            </div>
                            {report.clips.map((clip, index) => (
                              <a
                                key={index}
                                href={clip.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-2 rounded bg-slate-800 border border-slate-700 hover:border-cyan-500 transition-colors"
                              >
                                <div className="flex-shrink-0">
                                  {clip.type === "youtube" ? (
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-slate-300 text-xs font-medium capitalize">
                                    {clip.type === "youtube" ? "YouTube" : "Medal.tv"}
                                  </div>
                                  <div className="text-slate-500 text-xs truncate">{clip.url}</div>
                                </div>
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
