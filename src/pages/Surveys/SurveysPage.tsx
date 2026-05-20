import { FormEvent, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import { employeeGroupService, EmployeeGroup } from "../../services/evaluationService";
import { User } from "../../services/userService";
import surveyService, { Survey } from "../../services/surveyService";
import surveyQuestionBankService, {
  SurveyQuestionBank,
} from "../../services/surveyQuestionBankService";
import { useHelperToolOptions } from "../../hooks/useHelperToolOptions";

const ROWS_PER_PAGE = 20;

const isTeacherGroup = (group: EmployeeGroup) => {
  const values = [group.code, group.name, group.name_en]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return values.some(
    (value) =>
      value.includes("teacher") ||
      value.includes("education") ||
      value.includes("teaching") ||
      value.includes("müəllim") ||
      value.includes("muellim") ||
      value.includes("təlim") ||
      value.includes("telim") ||
      value.includes("tədris") ||
      value.includes("tedris")
  );
};

const SurveysPage: React.FC = () => {
  const { academicYears, semesters } = useHelperToolOptions();
  const [records, setRecords] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [questionBanks, setQuestionBanks] = useState<SurveyQuestionBank[]>([]);
  const [eligibleParticipants, setEligibleParticipants] = useState<User[]>([]);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);
  const [editingSurveyId, setEditingSurveyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [semester, setSemester] = useState<"YAZ" | "YAY" | "PAYIZ">("YAZ");
  const [groupId, setGroupId] = useState<string>("");
  const [questionBankId, setQuestionBankId] = useState<string>("");
  const [participantIds, setParticipantIds] = useState<number[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const initialAcademicYear =
    academicYears.find((item) => String(item || "").trim()) ||
    String(new Date().getFullYear());
  const initialSemester = semesters[0] || "YAZ";

  const extractApiErrorMessage = (err: unknown, fallback: string) => {
    if (isAxiosError(err)) {
      const message = err.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }

    return fallback;
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    setParticipantsLoaded(false);

    try {
      const groupsRes = await employeeGroupService.getAll();
      const groupsData = Array.isArray(groupsRes?.data)
        ? groupsRes.data
        : Array.isArray(groupsRes)
          ? groupsRes
          : [];
      setGroups(groupsData);
    } catch {
      setGroups([]);
      setError("İşçi qrupları yüklənmədi");
    }

    const [surveysResult, participantsResult, questionBanksResult] = await Promise.allSettled([
      surveyService.getAll(),
      surveyService.getEligibleParticipants(),
      surveyQuestionBankService.getAll(),
    ]);

    if (surveysResult.status === "fulfilled") {
      const surveysRes = surveysResult.value;
      const surveysData = Array.isArray(surveysRes?.data)
        ? surveysRes.data
        : Array.isArray(surveysRes)
          ? surveysRes
          : [];
      setRecords(surveysData);
    } else {
      setRecords([]);
    }

    if (participantsResult.status === "fulfilled") {
      const participantsRes = participantsResult.value;
      const participantsData = Array.isArray(participantsRes?.data)
        ? participantsRes.data
        : [];
      setEligibleParticipants(participantsData);
      setParticipantsLoaded(true);
    } else {
      setEligibleParticipants([]);
      setParticipantsLoaded(false);
    }

    if (questionBanksResult.status === "fulfilled") {
      const questionBanksRes = questionBanksResult.value;
      const questionBanksData = Array.isArray(questionBanksRes?.data)
        ? questionBanksRes.data
        : Array.isArray(questionBanksRes)
          ? questionBanksRes
          : [];
      setQuestionBanks(questionBanksData);
    } else {
      setQuestionBanks([]);
    }

    if (
      surveysResult.status === "rejected" ||
      participantsResult.status === "rejected" ||
      questionBanksResult.status === "rejected"
    ) {
      setError((prev) => prev || "Sorğu məlumatlarının bir hissəsi yüklənmədi");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingSurveyId(null);
    setTitle("");
    setDescription("");
    setYear(initialAcademicYear);
    setSemester((initialSemester as "YAZ" | "YAY" | "PAYIZ") || "YAZ");
    setGroupId("");
    setQuestionBankId("");
    setParticipantIds([]);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (survey: Survey) => {
    const surveyYear = String(survey.year || "").trim();

    setEditingSurveyId(survey.id);
    setTitle(survey.title || "");
    setDescription(survey.description || "");
    setYear(surveyYear || initialAcademicYear);
    setSemester((survey.semester || initialSemester || "YAZ") as "YAZ" | "YAY" | "PAYIZ");
    setGroupId(survey.employee_group_id ? String(survey.employee_group_id) : "");
    setQuestionBankId(survey.question_bank_id ? String(survey.question_bank_id) : "");
    setParticipantIds((survey.participants || []).map((participant) => participant.user_id));
    setError("");
    setShowModal(true);
  };

  const onGroupChange = (value: string) => {
    setGroupId(value);
    setError("");
  };

  const onQuestionBankChange = (value: string) => {
    setQuestionBankId(value);
    setError("");
  };

  const selectedQuestionBank = useMemo(
    () => questionBanks.find((bank) => String(bank.id) === questionBankId) || null,
    [questionBanks, questionBankId]
  );

  const selectedQuestionBankActivityIds = useMemo(
    () =>
      Array.from(
        new Set(
          (selectedQuestionBank?.questions || [])
            .map((question) => question.activity_id)
            .filter((activityId) => activityId !== null && activityId !== undefined)
            .map(Number)
            .filter(Number.isFinite)
        )
      ),
    [selectedQuestionBank]
  );

  const toggleParticipant = (id: number) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleAllParticipants = () => {
    if (participantIds.length === eligibleParticipants.length) {
      setParticipantIds([]);
      return;
    }

    setParticipantIds(eligibleParticipants.map((user) => user.id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Sorğunun adı tələb olunur");
      return;
    }

    const normalizedYear = String(year || "").trim();
    if (!normalizedYear) {
      setError("İl seçilməlidir");
      return;
    }

    if (!groupId) {
      setError("İşçi qrupu seçilməlidir");
      return;
    }

    if (!semester) {
      setError("Semestr seçilməlidir");
      return;
    }

    if (!questionBankId || !selectedQuestionBank) {
      setError("Sual bankı seçilməlidir");
      return;
    }

    if (selectedQuestionBankActivityIds.length === 0) {
      setError("Seçilmiş sual bankında fəaliyyətlə əlaqələndirilmiş sual yoxdur");
      return;
    }

    if (!participantsLoaded) {
      setError("İştirakçılar yüklənməyib, yenidən cəhd edin");
      return;
    }

    if (participantIds.length === 0) {
      setError("Ən azı bir iştirakçı seçilməlidir");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const normalizedSemester = semester.toUpperCase() as "YAZ" | "YAY" | "PAYIZ";
      const normalizedParticipantIds = Array.from(new Set(participantIds));
      const payload = {
        title: title.trim(),
        description: description.trim(),
        year: normalizedYear,
        semester: normalizedSemester as "YAZ" | "YAY" | "PAYIZ",
        employee_group_id: Number(groupId),
        question_bank_id: Number(questionBankId),
        activity_ids: selectedQuestionBankActivityIds,
        participant_ids: normalizedParticipantIds,
      };

      if (editingSurveyId) {
        await surveyService.update(editingSurveyId, payload);
      } else {
        await surveyService.create(payload);
      }

      setShowModal(false);
      setEditingSurveyId(null);
      await loadInitialData();
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          editingSurveyId
            ? "Sorğu redaktə edilərkən xəta baş verdi"
            : "Sorğu yaradılarkən xəta baş verdi"
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (survey: Survey) => {
    setSurveyToDelete(survey);
    setShowDeleteConfirm(true);
    setError("");
  };

  const handleDeleteSurvey = async () => {
    if (!surveyToDelete) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await surveyService.delete(surveyToDelete.id);
      setShowDeleteConfirm(false);
      setSurveyToDelete(null);
      await loadInitialData();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Sorğu silinərkən xəta baş verdi"));
    } finally {
      setDeleting(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set([
        ...academicYears,
        String(new Date().getFullYear()),
        ...records
          .map((item) => String(item.year))
          .filter((item) => item && item !== "NaN" && item !== "0")
      ])
    );
    return years.sort((a, b) => b.localeCompare(a));
  }, [academicYears, records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesName =
        !searchQuery.trim() ||
        String(record.title || "")
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

      const matchesYear = !filterYear || String(record.year) === filterYear;
      const matchesSemester = !filterSemester || String(record.semester || "") === filterSemester;
      const matchesGroup = !filterGroupId || String(record.employee_group_id) === filterGroupId;

      return matchesName && matchesYear && matchesSemester && matchesGroup;
    });
  }, [records, searchQuery, filterYear, filterSemester, filterGroupId]);

  const teacherGroups = useMemo(() => groups.filter(isTeacherGroup), [groups]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterYear, filterSemester, filterGroupId, records.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ROWS_PER_PAGE));
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + ROWS_PER_PAGE);

  return (
    <>
      <PageMeta title="Sorğu vərəqi | Performix" description="Sorğu vərəqlərinin yaradılması və idarə olunması" />
      <PageBreadcrumb pageTitle="Sorğu vərəqi" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Sorğu vərəqi</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Yeni sorğu yaradın, fəaliyyətləri əlavə edin və iştirakçıları seçin.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Yeni sorğu yarat
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        {!loading && records.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Hələ sorğu yaradılmayıb.</p>
        )}

        {!loading && records.length > 0 && (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Sorğu adına görə axtarış
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sorğu adı yazın..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  İl filteri
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Bütün illər</option>
                  {availableYears.map((itemYear) => (
                    <option key={itemYear} value={itemYear}>
                      {itemYear}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Semestr filteri
                </label>
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Bütün semestrlər</option>
                  {semesters.map((itemSemester) => (
                    <option key={itemSemester} value={itemSemester}>
                      {itemSemester}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  İşçi qrupu filteri
                </label>
                <select
                  value={filterGroupId}
                  onChange={(e) => setFilterGroupId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Bütün qruplar</option>
                  {groups.map((group) => (
                    <option key={group.id} value={String(group.id)}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredRecords.length === 0 && (
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Filterlərə uyğun sorğu tapılmadı.
              </p>
            )}

            {filteredRecords.length > 0 && (
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Ümumi {filteredRecords.length} nəticə, səhifə {currentPage}/{totalPages}
              </p>
            )}

            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Sorğunun adı</th>
                  <th className="pb-3 pr-4 font-medium">İl</th>
                  <th className="pb-3 pr-4 font-medium">Semestr</th>
                  <th className="pb-3 pr-4 font-medium">İşçi qrupu</th>
                  <th className="pb-3 pr-4 font-medium">Fəaliyyət sayı</th>
                  <th className="pb-3 pr-4 font-medium">İştirakçı sayı</th>
                  <th className="pb-3 pr-4 font-medium text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">{record.title}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.year}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {record.semester === "YAZ"
                        ? "Yaz"
                        : record.semester === "YAY"
                          ? "Yay"
                          : record.semester === "PAYIZ"
                            ? "Payız"
                            : "-"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.group_name || "-"}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {record.activity_scores?.length || 0}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.participants?.length || 0}</td>
                    <td className="py-3 pr-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(record)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(record)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
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

            {filteredRecords.length > ROWS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Əvvəlki
                </button>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Növbəti
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editingSurveyId ? "Sorğunu redaktə et" : "Yeni sorğu yarat"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSurveyId(null);
                }}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sorğunun adı *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Məsələn: 2026 Tələbə Məmnuniyyəti Sorğusu"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sorğunun ətraflı məlumatı
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Sorğunun məqsədi və izahı..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    İl seçimi *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    İşçi qrupu *
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => onGroupChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Seçin</option>
                    {teacherGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.code})
                      </option>
                    ))}
                  </select>
                  {teacherGroups.length === 0 && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                      Müəllim işçi qrupu tapılmadı.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sual bankını seç *
                  </label>
                  <select
                    value={questionBankId}
                    onChange={(e) => onQuestionBankChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Seçin</option>
                    {questionBanks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  {questionBanks.length === 0 && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                      Sual bankı tapılmadı.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Semestr *
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as "YAZ" | "YAY" | "PAYIZ")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {semesters.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                  Suallar
                </h4>
                {!selectedQuestionBank ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sualları görmək üçün sual bankı seçin.
                  </p>
                ) : (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {selectedQuestionBank.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Fəaliyyətlə əlaqəli suallar avtomatik sorğuya əlavə edilir.
                      </p>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {selectedQuestionBank.questions.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Bu sual bankında sual yoxdur.
                        </p>
                      ) : (
                        selectedQuestionBank.questions.map((question, index) => (
                          <div
                            key={question.id || `${question.question_text}-${index}`}
                            className="flex gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 dark:border-gray-700"
                          >
                            <span className="mt-0.5 w-7 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                              #{index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-gray-800 dark:text-white">
                                {question.question_text}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {question.activity_name
                                  ? `Fəaliyyət: ${question.activity_name}`
                                  : "Fəaliyyət seçilməyib"}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                  İştirakçılar (statusu və rolu Tələbə olanlar)
                </h4>
                {!participantsLoaded && (
                  <p className="mb-2 text-sm text-amber-700 dark:text-amber-400">
                    İştirakçılar hazırda yüklənməyib. Sorğu yaratmaq üçün səhifəni yeniləyin.
                  </p>
                )}
                {eligibleParticipants.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Uyğun tələbə tapılmadı.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={participantIds.length === eligibleParticipants.length}
                          onChange={toggleAllParticipants}
                          className="h-5 w-5"
                        />
                        Hamısını seç
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Seçilən: {participantIds.length}
                      </span>
                    </div>

                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      {eligibleParticipants.map((user) => (
                        <label
                          key={user.id}
                          className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <span className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <UserAvatar
                              photo={user.photo}
                              name={`${user.last_name} ${user.first_name}`}
                              size="sm"
                            />
                            <span>
                              {user.last_name} {user.first_name} ({user.fin || "FİN yoxdur"})
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            checked={participantIds.includes(user.id)}
                            onChange={() => toggleParticipant(user.id)}
                            className="h-5 w-5"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSurveyId(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={submitting || !participantsLoaded}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {submitting
                    ? editingSurveyId
                      ? "Saxlanılır..."
                      : "Yaradılır..."
                    : editingSurveyId
                      ? "Saxla"
                      : "Sorğunu yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && surveyToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 0 0 3.67 18h16.66a1 1 0 0 0 .88-1.5l-7.5-13a1 1 0 0 0-1.74 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sorğunu silməyə əminsiniz?
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Diqqət bu məlumatı sildiyinizdə bu sorğu ilə bağlı  bütün məlumatlar bərpası olmayacaq şəkildə silinəcəkdir.
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                  Sorğu: {surveyToDelete.title}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setShowDeleteConfirm(false);
                    setSurveyToDelete(null);
                  }
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={handleDeleteSurvey}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Silinir..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SurveysPage;
