import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { employeeGroupService, EmployeeGroup } from "../../services/evaluationService";
import surveyService, { Survey } from "../../services/surveyService";

const ROWS_PER_PAGE = 20;

export default function AllSurveyResultsPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState<Survey[]>([]);
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [surveysRes, groupsRes] = await Promise.all([
        surveyService.getAll(),
        employeeGroupService.getAll()
      ]);

      const surveysData = Array.isArray(surveysRes?.data)
        ? surveysRes.data
        : Array.isArray(surveysRes)
          ? surveysRes
          : [];
      const groupsData = Array.isArray(groupsRes?.data)
        ? groupsRes.data
        : Array.isArray(groupsRes)
          ? groupsRes
          : [];

      setRecords(surveysData);
      setGroups(groupsData);
    } catch {
      setError("Sorğu nəticələri yüklənmədi");
      setRecords([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(records.map((item) => String(item.year)).filter(Boolean)));
    return years.sort((a, b) => Number(b) - Number(a));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesName =
        !searchQuery.trim() ||
        String(record.title || "").toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesYear = !filterYear || String(record.year) === filterYear;
      const matchesSemester = !filterSemester || String(record.semester || "") === filterSemester;
      const matchesGroup = !filterGroupId || String(record.employee_group_id || "") === filterGroupId;

      return matchesName && matchesYear && matchesSemester && matchesGroup;
    });
  }, [records, searchQuery, filterYear, filterSemester, filterGroupId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterYear, filterSemester, filterGroupId, records.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ROWS_PER_PAGE));
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const semesterLabel = (semester?: string) => {
    if (semester === "YAZ") return "Yaz";
    if (semester === "YAY") return "Yay";
    if (semester === "PAYIZ") return "Payız";
    return "-";
  };

  return (
    <>
      <PageMeta title="Bütün qiymətləndirmələr | Performix" description="Yaradılmış sorğular üzrə nəticə siyahısı" />
      <PageBreadcrumb pageTitle="Bütün qiymətləndirmələr" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Sorğu adına görə axtarış
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sorğu adı yazın..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Tədris ili filteri
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Bütün tədris illəri</option>
              {availableYears.map((itemYear) => (
                <option key={itemYear} value={itemYear}>
                  {itemYear}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Semestr filteri</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Bütün semestrlər</option>
              <option value="YAZ">Yaz</option>
              <option value="YAY">Yay</option>
              <option value="PAYIZ">Payız</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">İşçi qrupu filteri</label>
            <select
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Bütün qruplar</option>
              {groups.map((group) => (
                <option key={group.id} value={String(group.id)}>
                  {group.name}
                </option>
              ))}
            </select>
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
        ) : filteredRecords.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nəticə tapılmadı.</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Ümumi {filteredRecords.length} nəticə, səhifə {currentPage}/{totalPages}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                    <th className="pb-3 pr-4 font-medium">Sorğunun adı</th>
                    <th className="pb-3 pr-4 font-medium">Tədris ili</th>
                    <th className="pb-3 pr-4 font-medium">Semestr</th>
                    <th className="pb-3 pr-4 font-medium text-right">Ətraflı</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 pr-4 text-gray-800 dark:text-white">{record.title}</td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.year}</td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{semesterLabel(record.semester)}</td>
                      <td className="py-3 pr-4 text-right">
                        <button
                          onClick={() => navigate(`/evaluation/my-evaluations/${record.id}`)}
                          className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          Ətraflı
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length > ROWS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Əvvəlki
                </button>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Növbəti
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
