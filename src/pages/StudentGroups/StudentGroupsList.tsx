import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import { IoIosMore } from "react-icons/io";
import studentGroupService, {
  StudentGroup,
  StudentGroupStudent,
  StudentGroupPayload,
} from "../../services/studentGroupService";
import facultyService, { Faculty } from "../../services/facultyService";
import teachingSubjectService, {
  TeachingSubject,
} from "../../services/teachingSubjectService";
import specialtyService, { Specialty } from "../../services/specialtyService";
import departmentService, { Department } from "../../services/departmentService";
import { userManagementService, User } from "../../services/userService";

const emptyForm: StudentGroupPayload = {
  group_number: "",
  course: null,
  education_type: null,
  faculty_id: null,
  teaching_subject_ids: [],
  specialty_id: null,
  department_ids: [],
  teacher_ids: [],
};

export default function StudentGroupsList() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<TeachingSubject[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StudentGroupPayload>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [students, setStudents] = useState<StudentGroupStudent[]>([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [expandedSubjectsGroupId, setExpandedSubjectsGroupId] = useState<number | null>(null);

  const [groupNumberFilter, setGroupNumberFilter] = useState("");
  const [departmentListSearch, setDepartmentListSearch] = useState("");

  const normalizeData = (res: any) => (Array.isArray(res?.data) ? res.data : []);
  const isKafedraDepartment = (department: Department) =>
    (department.categories || []).some(
      (category) => category.name.trim().toLowerCase() === "kafedra"
    );

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        groupsRes,
        facultiesRes,
        subjectsRes,
        specialtiesRes,
        departmentsRes,
        usersRes,
      ] = await Promise.all([
        studentGroupService.getAll(),
        facultyService.getAll(),
        teachingSubjectService.getAll(),
        specialtyService.getAll(),
        departmentService.getAll(),
        userManagementService.getAllUsers(),
      ]);

      setGroups(normalizeData(groupsRes));
      setFaculties(normalizeData(facultiesRes));
      setSubjects(normalizeData(subjectsRes));
      setSpecialties(normalizeData(specialtiesRes));
      setDepartments((normalizeData(departmentsRes) as Department[]).filter(isKafedraDepartment));

      const usersData = normalizeData(usersRes) as User[];
      const teacherUsers = usersData.filter((user) => {
        const roleCode = String(user.role_code || "").toUpperCase();
        const roleName = String(user.role_name || "").toLowerCase();
        return roleCode === "TEACHER" || roleName.includes("müəllim") || roleName.includes("teacher");
      });
      setTeachers(teacherUsers);
    } catch {
      setError("Məlumatlar yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setSubjectSearch("");
    setDepartmentSearch("");
    setTeacherSearch("");
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (group: StudentGroup) => {
    setEditId(group.id);
    setForm({
      group_number: group.group_number,
      course: group.course ?? null,
      education_type: group.education_type ?? null,
      faculty_id: group.faculty_id ?? null,
      teaching_subject_ids:
        group.teaching_subject_ids ??
        (group.teaching_subject_id ? [group.teaching_subject_id] : []),
      specialty_id: group.specialty_id ?? null,
      department_ids:
        group.department_ids ?? (group.department_id ? [group.department_id] : []),
      teacher_ids: group.teacher_ids ?? [],
    });
    setSubjectSearch("");
    setDepartmentSearch("");
    setTeacherSearch("");
    setFormError("");
    setShowModal(true);
  };

  const toggleMultiValue = (
    field: "teaching_subject_ids" | "department_ids" | "teacher_ids",
    id: number
  ) => {
    const current = form[field] ?? [];
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];

    setForm({ ...form, [field]: next });
  };

  const handleSave = async () => {
    if (!form.group_number?.trim()) {
      setFormError("Qrup nömrəsi tələb olunur");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload: StudentGroupPayload = {
      group_number: form.group_number.trim(),
      course: form.course ?? null,
      education_type: form.education_type ?? null,
      faculty_id: form.faculty_id ?? null,
      teaching_subject_ids: form.teaching_subject_ids ?? [],
      specialty_id: form.specialty_id ?? null,
      department_ids: form.department_ids ?? [],
      teacher_ids: form.teacher_ids ?? [],
    };

    delete payload.teaching_subject_id;
    delete payload.department_id;

    try {
      if (editId) {
        await studentGroupService.update(editId, payload);
      } else {
        await studentGroupService.create(payload);
      }

      setShowModal(false);
      await loadAll();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Yadda saxlamaq mümkün olmadı");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu qrupu silmək istəyirsiniz?")) return;

    try {
      await studentGroupService.delete(id);
      await loadAll();
    } catch {
      alert("Silinmə zamanı xəta baş verdi");
    }
  };

  const openStudentsModal = async (group: StudentGroup) => {
    setShowStudentsModal(true);
    setSelectedGroupName(group.group_number);
    setStudents([]);
    setStudentsTotal(0);
    setStudentsError("");
    setStudentsLoading(true);

    try {
      const res = await studentGroupService.getStudents(group.id);
      const list = Array.isArray(res?.data) ? res.data : [];
      setStudents(list);
      setStudentsTotal(Number.isFinite(res?.total) ? res.total : list.length);
    } catch {
      setStudentsError("Tələbələr yüklənmədi");
    } finally {
      setStudentsLoading(false);
    }
  };

  const filteredGroups = groups.filter((group) => {
    const groupMatch = group.group_number
      .toLowerCase()
      .includes(groupNumberFilter.toLowerCase().trim());

    const departmentText = [
      ...(group.department_names ?? []),
      group.department_name ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const departmentMatch = departmentText.includes(
      departmentListSearch.toLowerCase().trim()
    );

    return groupMatch && departmentMatch;
  });
  const expandedSubjectsGroup = filteredGroups.find(
    (group) => group.id === expandedSubjectsGroupId
  );
  const expandedSubjectsText = expandedSubjectsGroup
    ? expandedSubjectsGroup.teaching_subject_names?.length
      ? expandedSubjectsGroup.teaching_subject_names.join(", ")
      : expandedSubjectsGroup.teaching_subject_name || "-"
    : "";

  return (
    <>
      <PageMeta title="Qruplar | Performix" description="Tələbə qruplarının idarə edilməsi" />
      <PageBreadcrumb pageTitle="Qruplar" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Qruplar</h3>
          <button
            onClick={openCreate}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Qrup əlavə et
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

        {!loading && !error && groups.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Hələ qrup əlavə edilməyib.</p>
        )}

        {!loading && groups.length > 0 && (
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Qrup nömrəsinə görə filter
              </label>
              <input
                type="text"
                value={groupNumberFilter}
                onChange={(e) => setGroupNumberFilter(e.target.value)}
                placeholder="Məs: J-205"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Kafedraya görə axtarış
              </label>
              <input
                type="text"
                value={departmentListSearch}
                onChange={(e) => setDepartmentListSearch(e.target.value)}
                placeholder="Məs: Riyaziyyat"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setGroupNumberFilter("");
                  setDepartmentListSearch("");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Filterləri təmizlə
              </button>
            </div>
          </div>
        )}

        {!loading && groups.length > 0 && filteredGroups.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Filterə uyğun qrup tapılmadı.</p>
        )}

        {!loading && filteredGroups.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
            <div className="overflow-hidden">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-25 text-left text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <th className="w-1 whitespace-nowrap border-r border-gray-200 px-2 py-2 text-center dark:border-gray-700">ID</th>
                  <th className="w-1 whitespace-nowrap border-r border-gray-200 px-2 py-2 dark:border-gray-700">Qrup nömrəsi</th>
                  <th className="w-1 whitespace-nowrap border-r border-gray-200 px-2 py-2 text-center dark:border-gray-700">Kurs</th>
                  <th className="w-1 whitespace-nowrap border-r border-gray-200 px-2 py-2 dark:border-gray-700">Təhsil forması</th>
                  <th className="border-r border-gray-200 px-2 py-2 dark:border-gray-700">Fakültə</th>
                  <th className="border-r border-gray-200 px-2 py-2 dark:border-gray-700">Fənlər</th>
                  <th className="border-r border-gray-200 px-2 py-2 dark:border-gray-700">İxtisas</th>
                  <th className="border-r border-gray-200 px-2 py-2 dark:border-gray-700">Kafedralar</th>
                  <th className="w-1 whitespace-nowrap px-2 py-2 text-center">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="bg-white transition-colors hover:bg-gray-25 dark:bg-gray-900 dark:hover:bg-gray-800/70">
                    <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center font-medium text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      {group.id}
                    </td>
                    <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 font-medium text-gray-800 dark:border-gray-800 dark:text-white">
                      <span className="block truncate">{group.group_number}</span>
                    </td>
                    <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">{group.course ?? "-"}</td>
                    <td className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      {group.education_type === "EYANI"
                        ? "Əyani"
                        : group.education_type === "QIYABI"
                          ? "Qiyabi"
                          : "-"}
                    </td>
                    <td className="max-w-[150px] border-r border-gray-100 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      <span className="block truncate">{group.faculty_name || "-"}</span>
                    </td>
                    <td className="relative max-w-[180px] border-r border-gray-100 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      {(() => {
                        const subjectText = group.teaching_subject_names?.length
                          ? group.teaching_subject_names.join(", ")
                          : group.teaching_subject_name || "-";
                        const isExpanded = expandedSubjectsGroupId === group.id;

                        return (
                          <div className="flex min-w-0 items-center gap-1">
                            <span className="block min-w-0 flex-1 truncate">{subjectText}</span>
                            {subjectText !== "-" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSubjectsGroupId(isExpanded ? null : group.id)
                                }
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                aria-label="Fənləri tam göstər"
                              >
                                <IoIosMore className="text-lg" />
                              </button>
                            )}

                          </div>
                        );
                      })()}
                    </td>
                    <td className="max-w-[150px] border-r border-gray-100 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      <span className="block truncate">{group.specialty_name || "-"}</span>
                    </td>
                    <td className="max-w-[170px] border-r border-gray-100 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      <span className="block truncate">
                        {group.department_names?.length
                          ? group.department_names.join(", ")
                          : group.department_name || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        <button
                          onClick={() => openStudentsModal(group)}
                          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-theme-xs hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-900/60 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                        >
                          Tələbələr
                        </button>
                        <button
                          onClick={() => openEdit(group)}
                          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-theme-xs hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-900/60 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              {editId ? "Qrupu redaktə et" : "Yeni qrup əlavə et"}
            </h3>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Qrup nömrəsi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.group_number || ""}
                  onChange={(e) => setForm({ ...form, group_number: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: J-205.1"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Kurs</label>
                <input
                  type="number"
                  min={1}
                  value={form.course ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      course: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: 1"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Təhsil forması</label>
                <select
                  value={form.education_type ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      education_type: e.target.value ? (e.target.value as "EYANI" | "QIYABI") : null,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Seçin</option>
                  <option value="EYANI">Əyani</option>
                  <option value="QIYABI">Qiyabi</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Fakültə</label>
                <select
                  value={form.faculty_id ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      faculty_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Seçin</option>
                  {faculties.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">İxtisas</label>
                <select
                  value={form.specialty_id ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      specialty_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Seçin</option>
                  {specialties.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tədris edilən fənn</label>
                <div className="rounded-lg border border-gray-300 p-2 dark:border-gray-700">
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Fənn axtar..."
                    className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {subjects
                      .filter((item) =>
                        item.name.toLowerCase().includes(subjectSearch.toLowerCase())
                      )
                      .map((item) => {
                        const checked = (form.teaching_subject_ids ?? []).includes(item.id);
                        return (
                          <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMultiValue("teaching_subject_ids", item.id)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                          </label>
                        );
                      })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Seçilən: {(form.teaching_subject_ids ?? []).length}
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Kafedra</label>
                <div className="rounded-lg border border-gray-300 p-2 dark:border-gray-700">
                  <input
                    type="text"
                    value={departmentSearch}
                    onChange={(e) => setDepartmentSearch(e.target.value)}
                    placeholder="Kafedra axtar..."
                    className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {departments
                      .filter((item) =>
                        item.name.toLowerCase().includes(departmentSearch.toLowerCase())
                      )
                      .map((item) => {
                        const checked = (form.department_ids ?? []).includes(item.id);
                        return (
                          <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMultiValue("department_ids", item.id)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                          </label>
                        );
                      })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Seçilən: {(form.department_ids ?? []).length}
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Müəllimlər</label>
                <div className="rounded-lg border border-gray-300 p-2 dark:border-gray-700">
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Müəllim axtar..."
                    className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {teachers
                      .filter((teacher) => {
                        const fullName = `${teacher.last_name || ""} ${teacher.first_name || ""}`.toLowerCase();
                        return fullName.includes(teacherSearch.toLowerCase());
                      })
                      .map((teacher) => {
                        const checked = (form.teacher_ids ?? []).includes(teacher.id);
                        return (
                          <label key={teacher.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMultiValue("teacher_ids", teacher.id)}
                              className="h-4 w-4"
                            />
                            <UserAvatar
                              photo={teacher.photo}
                              name={`${teacher.last_name} ${teacher.first_name}`}
                              size="sm"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {teacher.last_name} {teacher.first_name}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Seçilən: {(form.teacher_ids ?? []).length}
                  </p>
                </div>
              </div>

              {formError && (
                <p className="md:col-span-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
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

      {expandedSubjectsGroup && expandedSubjectsText !== "-" && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/20 p-4"
          onClick={() => setExpandedSubjectsGroupId(null)}
        >
          <div
            className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700 shadow-theme-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                Fənlər
              </h4>
              <button
                type="button"
                onClick={() => setExpandedSubjectsGroupId(null)}
                className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Bağla
              </button>
            </div>
            <p>{expandedSubjectsText}</p>
          </div>
        </div>
      )}

      {showStudentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Qrup: {selectedGroupName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Ümumi tələbə sayı: <span className="font-semibold">{studentsTotal}</span>
                </p>
              </div>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Bağla
              </button>
            </div>

            {studentsLoading && (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Yüklənir...
              </div>
            )}

            {studentsError && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {studentsError}
              </p>
            )}

            {!studentsLoading && !studentsError && students.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bu qrupa aid tələbə yoxdur.
              </p>
            )}

            {!studentsLoading && students.length > 0 && (
              <div className="max-h-[380px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                      <th className="pb-2 pr-3 font-medium">Ad Soyad</th>
                      <th className="pb-2 pr-3 font-medium">FIN</th>
                      <th className="pb-2 pr-3 font-medium">Email</th>
                      <th className="pb-2 font-medium">Telefon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-2 pr-3 text-gray-800 dark:text-white">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              photo={student.photo}
                              name={`${student.first_name} ${student.last_name}`}
                              size="sm"
                            />
                            <span>
                              {[student.first_name, student.last_name]
                                .filter(Boolean)
                                .join(" ")}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{student.fin || "-"}</td>
                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{student.email || "-"}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{student.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
