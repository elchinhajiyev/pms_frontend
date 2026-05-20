import { FormEvent, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import { employeeGroupService, EmployeeGroup } from "../../services/evaluationService";
import { activityService, Activity } from "../../services/activityService";
import { User } from "../../services/userService";
import surveyService, { Survey } from "../../services/surveyService";
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
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [eligibleParticipants, setEligibleParticipants] = useState<User[]>([]);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);
  const [activityLoadFailed, setActivityLoadFailed] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(() => academicYears[0] || String(new Date().getFullYear()));
  const [semester, setSemester] = useState<"YAZ" | "YAY" | "PAYIZ">("YAZ");
  const [groupId, setGroupId] = useState<string>("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [participantIds, setParticipantIds] = useState<number[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const initialAcademicYear = academicYears[0] || String(new Date().getFullYear());
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

    const [surveysResult, participantsResult, activitiesResult] = await Promise.allSettled([
      surveyService.getAll(),
      surveyService.getEligibleParticipants(),
      activityService.getAll(),
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

    if (activitiesResult.status === "fulfilled") {
      const activitiesRes = activitiesResult.value;
      const activitiesData = Array.isArray(activitiesRes?.data)
        ? activitiesRes.data
        : Array.isArray(activitiesRes)
          ? activitiesRes
          : [];
      setAllActivities(activitiesData);
    } else {
      setAllActivities([]);
    }

    if (
      surveysResult.status === "rejected" ||
      participantsResult.status === "rejected" ||
      activitiesResult.status === "rejected"
    ) {
      setError((prev) => prev || "Sorğu məlumatlarının bir hissəsi yüklənmədi");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const openCreateModal = () => {
    setTitle("");
    setDescription("");
    setYear(initialAcademicYear);
    setSemester((initialSemester as "YAZ" | "YAY" | "PAYIZ") || "YAZ");
    setGroupId("");
    setActivities(allActivities);
    setActivityLoadFailed(false);
    setSelectedActivityIds(allActivities.map((activity) => activity.id));
    setParticipantIds([]);
    setError("");
    setShowModal(true);
  };

  const onGroupChange = async (value: string) => {
    setGroupId(value);
    setActivities(allActivities);
    setSelectedActivityIds([]);
    setActivityLoadFailed(false);
    setError("");

    if (!value) {
      return;
    }

    try {
      const res = await activityService.getGroupActivities(Number(value));
      const activityData = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      const nextActivities = activityData.length > 0 ? activityData : allActivities;

      setActivities(nextActivities);
      setSelectedActivityIds(nextActivities.map((a: Activity) => a.id));
    } catch {
      if (allActivities.length > 0) {
        setActivities(allActivities);
        setSelectedActivityIds(allActivities.map((activity) => activity.id));
      } else {
        setActivities([]);
        setSelectedActivityIds([]);
        setActivityLoadFailed(true);
        setError("Fəaliyyətlər yüklənmədi");
      }
    }
  };

  const toggleActivity = (id: number) => {
    setSelectedActivityIds((prev) =>
      prev.includes(id) ? prev.filter((activityId) => activityId !== id) : [...prev, id]
    );
  };

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

    if (!groupId) {
      setError("İşçi qrupu seçilməlidir");
      return;
    }

    if (!semester) {
      setError("Semestr seçilməlidir");
      return;
    }

    if (selectedActivityIds.length === 0) {
      setError("Ən azı bir fəaliyyət seçilməlidir");
      return;
    }

    if (activityLoadFailed) {
      setError("Fəaliyyətlər yüklənmədiyi üçün sorğu yaradıla bilməz");
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
      const normalizedActivityIds = Array.from(new Set(selectedActivityIds));
      const normalizedParticipantIds = Array.from(new Set(participantIds));

      await surveyService.create({
        title: title.trim(),
        description: description.trim(),
        year: Number(year),
        semester: normalizedSemester as "YAZ" | "YAY" | "PAYIZ",
        employee_group_id: Number(groupId),
        activity_ids: normalizedActivityIds,
        participant_ids: normalizedParticipantIds,
      });

      setShowModal(false);
      await loadInitialData();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Sorğu yaradılarkən xəta baş verdi"));
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
        ...records.map((item) => String(item.year)).filter((item) => item && item !== "NaN")
      ])
    );
    return years.sort((a, b) => Number(b) - Number(a));
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
      <PageMeta title="Sorğular | Performix" description="Sorğuların yaradılması və idarə olunması" />
      <PageBreadcrumb pageTitle="Sorğular" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Sorğular</h2>
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
                      <button
                        onClick={() => openDeleteConfirm(record)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Sil
                      </button>
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Yeni sorğu yarat</h3>
              <button
                onClick={() => setShowModal(false)}
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
                    {academicYears.map((y) => (
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
                  Fəaliyyətlər (sorğuya əlavə ediləcək)
                </h4>
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Fəaliyyət tapılmadı.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-white">
                          <input
                            type="checkbox"
                            checked={selectedActivityIds.includes(activity.id)}
                            onChange={() => toggleActivity(activity.id)}
                            className="h-5 w-5"
                          />
                          {activity.name}
                        </label>
                      </div>
                    ))}
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
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={submitting || !participantsLoaded || activityLoadFailed}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {submitting ? "Yaradılır..." : "Sorğunu yarat"}
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
