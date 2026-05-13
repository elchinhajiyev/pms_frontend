import { useEffect, useState } from "react";
import { useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { evaluationParameterService, EvaluationParameter } from "../../services/evaluationService";

const CATEGORY_DEFINITIONS: Record<string, { title: string; pageTitle: string }> = {  scientific_reports: { title: "Elmi məruzələr", pageTitle: "Elmi məruzələr" },
  book_authorship: { title: "Kitab müəllifliyi", pageTitle: "Kitab müəllifliyi" },
  scientific_publications: { title: "Elmi nəşrlər", pageTitle: "Elmi nəşrlər" },
  scientific_projects: { title: "Elmi tədqiqat layihələri", pageTitle: "Elmi tədqiqat layihələri" },
  course_programs: { title: "Tədris proqramları", pageTitle: "Tədris proqramları" },
  textbooks: { title: "Dərsliklər", pageTitle: "Dərsliklər" },
  course_materials: { title: "Dərs vəsaitləri", pageTitle: "Dərs vəsaitləri" },
  methodical_materials: { title: "Metodiki vəsaitlər", pageTitle: "Metodiki vəsaitlər" }
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

const buildParameterCode = (categoryKey: string, name: string) => {
  const prefix = `${categoryKey}-`;
  const safeSlug = slugify(name) || "item";
  return `${prefix}${safeSlug}`;
};

type CategoryForm = {
  name: string;
  score: string;
};

const emptyForm: CategoryForm = { name: "", score: "5" };

export default function CategoryManagementPage() {
  const { categoryKey } = useParams();
  const category = categoryKey ? CATEGORY_DEFINITIONS[categoryKey] : undefined;

  const [items, setItems] = useState<EvaluationParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!categoryKey || !category) {
      setLoading(false);
      setError("Kateqoriya tapılmadı");
      setItems([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await evaluationParameterService.getAll(categoryKey);
      const data = Array.isArray(res?.data) ? res.data : [];
      setItems(data);
    } catch {
      setError("Kateqoriyalar yüklənmədi");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [categoryKey]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (item: EvaluationParameter) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      score: String(item.max_score ?? 5)
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!categoryKey || !category) {
      setFormError("Kateqoriya tapılmadı");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Kateqoriya adı tələb olunur");
      return;
    }

    const parsedScore = Number(form.score);
    if (!Number.isFinite(parsedScore) || parsedScore <= 0) {
      setFormError("Bal düzgün deyil");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        code: buildParameterCode(categoryKey, form.name),
        name: form.name.trim(),
        category: categoryKey,
        min_score: 1,
        max_score: parsedScore,
        weight: 1,
        sort_order: editId ? undefined : items.length + 1
      };

      if (editId) {
        await evaluationParameterService.update(editId, {
          name: form.name.trim(),
          max_score: parsedScore,
          category: categoryKey
        });
      } else {
        await evaluationParameterService.create(payload);
      }

      setShowModal(false);
      await load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Yadda saxlamaq mümkün olmadı");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: EvaluationParameter) => {
    if (!confirm(`"${item.name}" kateqoriyasını silmək istəyirsiniz?`)) return;

    try {
      await evaluationParameterService.delete(item.id);
      await load();
    } catch {
      alert("Silinmə zamanı xəta baş verdi");
    }
  };

  const pageTitle = category?.pageTitle || "Kateqoriyalar";

  return (
    <>
      <PageMeta title={`${pageTitle} | Performix`} description={`${pageTitle} kateqoriyalarının idarə olunması`} />
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{pageTitle}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Ümumi kateqoriyaları burada idarə edə bilərsiniz.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Yeni kateqoriya əlavə et
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Hələ kateqoriya əlavə edilməyib.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Kateqoriya adı</th>
                  <th className="pb-3 pr-4 font-medium">Bal</th>
                  <th className="pb-3 font-medium text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">{item.name}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{item.max_score}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              {editId ? "Kateqoriyanı redaktə et" : "Yeni kateqoriya əlavə et"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kateqoriya adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: İlin sonu qiymətləndirməsi"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bal <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.score}
                  onChange={(e) => setForm((prev) => ({ ...prev, score: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: 10"
                />
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
