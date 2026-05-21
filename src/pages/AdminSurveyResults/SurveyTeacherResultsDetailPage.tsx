import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import * as XLSX from "xlsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import surveyService, { SurveyTeacherResultRow } from "../../services/surveyService";
import { RiFileExcel2Line } from "react-icons/ri";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";

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
  const [nameFilter, setNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [expandedTeacherIds, setExpandedTeacherIds] = useState<number[]>([]);
  const [resetting, setResetting] = useState(false);

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

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => row.department_name?.trim()).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase();
    const normalizedDepartment = departmentFilter.trim();

    return rows.filter((row) => {
      const fullName = [row.last_name, row.first_name, row.middle_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const nameMatches = !normalizedName || fullName.includes(normalizedName);
      const departmentMatches =
        !normalizedDepartment || (row.department_name || "") === normalizedDepartment;

      return nameMatches && departmentMatches;
    });
  }, [departmentFilter, nameFilter, rows]);

  const toggleExpanded = (teacherId: number) => {
    setExpandedTeacherIds((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
    );
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nəticələr");
    XLSX.writeFile(workbook, `survey-${survey?.id || "results"}-teacher-results.xlsx`);
  };

  const handleResetResponses = async () => {
    const id = Number(surveyId);
    if (!Number.isFinite(id)) return;

    if (!confirm("Bu sorğu üzrə bütün tələbə cavabları silinəcək. Davam edilsin?")) {
      return;
    }

    try {
      setResetting(true);
      setError("");
      await surveyService.resetResponses(id);
      setRows([]);
      setExpandedTeacherIds([]);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Sorğu cavabları sıfırlanmadı");
    } finally {
      setResetting(false);
    }
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleResetResponses}
              disabled={resetting}
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              {resetting ? "Sıfırlanır..." : "Cavabları sıfırla"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={rows.length === 0}
              className="rounded-md bg-emerald-600 px-2 py-2 text-md font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <div className="flex gap-2 items-center "><RiFileExcel2Line />
              <span>Excel faylda saxla</span></div>
            </button>
          </div>
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
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder="Ada görə axtar"
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Bütün kafedralar</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            {filteredRows.length === 0 ? (
              <p className="rounded-lg border border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Filterə uyğun nəticə tapılmadı.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                      <th className="w-10 px-3 py-2 font-medium"></th>
                      <th className="px-3 py-2 font-medium">Müəllimin adı soyadı atasının adı</th>
                      <th className="px-3 py-2 font-medium">FİN</th>
                      <th className="px-3 py-2 font-medium">Kafedra</th>
                      <th className="px-3 py-2 font-medium">Səs verən tələbə sayı</th>
                      <th className="px-3 py-2 font-medium">Ümumi orta bal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => {
                      const expanded = expandedTeacherIds.includes(row.teacher_id);
                      const rowBg = index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800";

                      return (
                        <Fragment key={`${row.teacher_id}-${index}`}>
                          <tr className={`border-b border-gray-100 dark:border-gray-700 ${rowBg}`}>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => toggleExpanded(row.teacher_id)}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                aria-label={expanded ? "Detalı bağla" : "Detalı aç"}
                              >
                                {expanded ? <MdKeyboardArrowDown size={20} /> : <MdKeyboardArrowRight size={20} />}
                              </button>
                            </td>
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
                          {expanded && (
                            <tr className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-950/30">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="grid gap-4 lg:grid-cols-2">
                                  <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                                      Suallar üzrə orta bal
                                    </h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                      <table className="w-full text-sm">
                                        <tbody>
                                          {(row.question_scores || []).map((question) => (
                                            <tr key={question.question_id} className="border-b border-gray-100 last:border-b-0 dark:border-gray-700">
                                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                                <p>{question.question_text}</p>
                                                {question.activity_name && (
                                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Fəaliyyət: {question.activity_name}
                                                  </p>
                                                )}
                                              </td>
                                              <td className="w-24 px-3 py-2 text-right font-medium text-blue-700 dark:text-blue-400">
                                                {question.average_score ? Number(question.average_score).toFixed(2) : "-"}
                                              </td>
                                            </tr>
                                          ))}
                                          {(row.question_scores || []).length === 0 && (
                                            <tr>
                                              <td className="px-3 py-3 text-gray-500 dark:text-gray-400">Sual nəticəsi yoxdur.</td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                                      Əlaqəli fəaliyyətlər üzrə orta bal
                                    </h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                      <table className="w-full text-sm">
                                        <tbody>
                                          {(row.activity_scores || []).map((activity) => (
                                            <tr key={activity.activity_id} className="border-b border-gray-100 last:border-b-0 dark:border-gray-700">
                                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                                {activity.activity_name || "-"}
                                              </td>
                                              <td className="w-24 px-3 py-2 text-right font-medium text-blue-700 dark:text-blue-400">
                                                {activity.average_score ? Number(activity.average_score).toFixed(2) : "-"}
                                              </td>
                                            </tr>
                                          ))}
                                          {(row.activity_scores || []).length === 0 && (
                                            <tr>
                                              <td className="px-3 py-3 text-gray-500 dark:text-gray-400">Fəaliyyət nəticəsi yoxdur.</td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
