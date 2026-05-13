import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import {
  evaluationService,
  evaluationParameterService,
  evaluationRuleService,
  EvaluationParameter,
  EvaluationRule,
  CreateEvaluationData
} from "../../services/evaluationService";
import api from "../../services/api";

interface EvaluateeInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employee_group_id?: number;
  department_id?: number;
  faculty_id?: number;
}

export default function EvaluationForm() {
  const { userId, ruleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [evaluatee, setEvaluatee] = useState<EvaluateeInfo | null>(null);
  const [rule, setRule] = useState<EvaluationRule | null>(null);
  const [parameters, setParameters] = useState<EvaluationParameter[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [generalComment, setGeneralComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [userId, ruleId]);

  const loadData = async () => {
    try {
      // Load evaluatee info
      const userResponse = await api.get(`/users/${userId}`);
      if (userResponse.data.success) {
        setEvaluatee(userResponse.data.data);
      }

      // Load rule
      const ruleResponse = await evaluationRuleService.getById(parseInt(ruleId!));
      if (ruleResponse.success) {
        setRule(ruleResponse.data);
      }

      // Load parameters
      const paramsResponse = await evaluationParameterService.getAll();
      if (paramsResponse.success) {
        setParameters(paramsResponse.data);
        // Initialize scores with minimum value
        const initialScores: Record<number, number> = {};
        paramsResponse.data.forEach((p: EvaluationParameter) => {
          initialScores[p.id] = 0;
        });
        setScores(initialScores);
      }
    } catch (err) {
      setError("Məlumatlar yüklənə bilmədi");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (parameterId: number, score: number) => {
    setScores(prev => ({ ...prev, [parameterId]: score }));
  };

  const handleCommentChange = (parameterId: number, comment: string) => {
    setComments(prev => ({ ...prev, [parameterId]: comment }));
  };

  const handleSubmit = async (status: "draft" | "submitted") => {
    // Validate all scores are filled
    const unfilledParams = parameters.filter(p => !scores[p.id] || scores[p.id] === 0);
    if (status === "submitted" && unfilledParams.length > 0) {
      setError(`Bütün parametrləri qiymətləndirin: ${unfilledParams.map(p => p.name).join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    const data: CreateEvaluationData = {
      evaluatee_id: parseInt(userId!),
      evaluatee_group_id: evaluatee?.employee_group_id,
      evaluatee_department_id: evaluatee?.department_id,
      evaluatee_faculty_id: evaluatee?.faculty_id,
      evaluator_id: user!.id,
      evaluator_group_id: user!.employee_group_id,
      is_anonymous: rule?.is_anonymous,
      rule_id: parseInt(ruleId!),
      general_comment: generalComment,
      status,
      academic_year: "2025-2026",
      scores: parameters.map(p => ({
        parameter_id: p.id,
        score: scores[p.id],
        comment: comments[p.id]
      })).filter(s => s.score > 0)
    };

    try {
      const response = await evaluationService.create(data);
      if (response.success) {
        navigate("/evaluation/pending", {
          state: { message: status === "submitted" ? "Qiymətləndirmə göndərildi" : "Qaralama saxlanıldı" }
        });
      } else {
        setError(response.message || "Xəta baş verdi");
      }
    } catch (err) {
      setError("Qiymətləndirmə göndərilə bilmədi");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Qiymətləndirmə | Performix" description="" />
      <PageBreadcrumb pageTitle="Qiymətləndirmə Formu" />

      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Evaluatee Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Qiymətləndirilən Şəxs
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <span className="text-2xl text-brand-600 dark:text-brand-400 font-medium">
                {evaluatee?.first_name.charAt(0)}{evaluatee?.last_name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-xl font-medium text-gray-800 dark:text-white">
                {evaluatee?.first_name} {evaluatee?.last_name}
              </p>
              <p className="text-gray-500 dark:text-gray-400">{evaluatee?.email}</p>
              {rule && (
                <p className="text-sm text-brand-500 mt-1">{rule.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Qiymətləndirmə Parametrləri
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hər parametr üçün 1-5 bal aralığında qiymət verin
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {parameters.map((param, index) => (
              <div key={param.id} className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      {index + 1}. {param.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {param.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleScoreChange(param.id, score)}
                        className={`w-10 h-10 rounded-lg font-medium transition ${
                          scores[param.id] === score
                            ? "bg-brand-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
                {rule?.require_comment && (
                  <textarea
                    placeholder="Şərh (opsional)"
                    value={comments[param.id] || ""}
                    onChange={(e) => handleCommentChange(param.id, e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={2}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Comment */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Ümumi Şərh
          </h3>
          <textarea
            placeholder="Ümumi qiymətləndirmə haqqında şərhinizi yazın..."
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition"
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            Qaralama saxla
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("submitted")}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition disabled:opacity-50"
          >
            {isSubmitting ? "Göndərilir..." : "Göndər"}
          </button>
        </div>
      </div>
    </>
  );
}
