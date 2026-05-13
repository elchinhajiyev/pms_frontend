import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { EyeIcon, PencilIcon } from "../../icons";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import scientificReportService, { ScientificReportItem } from "../../services/scientificReportService";

const semesterLabel = (semester?: string) => {
  if (semester === "YAZ") return "Yaz";
  if (semester === "YAY") return "Yay";
  if (semester === "PAYIZ") return "Payız";
  return semester || "-";
};

const statusLabel = (status?: string) => {
  if (status === "approved") return "Təsdiqlənib";
  if (status === "rejected") return "İmtina edilib";
  return "Gözləmədə";
};

const statusBadgeClass = (status?: string) => {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
};

export default function ScientificReportsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<ScientificReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<ScientificReportItem | null>(null);

  const isPdf = (item: ScientificReportItem) => {
    const name = (item.file_name || item.attachment_url || item.file_path || "").toLowerCase();
    return name.endsWith(".pdf");
  };

  const load = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const res = await scientificReportService.getByUser(user.id);
      const data = Array.isArray(res?.data) ? res.data : [];
      setItems(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Elmi məruzələr yüklənmədi");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  return (
    <>
      <PageMeta title="Elmi məruzələr | Performix" description="Müəllim üçün elmi məruzə siyahısı" />
      <PageBreadcrumb pageTitle="Elmi məruzələr" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Elmi məruzələrim</h3>
          <button
            onClick={() => navigate("/userscientificreports/new")}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Əlavə et
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : error ? (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Hələ elmi məruzə əlavə edilməyib.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Məruzənin adı</th>
                  <th className="pb-3 pr-4 font-medium">Semestr</th>
                  <th className="pb-3 pr-4 font-medium">Tədris ili</th>
                  <th className="pb-3 pr-4 font-medium">Kateqoriya</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">{item.title}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{semesterLabel(item.semester)}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{item.academic_year}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{item.category_name || "-"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(item.status)}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          aria-label="Məruzəni aç"
                          title="Ətraflı bax"
                        >
                          <EyeIcon className="size-4 fill-current" />
                        </button>
                        <button
                          type="button"
                          disabled={item.status === "approved"}
                          onClick={() => navigate(`/userscientificreports/${item.id}/edit`)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          aria-label="Məruzəni redaktə et"
                          title={item.status === "approved" ? "Təsdiqləndiyi üçün redaktə bağlıdır" : "Redaktə et"}
                        >
                          <PencilIcon className="size-4 fill-current" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} className="m-4 w-full max-w-3xl">
        {selectedItem && (
          <div className="rounded-3xl bg-white p-5 dark:bg-gray-900 sm:p-6">
            <h3 className="mb-4 pr-12 text-lg font-semibold text-gray-800 dark:text-white">
              Məruzə detalları
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Məruzənin adı</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedItem.title || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Semestr</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{semesterLabel(selectedItem.semester)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tədris ili</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedItem.academic_year || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Kateqoriya</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedItem.category_name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(selectedItem.status)}`}
                >
                  {statusLabel(selectedItem.status)}
                </span>
              </div>
            </div>

            {selectedItem.status === "rejected" && selectedItem.rejection_reason && (
              <div className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                <span className="font-medium">İmtina səbəbi:</span> {selectedItem.rejection_reason}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {selectedItem.summary && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Qısa məzmun</p>
                  <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {selectedItem.summary}
                  </p>
                </div>
              )}

              {selectedItem.link && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Link</p>
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {selectedItem.link}
                  </a>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Yüklənmiş sənəd</p>
                {selectedItem.attachment_url ? (
                  <button
                    type="button"
                    onClick={() => window.open(selectedItem.attachment_url, "_blank", "noopener,noreferrer")}
                    className="group w-full rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/10"
                  >
                    {isPdf(selectedItem) ? (
                      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
                        <iframe
                          title={`pdf-thumbnail-${selectedItem.id}`}
                          src={`${selectedItem.attachment_url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          className="pointer-events-none h-52 w-full"
                        />
                      </div>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300">
                        Faylı açmaq üçün klikləyin
                      </div>
                    )}
                    <p className="mt-2 text-xs font-medium text-blue-700 group-hover:underline dark:text-blue-300">
                      {selectedItem.file_name || "Sənədi tam aç"}
                    </p>
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fayl əlavə edilməyib.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Bağla
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
