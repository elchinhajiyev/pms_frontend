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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Kod</th>
                  <th className="pb-3 pr-4 font-medium">Ad</th>
                  <th className="pb-3 pr-4 font-medium">Ad (EN)</th>
                  <th className="pb-3 pr-4 font-medium">Üzv sayı</th>
                  <th className="pb-3 pr-4 font-medium">Üzvlər</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="py-3 pr-4 font-mono text-gray-700 dark:text-gray-300">
                      {g.code}
                    </td>
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">
                      {g.name}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {g.name_en || "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {g.member_count || 0}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => navigate(`/employee-groups/${g.id}/members`)}
                        className="text-brand-500 hover:underline"
                      >
                        Üzvlər
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(g)}
                          className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="text-red-500 hover:text-red-700"
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
