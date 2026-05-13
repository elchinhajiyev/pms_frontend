import { useState, useEffect } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { evaluationService, PendingEvaluation } from "../../services/evaluationService";

export default function PendingEvaluations() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      loadPendingEvaluations();
    }
  }, [user]);

  const loadPendingEvaluations = async () => {
    try {
      const response = await evaluationService.getPendingForUser(user!.id, "2025-2026");
      if (response.success) {
        setPending(response.data);
      }
    } catch (err) {
      setError("Məlumatlar yüklənə bilmədi");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedByRule = pending.reduce((acc, item) => {
    const key = item.rule_name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, PendingEvaluation[]>);

  return (
    <>
      <PageMeta title="Gözləyən Qiymətləndirmələr | Performix" description="" />
      <PageBreadcrumb pageTitle="Gözləyən Qiymətləndirmələr" />

      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">Gözləyən qiymətləndirmə yoxdur</p>
              <p className="mt-1">Bütün qiymətləndirmələri tamamlamısınız</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedByRule).map(([ruleName, items]) => (
            <div key={ruleName} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {ruleName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {items.length} nəfər qiymətləndirilməlidir
                </p>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <div
                    key={`${item.user_id}-${item.rule_id}`}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                        <span className="text-brand-600 dark:text-brand-400 font-medium">
                          {item.first_name.charAt(0)}{item.last_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.first_name} {item.last_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.group_name}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/evaluation/submit/${item.user_id}/${item.rule_id}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition"
                    >
                      Qiymətləndir
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
