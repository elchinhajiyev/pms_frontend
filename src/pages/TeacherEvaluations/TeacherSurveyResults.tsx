import { useEffect, useMemo, useState } from "react";
import { MdOutlineMoreHoriz } from "react-icons/md";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import teacherSurveyService, {
  TeacherSurveyParticipantItem,
  TeacherSurveyResultItem
} from "../../services/teacherSurveyService";

const ROWS_PER_PAGE = 20;

const semesterLabel = (semester?: string) => {
  if (semester === "YAZ") return "Yaz";
  if (semester === "YAY") return "Yay";
  if (semester === "PAYIZ") return "Payız";
  return semester || "-";
};

export default function TeacherSurveyResults() {
  const { user } = useAuth();

  const [records, setRecords] = useState<TeacherSurveyResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSurveyIds, setExpandedSurveyIds] = useState<number[]>([]);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState("");
  const [participants, setParticipants] = useState<TeacherSurveyParticipantItem[]>([]);
  const [participantsSurveyTitle, setParticipantsSurveyTitle] = useState("");

  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const res = await teacherSurveyService.getTeacherResults(user.id);
      const data = Array.isArray(res?.data) ? res.data : [];
      setRecords(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Sorğu nəticələri yüklənmədi");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(records.map((item) => String(item.year))));
    return years.sort((a, b) => Number(b) - Number(a));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        String(item.title || "").toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesYear = !filterYear || String(item.year) === filterYear;
      const matchesSemester = !filterSemester || String(item.semester || "") === filterSemester;

      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [records, searchQuery, filterYear, filterSemester]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterYear, filterSemester, records.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ROWS_PER_PAGE));
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(pageStart, pageStart + ROWS_PER_PAGE);

  const toggleExpanded = (surveyId: number) => {
    setExpandedSurveyIds((prev) =>
      prev.includes(surveyId) ? prev.filter((id) => id !== surveyId) : [...prev, surveyId]
    );
  };

  const openParticipantsModal = async (record: TeacherSurveyResultItem) => {
    if (!user?.id) return;

    setParticipantsSurveyTitle(record.title || "");
    setParticipantsModalOpen(true);
    setParticipantsLoading(true);
    setParticipantsError("");
    setParticipants([]);

    try {
      const response = await teacherSurveyService.getTeacherSurveyParticipants(user.id, record.survey_id);
      const rows = Array.isArray(response?.data) ? response.data : [];
      setParticipants(rows);
    } catch (err: any) {
      setParticipantsError(err?.response?.data?.message || "İştirakçılar yüklənmədi");
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Sorğu nəticələrim | Performix" description="Müəllim üçün anonim sorğu nəticələrinin orta göstəriciləri" />
      <PageBreadcrumb pageTitle="Sorğu nəticələrim" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Sorğu adına görə axtarış
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sorğu adı..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tədris ili filteri</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Bütün tədris illəri</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Semestr filteri</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Bütün semestrlər</option>
              <option value="YAZ">Yaz</option>
              <option value="YAY">Yay</option>
              <option value="PAYIZ">Payız</option>
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
        ) : filteredRecords.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Sorğu nəticəsi tapılmadı.</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Ümumi {filteredRecords.length} sorğu, səhifə {currentPage}/{totalPages}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                    <th className="pb-3 pr-4 font-medium">Sorğu adı</th>
                    <th className="pb-3 pr-4 font-medium">Tədris ili</th>
                    <th className="pb-3 pr-4 font-medium">Semestr</th>
                    <th className="pb-3 pr-4 font-medium">Fəaliyyət sayı</th>
                    <th className="pb-3 pr-4 font-medium">Ümumi orta bal</th>
                    <th className="pb-3 pr-4 font-medium">Səs sayı</th>
                    <th className="pb-3 pr-4 font-medium text-right">Detallar</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record) => {
                    const expanded = expandedSurveyIds.includes(record.survey_id);
                    return (
                      <>
                        <tr key={`survey-${record.survey_id}`} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 pr-4 text-gray-800 dark:text-white">{record.title}</td>
                          <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.year}</td>
                          <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{semesterLabel(record.semester)}</td>
                          <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.activity_count || 0}</td>
                          <td className="py-3 pr-4 font-medium text-green-700 dark:text-green-400">
                            {record.overall_average_score ? Number(record.overall_average_score).toFixed(2) : "-"}
                          </td>
                          <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.total_votes || 0}</td>
                          <td className="py-3 pr-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => openParticipantsModal(record)}
                                className="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                              >
                                İştirakçılar
                              </button>
                              <button
                                onClick={() => toggleExpanded(record.survey_id)}
                                className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                {!expanded && <MdOutlineMoreHoriz className="text-sm text-blue-600 dark:text-blue-400" />}
                                {expanded ? "Gizlət" : "Ətraflı"}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr key={`detail-${record.survey_id}`} className="border-b border-gray-100 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-900/40">
                            <td colSpan={7} className="px-4 py-4">
                              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                                Anonim nəticələr göstərilir. Tələbə üzrə fərdi səslər göstərilmir.
                              </p>
                              {record.activities.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Fəaliyyət nəticəsi yoxdur.</p>
                              ) : (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                  <table className="w-full text-xs sm:text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                                        <th className="px-3 py-2 font-medium">Fəaliyyət</th>
                                        <th className="px-3 py-2 font-medium">Orta bal</th>
                                        <th className="px-3 py-2 font-medium">Səs sayı</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {record.activities.map((activity) => (
                                        <tr key={`${record.survey_id}-${activity.activity_id}`} className="border-b border-gray-100 last:border-b-0 dark:border-gray-700">
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{activity.activity_name}</td>
                                          <td className="px-3 py-2 font-medium text-brand-600 dark:text-brand-400">
                                            {activity.average_score ? Number(activity.average_score).toFixed(2) : "-"}
                                          </td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{activity.vote_count || 0}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
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

      <Modal
        isOpen={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        className="mx-4 max-h-[85vh] max-w-6xl overflow-y-auto p-5 lg:p-7"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">İştirakçılar</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sorğu: {participantsSurveyTitle || "-"}</p>
        </div>

        {participantsError && (
          <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {participantsError}
          </p>
        )}

        {participantsLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : participants.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">İştirakçı tapılmadı.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2 font-medium">Ad soyad ata adı</th>
                  <th className="px-3 py-2 font-medium">Qrup nömrəsi</th>
                  <th className="px-3 py-2 font-medium">Telefon nömrəsi</th>
                  <th className="px-3 py-2 font-medium">Bu sorğuda iştirak</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((student, index) => (
                  <tr key={student.participant_id} className="border-b border-gray-100 last:border-b-0 dark:border-gray-700">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{index + 1}.</span>
                        <UserAvatar
                          photo={student.photo}
                          name={[student.first_name, student.last_name].filter(Boolean).join(" ")}
                          size="sm"
                        />
                        <span>
                          {[student.first_name, student.last_name, student.middle_name].filter(Boolean).join(" ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{student.group_number || "-"}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{student.phone || "-"}</td>
                    <td className="px-3 py-2">
                      {student.has_participated ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Bəli
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Xeyr
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
