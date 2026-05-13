import { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { evaluationService, Evaluation, UserStats } from "../../services/evaluationService";

export default function MyEvaluations() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"received" | "given">("received");

  const roleCode = String(user?.role_code || "").toUpperCase();
  const roleName = String(user?.role_name || "").toLowerCase();
  const isTeacher = roleCode === "TEACHER" || roleName.includes("müəllim") || roleName.includes("teacher");
  const canSeeGivenTab = !isTeacher;

  useEffect(() => {
    if (!canSeeGivenTab && activeTab === "given") {
      setActiveTab("received");
    }
  }, [canSeeGivenTab, activeTab]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "received") {
        const [evalsResponse, statsResponse] = await Promise.all([
          evaluationService.getReceivedByUser(user!.id, "2025-2026"),
          evaluationService.getUserStats(user!.id, "2025-2026")
        ]);

        if (evalsResponse.success) {
          setEvaluations(evalsResponse.data);
        }
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } else {
        const response = await evaluationService.getGivenByUser(user!.id, "2025-2026");
        if (response.success) {
          setEvaluations(response.data);
        }
      }
    } catch (err) {
      setError("Məlumatlar yüklənə bilmədi");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    };

    const labels: Record<string, string> = {
      draft: "Qaralama",
      submitted: "Göndərilmiş",
      approved: "Təsdiqlənmiş",
      rejected: "Rədd edilmiş"
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600 dark:text-green-400";
    if (score >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const groupedEvaluations = useMemo(() => {
    return evaluations.reduce((acc, evaluation) => {
      const key = evaluation.rule_name || "Qiymətləndirmə";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(evaluation);
      return acc;
    }, {} as Record<string, Evaluation[]>);
  }, [evaluations]);

  const groupedEvaluationEntries = useMemo(() => {
    return Object.entries(groupedEvaluations).sort(([a], [b]) => a.localeCompare(b, "az"));
  }, [groupedEvaluations]);

  const sortedEvaluations = useMemo(() => {
    return [...evaluations].sort((a, b) => {
      const left = new Date(a.submitted_at || a.created_at || 0).getTime();
      const right = new Date(b.submitted_at || b.created_at || 0).getTime();
      return right - left;
    });
  }, [evaluations]);

  return (
    <>
      <PageMeta title="Qiymətləndirilən tapşırıqlar | Performix" description="" />
      <PageBreadcrumb pageTitle="Qiymətləndirilən tapşırıqlar" />

      <div className="space-y-6">
        {isTeacher && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            Müəllim hesabı üçün yalnız sizə aid qiymətləndirilən tapşırıqlar göstərilir.
          </div>
        )}

        {/* Stats Cards - Only for received */}
        {activeTab === "received" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Ümumi Qiymətləndirmə</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {stats.summary.total_evaluations || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Orta Bal</p>
              <p className={`text-2xl font-bold mt-1 ${getScoreColor(stats.summary.overall_average || 0)}`}>
                {(stats.summary.overall_average || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Minimum Bal</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {(stats.summary.min_score || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Maksimum Bal</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {(stats.summary.max_score || 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Parameter Stats - Only for received */}
        {activeTab === "received" && stats && stats.byParameter && stats.byParameter.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Parametrlər üzrə Orta Bal
            </h3>
            <div className="space-y-4">
              {stats.byParameter.map(param => (
                <div key={param.code} className="flex items-center gap-4">
                  <div className="w-40 text-sm text-gray-600 dark:text-gray-400">
                    {param.name}
                  </div>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        param.average_score >= 4
                          ? "bg-green-500"
                          : param.average_score >= 3
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${(param.average_score / 5) * 100}%` }}
                    />
                  </div>
                  <div className={`w-12 text-right font-medium ${getScoreColor(param.average_score)}`}>
                    {param.average_score.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("received")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === "received"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                Qiymətləndirilən tapşırıqlar
              </button>
              {canSeeGivenTab && (
                <button
                  onClick={() => setActiveTab("given")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === "given"
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  Mənim qiymətləndirdiyim tapşırıqlar
                </button>
              )}
            </nav>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border-b border-red-400 text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-medium">Qiymətləndirmə tapılmadı</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 md:p-6">
              {groupedEvaluationEntries.map(([taskName, taskEvaluations]) => {
                const taskItems = [...taskEvaluations].sort((a, b) => {
                  const left = new Date(a.submitted_at || a.created_at || 0).getTime();
                  const right = new Date(b.submitted_at || b.created_at || 0).getTime();
                  return right - left;
                });

                return (
                  <div key={taskName} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/70">
                      <div>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                          {taskName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {taskItems.length} qiymətləndirmə
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                        {activeTab === "received" ? "Mənə verilən" : "Mənim verdiyim"}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {taskItems.map((evaluation) => (
                        <div key={evaluation.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                                <span className={`text-2xl font-bold ${getScoreColor(evaluation.average_score)}`}>
                                  {evaluation.average_score.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {activeTab === "received"
                                    ? evaluation.evaluator_name || "Anonim"
                                    : evaluation.evaluatee_name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {evaluation.rule_name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(evaluation.status)}
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {evaluation.submitted_at
                                  ? new Date(evaluation.submitted_at).toLocaleDateString("az-AZ")
                                  : "-"}
                              </p>
                            </div>
                          </div>
                          {evaluation.general_comment && (
                            <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
                              "{evaluation.general_comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
