import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiCheck, FiTrash2 } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import activityService, { Activity } from "../../services/activityService";
import surveyQuestionBankService, {
  SurveyQuestionBank,
  SurveyQuestionBankQuestion,
} from "../../services/surveyQuestionBankService";

type QuestionFormRow = {
  id: string;
  question_id?: number;
  question_text: string;
  activity_id: string;
  is_required: boolean;
};

const emptyForm = {
  name: "",
  description: "",
};

const createQuestionRow = (
  question?: SurveyQuestionBankQuestion,
  index = 0
): QuestionFormRow => ({
  id: `${question?.id || "new"}-${Date.now()}-${index}`,
  question_id: question?.id,
  question_text: question?.question_text || "",
  activity_id: question?.activity_id ? String(question.activity_id) : "",
  is_required: question?.is_required !== false,
});

export default function SurveyQuestionBanksPage() {
  const [banks, setBanks] = useState<SurveyQuestionBank[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [questions, setQuestions] = useState<QuestionFormRow[]>([
    createQuestionRow(),
  ]);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [activityModalQuestionId, setActivityModalQuestionId] = useState<string | null>(null);
  const [activitySearch, setActivitySearch] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedActivities = useMemo(
    () =>
      [...activities]
        .filter((activity) => activity.is_active !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activities]
  );

  const filteredActivities = useMemo(() => {
    const search = activitySearch.trim().toLowerCase();

    if (!search) return sortedActivities;

    return sortedActivities.filter((activity) =>
      [activity.name, activity.code, activity.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [activitySearch, sortedActivities]);

  const selectedActivityQuestion = useMemo(
    () =>
      questions.find((question) => question.id === activityModalQuestionId) || null,
    [activityModalQuestionId, questions]
  );

  const getActivity = (activityId: string) =>
    sortedActivities.find((activity) => String(activity.id) === activityId);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [banksRes, activitiesRes] = await Promise.all([
        surveyQuestionBankService.getAll(),
        activityService.getAll(),
      ]);
      setBanks(Array.isArray(banksRes?.data) ? banksRes.data : []);
      setActivities(Array.isArray(activitiesRes?.data) ? activitiesRes.data : []);
    } catch {
      setError("Sual bankları yüklənmədi");
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
    setQuestions([createQuestionRow()]);
    setFormError("");
    setActivityModalQuestionId(null);
    setActivitySearch("");
    setShowModal(true);
  };

  const openEdit = (bank: SurveyQuestionBank) => {
    setEditId(bank.id);
    setForm({
      name: bank.name || "",
      description: bank.description || "",
    });
    setQuestions(
      bank.questions?.length
        ? bank.questions.map((question, index) => createQuestionRow(question, index))
        : [createQuestionRow()]
    );
    setFormError("");
    setActivityModalQuestionId(null);
    setActivitySearch("");
    setShowModal(true);
  };

  const updateQuestion = (
    rowId: string,
    changes: Partial<Omit<QuestionFormRow, "id">>
  ) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === rowId ? { ...question, ...changes } : question
      )
    );
  };

  const addQuestion = () => {
    setQuestions((current) => [...current, createQuestionRow()]);
  };

  const removeQuestion = (rowId: string) => {
    setQuestions((current) =>
      current.length === 1
        ? [createQuestionRow()]
        : current.filter((question) => question.id !== rowId)
    );
  };

  const reorderQuestion = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setQuestions((current) => {
      const sourceIndex = current.findIndex((question) => question.id === sourceId);
      const targetIndex = current.findIndex((question) => question.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const openActivityModal = (questionId: string) => {
    setActivityModalQuestionId(questionId);
    setActivitySearch("");
  };

  const selectActivity = (activityId: string) => {
    if (!activityModalQuestionId) return;

    const currentQuestion = questions.find(
      (question) => question.id === activityModalQuestionId
    );
    const nextActivityId =
      currentQuestion?.activity_id === activityId ? "" : activityId;

    updateQuestion(activityModalQuestionId, { activity_id: nextActivityId });
    setActivityModalQuestionId(null);
    setActivitySearch("");
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    questions: questions
      .map((question) => ({
        id: question.question_id,
        question_text: question.question_text.trim(),
        activity_id: question.activity_id ? Number(question.activity_id) : null,
        is_required: question.is_required,
      }))
      .filter((question) => question.question_text),
  });

  const handleSave = async () => {
    const payload = buildPayload();

    if (!payload.name) {
      setFormError("Sual bankının adı tələb olunur");
      return;
    }

    if (!payload.questions.length) {
      setFormError("Ən azı bir sual əlavə edilməlidir");
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      if (editId) {
        await surveyQuestionBankService.update(editId, payload);
      } else {
        await surveyQuestionBankService.create(payload);
      }
      setShowModal(false);
      await load();
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message || "Sual bankını yadda saxlamaq mümkün olmadı"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bank: SurveyQuestionBank) => {
    if (!confirm(`"${bank.name}" sual bankını silmək istəyirsiniz?`)) return;

    try {
      await surveyQuestionBankService.delete(bank.id);
      await load();
    } catch {
      alert("Silinmə zamanı xəta baş verdi");
    }
  };

  return (
    <>
      <PageMeta
        title="Suallar | Performix"
        description="Sorğu sual banklarının idarə edilməsi"
      />
      <PageBreadcrumb pageTitle="Suallar" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Sual bankları
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sorğu vərəqlərində istifadə olunacaq sualları fəaliyyətlərlə əlaqələndirin.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Yeni sual bankı yarat
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

        {!loading && !error && banks.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Hələ sual bankı yaradılmayıb.
          </p>
        )}

        {!loading && banks.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Sual bankı</th>
                  <th className="pb-3 pr-4 font-medium">Suallar</th>
                  <th className="pb-3 pr-4 font-medium">Fəaliyyətlər</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank) => {
                  const linkedActivities = [
                    ...new Set(
                      (bank.questions || [])
                        .map((question) => question.activity_name)
                        .filter(Boolean)
                    ),
                  ];

                  return (
                    <tr
                      key={bank.id}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-800 dark:text-white">
                          {bank.name}
                        </div>
                        {bank.description && (
                          <div className="mt-1 max-w-xl text-xs text-gray-500 dark:text-gray-400">
                            {bank.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                        {bank.question_count || bank.questions?.length || 0}
                      </td>
                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                        {linkedActivities.length
                          ? linkedActivities.slice(0, 3).join(", ")
                          : "Fəaliyyət seçilməyib"}
                        {linkedActivities.length > 3 ? " ..." : ""}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEdit(bank)}
                            className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                          >
                            Redaktə
                          </button>
                          <button
                            onClick={() => handleDelete(bank)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {editId ? "Sual bankını redaktə et" : "Yeni sual bankı yarat"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Bağla
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bankın adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: 2026 müəllim qiymətləndirmə sualları"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Qeyd
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Qısa açıqlama"
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Suallar
                </h4>
                <button
                  onClick={addQuestion}
                  className="rounded-lg border border-brand-500 px-3 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                >
                  + Sual əlavə et
                </button>
              </div>

              <div className="space-y-2">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    draggable
                    onDragStart={() => setDraggedQuestionId(question.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedQuestionId) reorderQuestion(draggedQuestionId, question.id);
                      setDraggedQuestionId(null);
                    }}
                    onDragEnd={() => setDraggedQuestionId(null)}
                    className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 transition dark:border-gray-700 dark:bg-gray-800 ${
                      draggedQuestionId === question.id ? "opacity-60" : ""
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 active:cursor-grabbing dark:hover:bg-gray-700 dark:hover:text-gray-200">
                      <MdDragIndicator className="h-5 w-5" />
                    </span>
                    <span className="w-10 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(event) =>
                        updateQuestion(question.id, {
                          question_text: event.target.value,
                        })
                      }
                      className="h-9 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Sual mətnini yazın"
                    />
                    <label
                      className="hidden shrink-0 items-center gap-2 text-xs text-gray-600 dark:text-gray-300 sm:flex"
                      title="Cavab məcburidir"
                    >
                      <input
                        type="checkbox"
                        checked={question.is_required}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            is_required: event.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      Məcburi
                    </label>
                    <button
                      type="button"
                      onClick={() => openActivityModal(question.id)}
                      title={
                        question.activity_id
                          ? getActivity(question.activity_id)?.name || "Fəaliyyət seçilib"
                          : "Fəaliyyət əlavə et"
                      }
                      aria-label="Fəaliyyət əlavə et"
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm ${
                        question.activity_id
                          ? "border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
                          : "border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <FiActivity className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      title="Sil"
                      aria-label="Sualı sil"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-900/20"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {formError && (
              <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
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

      {activityModalQuestionId && selectedActivityQuestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Fəaliyyət seç
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedActivityQuestion.question_text || "Sual mətni yazılmayıb"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivityModalQuestionId(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Bağla
              </button>
            </div>

            <input
              type="text"
              value={activitySearch}
              onChange={(event) => setActivitySearch(event.target.value)}
              className="mb-3 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="Fəaliyyət axtar"
              autoFocus
            />

            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => selectActivity("")}
                className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>Fəaliyyət seçilməyib</span>
                {!selectedActivityQuestion.activity_id && (
                  <FiCheck className="h-4 w-4 text-brand-500" />
                )}
              </button>
              {filteredActivities.map((activity) => {
                const isSelected =
                  String(activity.id) === selectedActivityQuestion.activity_id;

                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => selectActivity(String(activity.id))}
                    className={`flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 dark:border-gray-700 ${
                      isSelected
                        ? "bg-brand-100 hover:bg-brand-100 dark:bg-brand-500/20 dark:hover:bg-brand-500/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-800 dark:text-white">
                        {activity.name}
                      </span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {[activity.code, activity.category].filter(Boolean).join(" • ") || "-"}
                      </span>
                    </span>
                    {isSelected && (
                      <FiCheck className="h-4 w-4 shrink-0 text-brand-500" />
                    )}
                  </button>
                );
              })}
              {filteredActivities.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Fəaliyyət tapılmadı.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
