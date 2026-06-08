import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DepartmentTabbedCombobox, {
  DepartmentFilterSelection,
} from "../../components/reports/DepartmentTabbedCombobox";
import departmentService, { Department } from "../../services/departmentService";
import facultyService, { Faculty } from "../../services/facultyService";
import helperToolService, { HelperToolOption } from "../../services/helperToolService";
import reportService, { GeneralReportRow } from "../../services/reportService";

const formatScore = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "";
  return numericValue.toFixed(2);
};

const semesterLabel = (value: string) => {
  if (value === "YAZ") return "Yaz";
  if (value === "YAY") return "Yay";
  if (value === "PAYIZ") return "Payız";
  return value;
};

export default function GeneralReportPage() {
  const [academicYears, setAcademicYears] = useState<HelperToolOption[]>([]);
  const [semesters, setSemesters] = useState<HelperToolOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilterSelection[]>([]);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<GeneralReportRow[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [yearsRes, semestersRes, departmentsRes, facultiesRes] = await Promise.all([
          helperToolService.getAcademicYears(),
          helperToolService.getSemesters(),
          departmentService.getAll(),
          facultyService.getAll(),
        ]);

        setAcademicYears(Array.isArray(yearsRes.data) ? yearsRes.data : []);
        setSemesters(Array.isArray(semestersRes.data) ? semestersRes.data : []);
        setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
        setFaculties(Array.isArray(facultiesRes.data) ? facultiesRes.data : []);
      } catch {
        setError("Filter məlumatları yüklənmədi");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (!academicYear) {
      setRows([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingReport(true);
        setError("");
        const response = await reportService.getGeneralReport({
          academic_year: academicYear,
          semester,
          department_ids: Array.from(
            new Set(departmentFilter.flatMap((selection) => selection.departmentIds))
          ).join(","),
          search,
        });
        setRows(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        setRows([]);
        setError(err?.response?.data?.message || "Hesabat yüklənmədi");
      } finally {
        setLoadingReport(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [academicYear, semester, departmentFilter, search]);

  const exportRows = useMemo(
    () =>
      rows.map((row, index) => ({
        "№": index + 1,
        "Şəxsin adı soyadı ata adı": row.full_name || "",
        "Bağlı olduğu kafedra": row.department_name || "",
        "Sorğu qiymətləndirməsindəki ümumi orta balı": formatScore(row.survey_average_score),
        "Mənimsəmə faizi": formatScore(row.assimilation_percent),
        "Keyfiyyət faizi": formatScore(row.quality_percent),
        "Tapşırıq üzrə fəaliyyət qiymətləndirmə": formatScore(row.task_activity_average),
        "Elmi fəaliyyətlər üzrə qiymətləndirmə": formatScore(row.scientific_activity_score),
        "Tədris metodiki vəsaitlər": formatScore(row.teaching_material_score),
        "Hirş indeksi": formatScore(row.punctuality_score),
        "Cəmi bal": formatScore(row.total_score),
      })),
    [rows]
  );

  const handleExport = () => {
    if (exportRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ümumi hesabat");
    const suffix = [academicYear, semester].filter(Boolean).join("-");
    XLSX.writeFile(workbook, `umumi-hesabat${suffix ? `-${suffix}` : ""}.xlsx`);
  };

  return (
    <>
      <PageMeta title="Ümumi hesabat | Performix" description="Ümumi hesabat" />
      <PageBreadcrumb pageTitle="Ümumi hesabat" />

      <div className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_180px_300px_1fr_auto] xl:items-end">
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Tədris ili</label>
              <select
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                disabled={loadingOptions}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Tədris ilini seçin</option>
                {academicYears.map((item) => (
                  <option key={item.id} value={item.value}>
                    {item.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Semestr</label>
              <select
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Hamısı</option>
                {semesters.map((item) => (
                  <option key={item.id} value={String(item.value).toUpperCase()}>
                    {semesterLabel(String(item.value).toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Departament</label>
              <DepartmentTabbedCombobox
                departments={departments}
                faculties={faculties}
                value={departmentFilter}
                onChange={setDepartmentFilter}
                disabled={loadingOptions}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Şəxs</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ad, soyad, ata adı ilə axtar..."
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <button
              onClick={handleExport}
              disabled={!academicYear || rows.length === 0}
              className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-normal text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Excelə export
            </button>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        {!academicYear ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Tədris ilini seçin
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
            <div className="overflow-x-auto xl:overflow-visible">
              <table className="min-w-[1180px] table-fixed text-xs xl:w-full xl:min-w-0">
                <colgroup>
                  <col className="w-[52px] xl:w-[4%]" />
                  <col className="w-[190px] xl:w-[14%]" />
                  <col className="w-[170px] xl:w-[12%]" />
                  <col className="w-[110px] xl:w-[9%]" />
                  <col className="w-[100px] xl:w-[8%]" />
                  <col className="w-[100px] xl:w-[8%]" />
                  <col className="w-[120px] xl:w-[11%]" />
                  <col className="w-[120px] xl:w-[11%]" />
                  <col className="w-[130px] xl:w-[12%]" />
                  <col className="w-[95px] xl:w-[5%]" />
                  <col className="w-[95px] xl:w-[6%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-25 text-left text-xs font-normal text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <th className="sticky left-0 z-30 border-r border-gray-200 bg-gray-25 px-2 py-2 text-center font-normal dark:border-gray-700 dark:bg-gray-800 xl:static">№</th>
                    <th className="sticky left-[52px] z-20 border-r border-gray-200 bg-gray-25 px-2 py-2 font-normal dark:border-gray-700 dark:bg-gray-800 xl:static">Şəxsin adı soyadı ata adı</th>
                    <th className="border-r border-gray-200 px-2 py-2 font-normal dark:border-gray-700">Bağlı olduğu kafedra</th>
                    <th className="border-r border-gray-200 px-2 py-2 text-center font-normal dark:border-gray-700">Sorğu orta balı</th>
                    <th className="border-r border-gray-200 px-2 py-2 text-center font-normal dark:border-gray-700">Mənimsəmə faizi</th>
                    <th className="border-r border-gray-200 px-2 py-2 text-center font-normal dark:border-gray-700">Keyfiyyət faizi</th>
                    <th className="border-r border-gray-200 px-2 py-2 text-center font-normal dark:border-gray-700">Tapşırıq üzrə fəaliyyət</th>
                    <th className="border-r border-gray-200 px-2 py-2 text-center font-normal dark:border-gray-700">Elmi fəaliyyətlər</th>
                    <th className="border-r border-gray-200 px-2 py-2 text-center font-normal dark:border-gray-700">Tədris metodiki vəsaitlər</th>
                    <th className="border-r border-gray-200 px-2 py-2 text-center font-normal dark:border-gray-700">Hirş indeksi</th>
                    <th className="px-2 py-2 text-center font-normal">Cəmi bal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingReport ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        Yüklənir...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        Məlumat tapılmadı.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => (
                      <tr
                        key={row.user_id}
                        className="bg-white transition-colors hover:bg-gray-25 dark:bg-gray-900 dark:hover:bg-gray-800/70"
                      >
                        <td className="sticky left-0 z-20 border-r border-gray-100 bg-white px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 xl:static">
                          {index + 1}
                        </td>
                        <td className="sticky left-[52px] z-10 border-r border-gray-100 bg-white px-2 py-1.5 text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white xl:static">
                          <span className="block truncate">{row.full_name || "—"}</span>
                        </td>
                        <td className="border-r border-gray-100 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                          <span className="block truncate">{row.department_name || "—"}</span>
                        </td>
                        <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                          {formatScore(row.survey_average_score) || "—"}
                        </td>
                        <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400" />
                        <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400" />
                        <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                          {formatScore(row.task_activity_average) || "—"}
                        </td>
                        <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                          {formatScore(row.scientific_activity_score) || "—"}
                        </td>
                        <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                          {formatScore(row.teaching_material_score) || "—"}
                        </td>
                        <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400" />
                        <td className="whitespace-nowrap px-2 py-1.5 text-center text-gray-800 dark:text-white">
                          {formatScore(row.total_score) || "0.00"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
