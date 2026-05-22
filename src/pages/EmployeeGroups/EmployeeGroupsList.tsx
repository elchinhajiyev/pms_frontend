import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { employeeGroupService, EmployeeGroup } from "../../services/evaluationService";
import { activityService, Activity } from "../../services/activityService";

const emptyForm = {
  code: "",
  name: "",
  name_en: "",
  description: "",
};

export default function EmployeeGroupsList() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [activitySearch, setActivitySearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await employeeGroupService.getAll();
      setGroups(res.data || []);
    } catch {
      setError("İşçi qrupları yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await activityService.getAll();
      setAllActivities(res.data || []);
    } catch {
      setError("Fəaliyyətlər yüklənmədi");
    }
  };

  useEffect(() => {
    load();
    loadActivities();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setSelectedActivities([]);
    setActivitySearch("");
    setFormError("");
    setShowModal(true);
  };

  const openEdit = async (g: EmployeeGroup) => {
    setEditId(g.id);
    setForm({
      code: g.code,
      name: g.name,
      name_en: g.name_en || "",
      description: g.description || "",
    });
    setActivitySearch("");
    setFormError("");

    // Load selected activities for this group
    try {
      const res = await activityService.getGroupActivities(g.id);
      const ids = (res.data || []).map((a: Activity) => a.id);
      setSelectedActivities(ids);
    } catch {
      setSelectedActivities([]);
    }

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setFormError("Kod və ad tələb olunur");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editId) {
        await employeeGroupService.update(editId, form);
        // Save selected activities
        await activityService.setGroupActivities(editId, selectedActivities);
      } else {
        const created = await employeeGroupService.create(form);
        // Save selected activities to the new group
        if (created.data?.id) {
          await activityService.setGroupActivities(created.data.id, selectedActivities);
        }
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Yadda saxlamaq mümkün olmadı");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu işçi qrupunu silmək istəyirsiniz?")) return;
    try {
      await employeeGroupService.delete(id);
      load();
    } catch {
      alert("Silinmə zamanı xəta baş verdi");
    }
  };

  const toggleActivity = (activityId: number) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const filteredActivities = allActivities.filter((activity) =>
    activity.name.toLowerCase().includes(activitySearch.toLowerCase())
  );

  return (
    <>
      <PageMeta title="İşçi qrupları | Performix" description="" />
      <PageBreadcrumb pageTitle="İşçi qrupları" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            İşçi qrupları
          </h3>
          <button
            onClick={openCreate}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Əlavə et
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && groups.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hələ işçi qrupu əlavə edilməyib.
          </p>
        )}

        {!loading && groups.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
            <div className="overflow-hidden">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-25 text-left text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <th className="w-1 whitespace-nowrap border-r border-gray-200 px-2 py-2 dark:border-gray-700">Kod</th>
                  <th className="border-r border-gray-200 px-2 py-2 dark:border-gray-700">Ad</th>
                  <th className="border-r border-gray-200 px-2 py-2 dark:border-gray-700">Ad (EN)</th>
                  <th className="w-1 whitespace-nowrap border-r border-gray-200 px-2 py-2 text-center dark:border-gray-700">Üzv sayı</th>
                  <th className="w-1 whitespace-nowrap border-r border-gray-200 px-2 py-2 text-center dark:border-gray-700">Üzvlər</th>
                  <th className="w-1 whitespace-nowrap px-2 py-2 text-center">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {groups.map((g) => (
                  <tr
                    key={g.id}
                    className="bg-white transition-colors hover:bg-gray-25 dark:bg-gray-900 dark:hover:bg-gray-800/70"
                  >
                    <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 font-mono text-gray-700 dark:border-gray-800 dark:text-gray-300">
                      {g.code}
                    </td>
                    <td className="max-w-[240px] border-r border-gray-100 px-2 py-1.5 text-gray-800 dark:border-gray-800 dark:text-white">
                      <span className="block truncate font-medium">{g.name}</span>
                    </td>
                    <td className="max-w-[220px] border-r border-gray-100 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      <span className="block truncate">{g.name_en || "—"}</span>
                    </td>
                    <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      <span className="inline-flex items-center justify-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700">
                        {g.member_count || 0}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center dark:border-gray-800">
                      <button
                        onClick={() => navigate(`/employee-groups/${g.id}/members`)}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-theme-xs hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-900/60 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                      >
                        Üzvlər
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(g)}
                          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-theme-xs hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-900/60 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-theme-xs hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-red-900/60 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              {editId ? "İşçi qrupunu redaktə et" : "Yeni işçi qrupu"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kod <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  disabled={!!editId}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ad (AZ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ad (EN)
                </label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Təsvir
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fəaliyyətlər
                </label>
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Fəaliyyəti axtar..."
                  className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-3 dark:border-gray-700">
                  {filteredActivities.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {allActivities.length === 0
                        ? "Heç bir fəaliyyət yoxdur"
                        : "Axtarışa uyğun fəaliyyət tapılmadı"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredActivities.map((activity) => (
                        <label
                          key={activity.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedActivities.includes(activity.id)}
                            onChange={() => toggleActivity(activity.id)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {activity.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Ləğv et
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? "Saxlanılır..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
