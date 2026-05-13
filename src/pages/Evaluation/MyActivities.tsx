import { FormEvent, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { activityService, Activity } from "../../services/activityService";
import departmentService, { Department } from "../../services/departmentService";

export default function MyActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "all">("all");
  const [activityDepartmentsMap, setActivityDepartmentsMap] = useState<
    Record<number, { ids: number[]; names: string[] }>
  >({});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const [activityRes, departmentsRes] = await Promise.all([
        activityService.getAll(),
        departmentService.getAll(),
      ]);

      const activityList = activityRes.data || [];
      const departmentList = departmentsRes.data || [];

      setActivities(activityList);
      setDepartments(departmentList);

      const relationResults: Array<{
        departmentId: number;
        departmentName: string;
        activityIds: number[];
      }> = await Promise.all(
        departmentList.map(async (department: Department) => {
          try {
            const depActivitiesRes = await departmentService.getDepartmentActivities(department.id);
            const depActivities = depActivitiesRes.data || [];
            return {
              departmentId: department.id,
              departmentName: department.name,
              activityIds: depActivities.map((a: { id: number }) => a.id),
            };
          } catch {
            return {
              departmentId: department.id,
              departmentName: department.name,
              activityIds: [] as number[],
            };
          }
        })
      );

      const nextMap: Record<number, { ids: number[]; names: string[] }> = {};

      relationResults.forEach((relation) => {
        relation.activityIds.forEach((activityId) => {
          if (!nextMap[activityId]) {
            nextMap[activityId] = { ids: [], names: [] };
          }
          nextMap[activityId].ids.push(relation.departmentId);
          nextMap[activityId].names.push(relation.departmentName);
        });
      });

      setActivityDepartmentsMap(nextMap);
    } catch {
      setError("Fəaliyyətlər yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Fəaliyyət adı vacibdir");
      return;
    }

    setSaving(true);
    try {
      const code = "FA" + Date.now();
      await activityService.create({
        code,
        name: cleanTitle,
        description: description.trim(),
      });
      setTitle("");
      setDescription("");
      showToast("Fəaliyyət uğurla əlavə edildi");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Fəaliyyət əlavə edilmədi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu fəaliyyəti silmək istəyirsiniz?")) return;
    try {
      await activityService.delete(id);
      showToast("Fəaliyyət silindi");
      load();
    } catch {
      setError("Silinmə zamanı xəta baş verdi");
    }
  };

  const handleEditStart = (item: Activity) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditDescription(item.description || "");
  };

  const handleEditSave = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await activityService.update(id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setEditId(null);
      showToast("Dəyişikliklər saxlanıldı");
      load();
    } catch {
      setError("Yenilənmə zamanı xəta baş verdi");
    }
  };

  const filtered = activities.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (selectedDepartmentId === "all") return true;

    const departmentMeta = activityDepartmentsMap[a.id];
    if (!departmentMeta) return false;
    return departmentMeta.ids.includes(selectedDepartmentId);
  });

  return (
    <>
      <PageMeta title="Ümumi fəaliyyətlər | Performix" description="" />
      <PageBreadcrumb pageTitle="Ümumi fəaliyyətlər" />

      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg bg-green-500 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            Yeni fəaliyyət əlavə et
          </h3>

          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fəaliyyət adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Məsələn: Elmi məqalə hazırlanması"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Qısa izah
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Əlavə məlumatı buraya yazın"
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Əlavə edilir..." : "Fəaliyyəti əlavə et"}
            </button>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Əlavə edilmiş fəaliyyətlər
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Axtar..."
                className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <select
                value={selectedDepartmentId}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDepartmentId(value === "all" ? "all" : Number(value));
                }}
                className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">Bütün departamentlər</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-6">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search
                ? "Axtarışa uyğun nəticə tapılmadı."
                : "Hələ fəaliyyət əlavə edilməyib."}
            </p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <th className="py-3 pl-2  text-center font-medium text-gray-700 dark:text-gray-300">
                      #
                    </th>
                    <th className="px-4 py-3 font-medium">Fəaliyyət adı</th>
                    <th className="px-4 py-3 font-medium">Departamentlər</th>
                    <th className="px-4 py-3 font-medium text-right">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => (
                    <tr
                      key={item.id}
                      className={
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/70"
                      }
                    >
                      <td className="py-3 pl-2 text-center text-gray-700 dark:text-gray-300">
                        {index + 1}
                      </td>
                      {editId === item.id ? (
                        <>
                          <td className="px-4 py-3 text-gray-800 dark:text-white">
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              />
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {activityDepartmentsMap[item.id]?.names?.length
                              ? activityDepartmentsMap[item.id].names.join(", ")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave(item.id)}
                                className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-600"
                              >
                                Saxla
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditId(null)}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                              >
                                Ləğv et
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-gray-800 dark:text-white">{item.name}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {activityDepartmentsMap[item.id]?.names?.length
                              ? activityDepartmentsMap[item.id].names.join(", ")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditStart(item)}
                                className="text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Redaktə
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="text-sm font-medium text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
