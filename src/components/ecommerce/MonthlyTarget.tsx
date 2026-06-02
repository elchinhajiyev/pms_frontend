import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import surveyService, {
  Survey,
  SurveyParticipationSummary,
} from "../../services/surveyService";

const emptySummary: SurveyParticipationSummary = {
  total_students: 0,
  participated_students: 0,
  not_participated_students: 0,
  participation_percentage: 0,
};

export default function MonthlyTarget() {
  const [latestSurvey, setLatestSurvey] = useState<Survey | null>(null);
  const [summary, setSummary] = useState<SurveyParticipationSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            setSummary(emptySummary);
          }
          return;
        }

        const summaryResponse = await surveyService.getParticipationSummary(
          Number(newestSurvey.id)
        );

        if (isMounted) {
          setLatestSurvey(newestSurvey);
          setSummary(summaryResponse?.data || emptySummary);
        }
      } catch (requestError: any) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              "İştirak statistikası yüklənmədi"
          );
          setSummary(emptySummary);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const percentage = Math.min(
    100,
    Math.max(0, Number(summary.participation_percentage || 0))
  );
  const series = [percentage];
  const options = useMemo<ApexOptions>(
    () => ({
      colors: ["#465FFF"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "radialBar",
        sparkline: { enabled: true },
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: { size: "76%" },
          track: {
            background: "#E4E7EC",
            strokeWidth: "100%",
            margin: 5,
          },
          dataLabels: {
            name: { show: false },
            value: {
              fontSize: "34px",
              fontWeight: "600",
              offsetY: -34,
              color: "#1D2939",
              formatter: (value) => `${Number(value).toFixed(1)}%`,
            },
          },
        },
      },
      fill: { type: "solid", colors: ["#465FFF"] },
      stroke: { lineCap: "round" },
      labels: ["İştirak"],
    }),
    []
  );

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-1 flex-col rounded-2xl bg-white px-5 pt-5 shadow-default dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Son sorğuda iştirak hədəfi
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {latestSurvey?.title || "Son sorğu tapılmadı"}
          </p>
        </div>

        {loading ? (
          <div className="grid flex-1 place-items-center text-sm text-gray-500 dark:text-gray-400">
            Yüklənir...
          </div>
        ) : error ? (
          <div className="my-5 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : (
          <>
            <div className="relative mt-auto">
              <Chart
                options={options}
                series={series}
                type="radialBar"
                height={265}
              />
            </div>
            <p className="mx-auto mb-6 -mt-5 max-w-[360px] text-center text-sm text-gray-500 dark:text-gray-400">
              Ümumi tələbələrin {percentage.toFixed(1)}%-i son sorğuda iştirak edib.
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-200 px-3 py-4 dark:divide-gray-800">
        <div className="px-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ümumi tələbə</p>
          <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            {summary.total_students}
          </p>
        </div>
        <div className="px-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">İştirak edən</p>
          <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
            {summary.participated_students}
          </p>
        </div>
        <div className="px-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">İştirak etməyən</p>
          <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400">
            {summary.not_participated_students}
          </p>
        </div>
      </div>
    </div>
  );
}
