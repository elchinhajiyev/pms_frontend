import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { MultiCombobox } from "../../components/ui/combobox";
import departmentService, { Department } from "../../services/departmentService";
import facultyService, { Faculty } from "../../services/facultyService";

const emptyForm = { name: "", department_ids: [] as number[] };

const isKafedraDepartment = (department: Department) =>
  (department.categories || []).some(
    (category) => category.name.trim().toLowerCase() === "kafedra"
  );

export default function FacultiesList() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [facultyRes, departmentRes] = await Promise.all([
        facultyService.getAll(),
        departmentService.getAll(),
      ]);
      setFaculties(facultyRes.data || []);
      setDepartments(departmentRes.data || []);
    } catch {
      setError("Fakültələr yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (faculty: Faculty) => {
    setEditId(faculty.id);
    setForm({
      name: faculty.name,
      department_ids: faculty.department_ids || [],
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Fakültə adı tələb olunur");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        department_ids: form.department_ids,
      };

      if (editId) {
        await facultyService.update(editId, payload);
      } else {
        await facultyService.create(payload);
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Yadda saxlamaq mümkün olmadı");
    } finally {
      setSaving(false);
    }
  };

  const kafedraDepartments = departments.filter(isKafedraDepartment);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu fakültəni silmək istəyirsiniz?")) return;

    try {
      await facultyService.delete(id);
      await load();
    } catch {
      alert("Silinmə zamanı xəta baş verdi");
    }
  };

  return (
    <>
      <PageMeta title="Fakültə | Performix" description="Fakültələrin idarə edilməsi" />
      <PageBreadcrumb pageTitle="Fakültə" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Fakültələr</h3>
          <button
            onClick={openCreate}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Fakültə əlavə et
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
        )}

        {!loading && !error && faculties.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Hələ fakültə əlavə edilməyib.</p>
        )}

        {!loading && faculties.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Fakültə adı</th>
                  <th className="pb-3 pr-4 font-medium">Kafedralar</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {faculties.map((faculty) => (
                  <tr key={faculty.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">{faculty.name}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                      {faculty.departments && faculty.departments.length > 0
                        ? faculty.departments.map((department) => department.name).join(", ")
                        : "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(faculty)} className="text-gray-500 hover:text-brand-500 dark:text-gray-400">Redaktə</button>
                        <button onClick={() => handleDelete(faculty.id)} className="text-red-500 hover:text-red-700">Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              {editId ? "Fakültəni redaktə et" : "Yeni fakültə əlavə et"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fakültə adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: Mühəndislik"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kafedralar
                </label>
                <MultiCombobox
                  options={kafedraDepartments.map((department) => ({
                    label: department.name,
                    value: department.id,
                  }))}
                  selectedValues={form.department_ids}
                  onChange={(departmentIds) =>
                    setForm({ ...form, department_ids: departmentIds })
                  }
                  placeholder="Kafedra seçin..."
                  searchPlaceholder="Kafedra axtar..."
                  emptyText="Kafedra kateqoriyalı departament tapılmadı"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{formError}</p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Ləğv et</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
                {saving ? "Saxlanılır..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
