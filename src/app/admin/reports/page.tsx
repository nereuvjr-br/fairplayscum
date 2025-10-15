"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Report {
  $id: string;
  steamid: string;
  playerName: string;
  reason: string;
  clips: string | null;
  createdAt: string;
  updatedAt: string;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[AdminReports] user:', user, 'authLoading:', authLoading);
    // Redireciona para login só se authLoading for false e user for null
    if (!authLoading && (!user || !user.$id)) {
      router.replace('/admin/login');
      return;
    }
    // Quando a auth estiver resolvida, buscar reports se estiver logado
    if (!authLoading && user) {
      fetchReports();
    }
  }, [filter, authLoading, user, fetchReports, router]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?filter=${filter}`);
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      const response = await fetch("/api/admin/reports/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, adminName: "Admin" }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Denúncia aprovada com sucesso!");
        fetchReports();
      } else {
        alert("Erro ao aprovar denúncia: " + data.error);
      }
    } catch (error) {
      console.error("Error approving report:", error);
      alert("Erro ao aprovar denúncia");
    }
  };

  const handleReject = async (reportId: string) => {
    if (!confirm("Tem certeza que deseja rejeitar esta denúncia? Ela será removida permanentemente.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/reports/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Denúncia rejeitada e removida!");
        fetchReports();
      } else {
        alert("Erro ao rejeitar denúncia: " + data.error);
      }
    } catch (error) {
      console.error("Error rejecting report:", error);
      alert("Erro ao rejeitar denúncia");
    }
  };

  const parseClips = (clipsJson: string | null) => {
    if (!clipsJson) return { youtube: [], medal: [] };
    try {
      return JSON.parse(clipsJson);
    } catch {
      return { youtube: [], medal: [] };
    }
  };

  if (authLoading) {
    return <div className="p-8 text-slate-400">Verificando sessão...</div>;
  }
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              🛡️ Painel de Moderação
            </h1>
            <p className="text-slate-400">Aprovação e gerenciamento de denúncias</p>
          </div>
          <div>
            <Button onClick={logout} variant="outline" size="sm" className="border-slate-700">
              Sair
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : "border-slate-700"}
          >
            ⏳ Pendentes
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            className={filter === "approved" ? "bg-green-600 hover:bg-green-700" : "border-slate-700"}
          >
            ✓ Aprovadas
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-slate-700 hover:bg-slate-600" : "border-slate-700"}
          >
            📋 Todas
          </Button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Carregando denúncias...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Nenhuma denúncia {filter === "pending" ? "pendente" : filter === "approved" ? "aprovada" : ""} encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const clips = parseClips(report.clips);
              return (
                <Card key={report.$id} className="bg-slate-900/50 border-slate-800 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-cyan-400">{report.playerName}</h3>
                      <p className="text-sm text-slate-500">Steam ID: {report.steamid}</p>
                      <p className="text-xs text-slate-600">
                        Denúncia criada em: {new Date(report.createdAt).toLocaleString("pt-BR")}
                      </p>
                      {report.updatedAt !== report.createdAt && (
                        <p className="text-xs text-slate-600">
                          Atualizada em: {new Date(report.updatedAt).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {report.approved ? (
                        <Badge className="bg-green-600 text-white">
                          ✓ Aprovada
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-600 text-white">
                          ⏳ Pendente
                        </Badge>
                      )}
                      {report.approved && report.approvedBy && (
                        <div className="text-xs text-slate-500">
                          Por: {report.approvedBy}
                          <br />
                          {new Date(report.approvedAt!).toLocaleString("pt-BR")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Motivo da denúncia:</h4>
                    <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg whitespace-pre-wrap">
                      {report.reason}
                    </p>
                  </div>

                  {/* Clips */}
                  {(clips.youtube.length > 0 || clips.medal.length > 0) && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-400 mb-2">📹 Provas (clips):</h4>
                      <div className="space-y-2">
                        {clips.youtube.map((url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-red-400 hover:text-red-300 text-sm hover:underline"
                          >
                            ▶️ YouTube: {url}
                          </a>
                        ))}
                        {clips.medal.map((url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-purple-400 hover:text-purple-300 text-sm hover:underline"
                          >
                            🏅 Medal.tv: {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  {!report.approved && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                      <Button
                        onClick={() => handleApprove(report.$id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        ✓ Aprovar Denúncia
                      </Button>
                      <Button
                        onClick={() => handleReject(report.$id)}
                        variant="outline"
                        className="border-red-700 text-red-400 hover:bg-red-900/20"
                      >
                        ✕ Rejeitar e Remover
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
