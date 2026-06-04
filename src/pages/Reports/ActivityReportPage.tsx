import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import departmentService, { Department } from "../../services/departmentService";
import helperToolService, { HelperToolOption } from "../../services/helperToolService";
import reportService, {
  ActivityReportActivity,
  ActivityReportRow,
} from "../../services/reportService";

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

const shortActivityName = (value: string) => {
  const normalized = String(value || "").trim();
  if (normalized.length <= 14) return normalized;
  return `${normalized.slice(0, 13)}…`;
};

export default function ActivityReportPage() {
  const [academicYears, setAcademicYears] = useState<HelperToolOption[]>([]);
  const [semesters, setSemesters] = useState<HelperToolOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState<ActivityReportActivity[]>([]);
  const [rows, setRows] = useState<ActivityReportRow[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [yearsRes, semestersRes, departmentsRes] = await Promise.all([
          helperToolService.getAcademicYears(),
          helperToolService.getSemesters(),
          departmentService.getAll(),
        ]);

        setAcademicYears(Array.isArray(yearsRes.data) ? yearsRes.data : []);
        setSemesters(Array.isArray(semestersRes.data) ? semestersRes.data : []);
        setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
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
      setActivities([]);
      setRows([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingReport(true);
        setError("");
        const response = await reportService.getActivityReport({
          academic_year: academicYear,
          semester,
          department_id: departmentId,
          search,
        });
        setActivities(Array.isArray(response.activities) ? response.activities : []);
        setRows(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        setActivities([]);
        setRows([]);
        setError(err?.response?.data?.message || "Fəaliyyətlər hesabatı yüklənmədi");
      } finally {
        setLoadingReport(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [academicYear, semester, departmentId, search]);

  useEffect(() => {
    setSelectedUserIds((prev) => {
      if (prev.size === 0) return prev;
      const existingIds = new Set(rows.map((row) => Number(row.user_id)));
      const next = new Set([...prev].filter((id) => existingIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;

    return [...rows].sort((firstRow, secondRow) => {
      const firstValue = Number(
        sortConfig.key === "__total_average__"
          ? firstRow.total_average_score
          : firstRow.activity_scores?.[sortConfig.key]
      );
      const secondValue = Number(
        sortConfig.key === "__total_average__"
          ? secondRow.total_average_score
          : secondRow.activity_scores?.[sortConfig.key]
      );
      const firstIsNumber = Number.isFinite(firstValue);
      const secondIsNumber = Number.isFinite(secondValue);

      if (!firstIsNumber && !secondIsNumber) {
        return String(firstRow.full_name || "").localeCompare(String(secondRow.full_name || ""), "az");
      }
      if (!firstIsNumber) return 1;
      if (!secondIsNumber) return -1;

      return sortConfig.direction === "asc"
        ? firstValue - secondValue
        : secondValue - firstValue;
    });
  }, [rows, sortConfig]);

  const chartRows = useMemo(() => {
    if (selectedUserIds.size === 0) return rows;
    return rows.filter((row) => selectedUserIds.has(Number(row.user_id)));
  }, [rows, selectedUserIds]);

  const chartData = useMemo(
    () =>
      activities
        .map((activity) => {
          const values = chartRows
            .map((row) => Number(row.activity_scores?.[activity.key]))
            .filter(Number.isFinite);

          const average =
            values.length > 0
              ? values.reduce((sum, value) => sum + value, 0) / values.length
              : 0;

          return {
            key: activity.key,
            name: activity.name,
            average: Number(average.toFixed(2)),
          };
        })
        .filter((item) => item.average > 0),
    [activities, chartRows]
  );

  const chartOptions = useMemo<ApexOptions>(
    () => ({
      colors: ["#10b981"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: chartData.map((item) => item.name),
        min: 0,
        max: 5,
        tickAmount: 5,
        labels: {
          style: { fontSize: "11px" },
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        labels: {
          maxWidth: 220,
          style: { fontSize: "11px" },
        },
      },
      grid: {
        borderColor: "#e5e7eb",
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        x: {
          formatter: (_value, options) => chartData[options.dataPointIndex]?.name || "",
        },
        y: {
          formatter: (value: number) => value.toFixed(2),
        },
      },
    }),
    [chartData]
  );

  const chartSeries = useMemo(
    () => [
      {
        name: "Orta bal",
        data: chartData.map((item) => item.average),
      },
    ],
    [chartData]
  );

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === "desc" ? "asc" : "desc" }
        : { key, direction: "desc" }
    );
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const exportRows = useMemo(
    () =>
      sortedRows.map((row, index) => {
        const activityColumns = activities.reduce((acc, activity) => {
          acc[activity.name] = formatScore(row.activity_scores?.[activity.key]);
          return acc;
        }, {} as Record<string, string>);

        return {
          "№": index + 1,
          "Şəxsin adı soyadı ata adı": row.full_name || "",
          "Bağlı olduğu kafedra": row.department_name || "",
          ...activityColumns,
          "Ümumi orta bal": formatScore(row.total_average_score),
        };
      }),
    [activities, sortedRows]
  );

  const handleExport = () => {
    if (exportRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fəaliyyətlər hesabatı");
    const suffix = [academicYear, semester].filter(Boolean).join("-");
    XLSX.writeFile(workbook, `fealiyyetler-hesabati${suffix ? `-${suffix}` : ""}.xlsx`);
  };

  const tableMinWidth = Math.max(760 + activities.length * 92, 980);

  return (
    <>
      <PageMeta title="Fəaliyyətlər hesabatı | Performix" description="Fəaliyyətlər hesabatı" />
      <PageBreadcrumb pageTitle="Fəaliyyətlər hesabatı" />

      <div className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_170px_220px_minmax(180px,260px)_auto] xl:items-end">
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
              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Bütün departamentlər</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
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

            <div className="flex flex-row items-center gap-2">
              <button
                onClick={handleExport}
                disabled={!academicYear || rows.length === 0}
                className="h-10 whitespace-nowrap rounded-md bg-emerald-600 px-4 text-sm font-normal text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Excelə export
              </button>
              <button
                onClick={() => setChartOpen(true)}
                disabled={!academicYear || chartData.length === 0}
                className="h-10 whitespace-nowrap rounded-md border border-gray-300 bg-white px-4 text-sm font-normal text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Diagramla göstər
              </button>
            </div>
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
            <div className="overflow-x-auto">
              <table
                className="table-fixed text-xs"
                style={{ minWidth: tableMinWidth, width: "100%" }}
              >
                <colgroup>
                  <col className="w-[52px]" />
                  <col className="w-[190px]" />
                  <col className="w-[170px]" />
                  {activities.map((activity) => (
                    <col key={activity.key} className="w-[92px]" />
                  ))}
                  <col className="w-[105px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-25 text-left text-xs font-normal text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <th className="sticky left-0 z-30 border-r border-gray-200 bg-gray-25 px-2 py-2 text-center font-normal dark:border-gray-700 dark:bg-gray-800">№</th>
                    <th className="sticky left-[52px] z-20 border-r border-gray-200 bg-gray-25 px-2 py-2 font-normal dark:border-gray-700 dark:bg-gray-800">Şəxsin adı soyadı</th>
                    <th className="border-r border-gray-200 px-2 py-2 font-normal dark:border-gray-700">Bağlı olduğu kafedra</th>
                    {activities.map((activity) => (
                      <th
                        key={activity.key}
                        title={activity.name}
                        className="border-r border-gray-200 px-2 py-2 text-center font-normal dark:border-gray-700"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(activity.key)}
                          className="flex w-full max-w-full items-center justify-between gap-1 text-left text-gray-700 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-300"
                          title={activity.name}
                        >
                          <span className="block truncate">{shortActivityName(activity.name)}</span>
                          <span className="flex shrink-0 flex-col text-[8px] leading-[8px] text-gray-400">
                            <span className={sortConfig?.key === activity.key && sortConfig.direction === "asc" ? "text-brand-600" : ""}>▲</span>
                            <span className={sortConfig?.key === activity.key && sortConfig.direction === "desc" ? "text-brand-600" : ""}>▼</span>
                          </span>
                        </button>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center font-normal">
                      <button
                        type="button"
                        onClick={() => toggleSort("__total_average__")}
                        className="flex w-full max-w-full items-center justify-between gap-1 text-left text-gray-700 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-300"
                      >
                        <span className="block truncate">Ümumi orta bal</span>
                        <span className="flex shrink-0 flex-col text-[8px] leading-[8px] text-gray-400">
                          <span className={sortConfig?.key === "__total_average__" && sortConfig.direction === "asc" ? "text-brand-600" : ""}>▲</span>
                          <span className={sortConfig?.key === "__total_average__" && sortConfig.direction === "desc" ? "text-brand-600" : ""}>▼</span>
                        </span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingReport ? (
                    <tr>
                      <td
                        colSpan={activities.length + 4}
                        className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        Yüklənir...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activities.length + 4}
                        className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        Məlumat tapılmadı.
                      </td>
                    </tr>
                  ) : (
                    sortedRows.map((row, index) => (
                      <tr
                        key={row.user_id}
                        className="bg-white transition-colors hover:bg-gray-25 dark:bg-gray-900 dark:hover:bg-gray-800/70"
                      >
                        <td className="sticky left-0 z-20 border-r border-gray-100 bg-white px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                          {index + 1}
                        </td>
                        <td className="sticky left-[52px] z-10 border-r border-gray-100 bg-white px-2 py-1.5 text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                          <div className="flex min-w-0 items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(Number(row.user_id))}
                              onChange={() => toggleUserSelection(Number(row.user_id))}
                              className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                              aria-label={`${row.full_name || "Şəxs"} diagram üçün seç`}
                            />
                            <span className="block min-w-0 truncate">{row.full_name || "—"}</span>
                          </div>
                        </td>
                        <td className="border-r border-gray-100 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                          <span className="block truncate">{row.department_name || "—"}</span>
                        </td>
                        {activities.map((activity) => (
                          <td
                            key={`${row.user_id}-${activity.key}`}
                            className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400"
                          >
                            {formatScore(row.activity_scores?.[activity.key]) || "—"}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-2 py-1.5 text-center text-gray-800 dark:text-white">
                          {formatScore(row.total_average_score) || "—"}
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

      <Modal isOpen={chartOpen} onClose={() => setChartOpen(false)} className="m-4 w-full max-w-5xl">
        <div className="p-5 pr-14 sm:p-6 sm:pr-16">
          <h3 className="mb-4 text-base font-medium text-gray-900 dark:text-white">
            Fəaliyyətlər üzrə orta ballar
          </h3>
          {selectedUserIds.size > 0 && (
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Diagram {selectedUserIds.size} seçilmiş şəxs üzrə göstərilir.
            </p>
          )}
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Diagram üçün məlumat tapılmadı.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: 720 }}>
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="bar"
                  height={Math.max(360, chartData.length * 42)}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
