import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import * as XLSX from "xlsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import surveyService, { SurveyTeacherResultRow } from "../../services/surveyService";
import { RiFileExcel2Line } from "react-icons/ri";

type SurveyMeta = {
  id: number;
  title: string;
  year: string;
  semester?: "YAZ" | "YAY" | "PAYIZ";
};

export default function SurveyTeacherResultsDetailPage() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<SurveyMeta | null>(null);
  const [rows, setRows] = useState<SurveyTeacherResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    const id = Number(surveyId);
    if (!Number.isFinite(id)) {
      setError("Sorğu ID düzgün deyil");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await surveyService.getTeacherResultsBySurvey(id);
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
      setSurvey(res?.survey || null);
    } catch (err: any) {
      setRows([]);
      setSurvey(null);
      setError(err?.response?.data?.message || "Sorğu detalları yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const semesterLabel = (semester?: string) => {
    if (semester === "YAZ") return "Yaz";
    if (semester === "YAY") return "Yay";
    if (semester === "PAYIZ") return "Payız";
    return "-";
  };

  const exportRows = useMemo(
    () =>
      rows.map((row) => ({
        "Müəllimin adı soyadı atasının adı": [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(" "),
        FİN: row.fin || "-",
        Kafedra: row.department_name || "-",
        "Səs verən tələbə sayı": row.voter_count ?? 0,
        "Ümumi orta bal": row.overall_average_score ? Number(row.overall_average_score).toFixed(2) : "-"
      })),
    [rows]
  );

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nəticələr");
    XLSX.writeFile(workbook, `survey-${survey?.id || "results"}-teacher-results.xlsx`);
  };

  return (
    <>
      <PageMeta title="Sorğu üzrə nəticələr | Performix" description="Sorğu üzrə müəllim nəticələrinin cədvəli" />
      <PageBreadcrumb pageTitle="Sorğu üzrə müəllim nəticələri" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{survey?.title || "Sorğu"}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tədris ili: {survey?.year || "-"} | Semestr: {semesterLabel(survey?.semester)}
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={rows.length === 0}
            className="rounded-md bg-emerald-600 px-2 py-2 text-md font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <div className="flex gap-2 items-center "><RiFileExcel2Line />
            <span>Excel faylda saxla</span></div>
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Bu sorğu üzrə nəticə tapılmadı.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2 font-medium">Müəllimin adı soyadı atasının adı</th>
                  <th className="px-3 py-2 font-medium">FİN</th>
                  <th className="px-3 py-2 font-medium">Kafedrası</th>
                  <th className="px-3 py-2 font-medium">Səs verən tələbə sayı</th>
                  <th className="px-3 py-2 font-medium">Ümumi orta bal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.teacher_id}-${index}`}
                    className={`border-b border-gray-100 last:border-b-0 dark:border-gray-700 ${
                      index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          photo={row.photo}
                          name={[row.last_name, row.first_name].filter(Boolean).join(" ")}
                          size="sm"
                        />
                        <span>
                          {[row.last_name, row.first_name, row.middle_name].filter(Boolean).join(" ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.fin || "-"}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.department_name || "-"}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.voter_count ?? 0}</td>
                    <td className="px-3 py-2 font-medium text-blue-700 dark:text-blue-400">
                      {row.overall_average_score ? Number(row.overall_average_score).toFixed(2) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
