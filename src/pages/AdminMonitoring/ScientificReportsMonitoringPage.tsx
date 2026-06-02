import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { EyeIcon } from "../../icons";
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

export default function ScientificReportsMonitoringPage() {
  const { user } = useAuth();
  const canModerate = String(user?.role_code || "").toUpperCase() !== "ADMIN";

  const [items, setItems] = useState<ScientificReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedItem, setSelectedItem] = useState<ScientificReportItem | null>(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [modalError, setModalError] = useState("");

  const load = async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await scientificReportService.getForMonitoring(filterStatus || undefined, user?.id);
      const data = Array.isArray(res?.data) ? res.data : [];
      setItems(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Monitorinq siyahısı yüklənmədi");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus, user?.id]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "pending").length,
    [items]
  );

  const handleApprove = async (item: ScientificReportItem) => {
    if (!user?.id) return;

    setProcessingId(item.id);
    setError("");
    try {
      await scientificReportService.approve(item.id, user.id);
      await load();
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
        setShowRejectBox(false);
        setRejectReason("");
        setModalError("");
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || "Təsdiq etmək mümkün olmadı";
      setError(message);
      setModalError(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: ScientificReportItem, reason: string) => {
    if (!user?.id) return;
    if (!reason.trim()) {
      setModalError("İmtina səbəbi boş ola bilməz");
      return;
    }

    setProcessingId(item.id);
    setError("");
    setModalError("");
    try {
      await scientificReportService.reject(item.id, user.id, reason.trim());
      await load();
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
        setShowRejectBox(false);
        setRejectReason("");
        setModalError("");
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || "İmtina etmək mümkün olmadı";
      setError(message);
      setModalError(message);
    } finally {
      setProcessingId(null);
    }
  };

  const openDetailsModal = (item: ScientificReportItem) => {
    setSelectedItem(item);
    setShowRejectBox(false);
    setRejectReason(item.rejection_reason || "");
    setModalError("");
  };

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setShowRejectBox(false);
    setRejectReason("");
    setModalError("");
  };

  const isPdf = (item: ScientificReportItem) => {
    const name = (item.file_name || item.file_path || "").toLowerCase();
    return name.endsWith(".pdf");
  };

  return (
    <>
      <PageMeta title="Elmi fəaliyyətlər monitorinq | Performix" description="Elmi məruzələrin monitorinqi və təsdiqi" />
      <PageBreadcrumb pageTitle="Elmi fəaliyyətlər monitorinq" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Elmi məruzələr monitorinq</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gözləmədə olan sənədlər: {pendingCount}
            </p>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Bütün statuslar</option>
              <option value="pending">Gözləmədə</option>
              <option value="approved">Təsdiqlənib</option>
              <option value="rejected">İmtina edilib</option>
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
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Sənəd tapılmadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Məruzənin adı</th>
                  <th className="pb-3 pr-4 font-medium">Əlavə edən</th>
                  <th className="pb-3 pr-4 font-medium">Semestr</th>
                  <th className="pb-3 pr-4 font-medium">Tədris ili</th>
                  <th className="pb-3 pr-4 font-medium">Kateqoriya</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium text-right">Baxış</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">{item.title}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{(item as any).created_by_name || item.created_by}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{semesterLabel(item.semester)}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{item.academic_year}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{item.category_name || "-"}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{statusLabel(item.status)}</td>
                    <td className="py-3 pr-4 text-right">
                      <button
                        onClick={() => openDetailsModal(item)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        aria-label="Məruzəni aç"
                        title="Ətraflı bax"
                      >
                        <EyeIcon className="size-4 fill-current" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={Boolean(selectedItem)} onClose={closeDetailsModal} className="m-4 w-full max-w-3xl">
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Əlavə edən</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{(selectedItem as any).created_by_name || selectedItem.created_by}</p>
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
                <p className="text-sm font-medium text-gray-800 dark:text-white">{statusLabel(selectedItem.status)}</p>
              </div>
            </div>

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

            {modalError && (
              <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {modalError}
              </p>
            )}

            {showRejectBox && selectedItem.status !== "rejected" && (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">İmtina səbəbi</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="İmtina səbəbini yazın..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={closeDetailsModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Bağla
              </button>

              {!showRejectBox && (
                <button
                  disabled={selectedItem.status === "rejected" || processingId === selectedItem.id}
                  onClick={() => {
                    setShowRejectBox(true);
                    setModalError("");
                  }}
                  className={`${canModerate ? "" : "hidden "}rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60`}
                >
                  İmtina et
                </button>
              )}

              {showRejectBox && (
                <button
                  disabled={processingId === selectedItem.id}
                  onClick={() => handleReject(selectedItem, rejectReason)}
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  İmtinanı təsdiqlə
                </button>
              )}

              <button
                disabled={selectedItem.status === "approved" || processingId === selectedItem.id}
                onClick={() => handleApprove(selectedItem)}
                className={`${canModerate ? "" : "hidden "}rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60`}
              >
                Təsdiq et
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
