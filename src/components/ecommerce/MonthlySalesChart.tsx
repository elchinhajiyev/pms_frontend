import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { resolveUserPhotoUrl } from "../common/UserAvatar";
import surveyService, {
  Survey,
  SurveyTeacherResultRow,
} from "../../services/surveyService";

const MAX_SCORE = 5;
const CHART_HEIGHT = 220;

const getFullName = (row: SurveyTeacherResultRow) =>
  [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(" ");

type HoveredTeacher = {
  row: SurveyTeacherResultRow;
  top: number;
  left: number;
};

export default function MonthlySalesChart() {
  const [latestSurvey, setLatestSurvey] = useState<Survey | null>(null);
  const [results, setResults] = useState<SurveyTeacherResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredTeacher, setHoveredTeacher] = useState<HoveredTeacher | null>(null);
  const closeTooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelTooltipClose = () => {
    if (closeTooltipTimeout.current) {
      clearTimeout(closeTooltipTimeout.current);
      closeTooltipTimeout.current = null;
    }
  };

  const scheduleTooltipClose = () => {
    cancelTooltipClose();
    closeTooltipTimeout.current = setTimeout(() => setHoveredTeacher(null), 150);
  };

  const showTeacherTooltip = (
    row: SurveyTeacherResultRow,
    element: HTMLElement
  ) => {
    cancelTooltipClose();
    const rect = element.getBoundingClientRect();
    setHoveredTeacher({
      row,
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const surveysResponse = await surveyService.getAll();
        const surveys = Array.isArray(surveysResponse?.data)
          ? surveysResponse.data
          : [];
        const newestSurvey = [...surveys].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        if (!newestSurvey) {
          if (isMounted) {
            setLatestSurvey(null);
            setResults([]);
          }
          return;
        }

        const resultsResponse = await surveyService.getTeacherResultsBySurvey(
          Number(newestSurvey.id)
        );

        if (isMounted) {
          setLatestSurvey(newestSurvey);
          setResults(Array.isArray(resultsResponse?.data) ? resultsResponse.data : []);
        }
      } catch (requestError: any) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              "Son sorğunun nəticələri yüklənmədi"
          );
          setResults([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      cancelTooltipClose();
    };
  }, []);

  const topResults = useMemo(
    () =>
      results
        .filter((row) => Number.isFinite(Number(row.overall_average_score)))
        .sort(
          (a, b) =>
            Number(b.overall_average_score) - Number(a.overall_average_score)
        )
        .slice(0, 50),
    [results]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Son sorğunun nəticələri
        </h3>
        {latestSurvey && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {latestSurvey.title} · ən yüksək orta bal toplayan {topResults.length} müəllim
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid h-[300px] place-items-center text-sm text-gray-500 dark:text-gray-400">
          Yüklənir...
        </div>
      ) : error ? (
        <div className="my-5 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : topResults.length === 0 ? (
        <div className="grid h-[300px] place-items-center text-sm text-gray-500 dark:text-gray-400">
          Sorğu nəticəsi tapılmadı.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto pb-4">
          <div className="flex min-w-max">
            <div className="mr-3 grid shrink-0 grid-rows-[220px_42px]">
              <div className="flex w-7 flex-col justify-between pb-1 text-right text-[11px] text-gray-400">
                {[5, 4, 3, 2, 1, 0].map((score) => (
                  <span key={score}>{score}</span>
                ))}
              </div>
            </div>

            <div className="relative flex h-[262px] items-start gap-3 border-b border-gray-200 dark:border-gray-700">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px]">
                {[0, 1, 2, 3, 4, 5].map((line) => (
                  <div
                    key={line}
                    className="absolute inset-x-0 border-t border-dashed border-gray-200 dark:border-gray-800"
                    style={{ top: `${(line / 5) * 100}%` }}
                  />
                ))}
              </div>

              {topResults.map((row) => {
                const score = Number(row.overall_average_score || 0);
                const fullName = getFullName(row);

                return (
                  <div
                    key={row.teacher_id}
                    className="relative z-10 grid w-12 shrink-0 grid-rows-[220px_42px]"
                    title={`${fullName}: ${score.toFixed(2)}`}
                  >
                    <div className="flex flex-col items-center justify-end">
                      <span className="mb-1 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                        {score.toFixed(2)}
                      </span>
                      <div
                        className="w-7 rounded-t-md bg-brand-500 transition hover:bg-brand-600"
                        style={{
                          height: `${Math.max(4, (score / MAX_SCORE) * (CHART_HEIGHT - 22))}px`,
                        }}
                      />
                    </div>
                    <div
                      className="flex items-end justify-center pb-1"
                      onMouseEnter={(event) =>
                        showTeacherTooltip(row, event.currentTarget)
                      }
                      onMouseLeave={scheduleTooltipClose}
                    >
                      <img
                        src={resolveUserPhotoUrl(row.photo)}
                        alt={fullName}
                        className="h-8 w-8 rounded-full border border-gray-200 bg-gray-100 object-cover dark:border-gray-700"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {hoveredTeacher &&
        createPortal(
          <div
            className="fixed z-[999999] w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900"
            style={{ top: hoveredTeacher.top, left: hoveredTeacher.left }}
            onMouseEnter={cancelTooltipClose}
            onMouseLeave={scheduleTooltipClose}
          >
            <Link
              to={`/profile?userId=${hoveredTeacher.row.teacher_id}`}
              className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {[hoveredTeacher.row.last_name, hoveredTeacher.row.first_name]
                .filter(Boolean)
                .join(" ") || "-"}
            </Link>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Ata adı: {hoveredTeacher.row.middle_name || "-"}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Departament: {hoveredTeacher.row.department_name || "-"}
            </p>
          </div>,
          document.body
        )}
    </div>
  );
}
