import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-8 font-medium">Qrup nömrəsi</th>
                  <th className="pb-3 pr-4 font-medium">Kurs</th>
                  <th className="pb-3 pr-4 font-medium">Təhsil forması</th>
                  <th className="pb-3 pr-4 font-medium">Fakültə</th>
                  <th className="pb-3 pr-4 font-medium">Fənlər</th>
                  <th className="pb-3 pr-4 font-medium">İxtisas</th>
                  <th className="pb-3 pr-4 font-medium">Kafedralar</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          ID {group.id}
                        </span>
                        <span>{group.group_number}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{group.course ?? "-"}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {group.education_type === "EYANI"
                        ? "Əyani"
                        : group.education_type === "QIYABI"
                          ? "Qiyabi"
                          : "-"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{group.faculty_name || "-"}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {group.teaching_subject_names?.length
                        ? group.teaching_subject_names.join(", ")
                        : group.teaching_subject_name || "-"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{group.specialty_name || "-"}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {group.department_names?.length
                        ? group.department_names.join(", ")
                        : group.department_name || "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openStudentsModal(group)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Tələbələr
                        </button>
                        <button
                          onClick={() => openEdit(group)}
                          className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
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
                          {[student.first_name, student.last_name]
                            .filter(Boolean)
                            .join(" ")}
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
