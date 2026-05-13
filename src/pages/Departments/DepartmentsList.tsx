import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import departmentService, {
  Department,
  DepartmentMember,
  DepartmentCategory,
  DepartmentActivity,
} from "../../services/departmentService";
import { userManagementService, User } from "../../services/userService";
import Combobox from "../../components/common/Combobox";
import { activityService, Activity } from "../../services/activityService";
import { FiTrash2, FiUser, FiUsers, FiList, FiTag, FiActivity } from "react-icons/fi";

const emptyForm = {
  name: "",
  head_user_id: null as number | null,
};

export default function DepartmentsList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<DepartmentCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");

  const categoryTabs = useMemo(() => {
    const tabs = categories.map((category) => ({
      id: `category-${category.id}`,
      label: category.name,
      categoryId: category.id,
    }))

    tabs.push({
      id: "uncategorized",
      label: "Departament",
      categoryId: -1,
    })

    return tabs
  }, [categories])

  const activeDepartments = useMemo(() => {
    if (!activeTab) return []

    if (activeTab === "uncategorized") {
      return filteredDepartments.filter(
        (department) => !department.categories?.length
      )
    }

    const categoryId = Number(activeTab.replace("category-", ""))
    if (categoryId === -1) {
      return filteredDepartments.filter(
        (department) => !department.categories?.length
      )
    }
    return filteredDepartments.filter((department) =>
      department.categories?.some((category) => category.id === categoryId)
    )
  }, [activeTab, filteredDepartments])

  useEffect(() => {
    if (activeTab) {
      if (
        activeTab.startsWith("category-") &&
        !categories.some((category) => activeTab === `category-${category.id}`)
      ) {
        setActiveTab(
          categories.length > 0 ? `category-${categories[0].id}` : "uncategorized"
        )
      }

      return
    }

    setActiveTab(
      categories.length > 0 ? `category-${categories[0].id}` : "uncategorized"
    )
  }, [categories, activeTab])

  const load = async () => {
    try {
      setLoading(true);
      const [depRes, usersRes, activityRes] = await Promise.all([
        departmentService.getAll(),
        userManagementService.getAllUsers(),
        activityService.getAll(),
      ]);
      const categoryRes = await departmentService.getCategories();
      const depts = depRes.data || [];
      setDepartments(depts);
      setFilteredDepartments(depts);
      setUsers(usersRes.data || []);
      setActivities(activityRes.data || []);
      setCategories(categoryRes.data || []);
    } catch {
      setError("Departamentlər yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const filtered = departments
      .filter((dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    setFilteredDepartments(filtered);
  }, [searchTerm, departments]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setSelectedMemberIds([]);
    setSelectedCategoryIds([]);
    setSelectedActivityIds([]);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = async (department: Department) => {
    setEditId(department.id);
    setForm({
      name: department.name,
      head_user_id: department.head_user_id || null
    });
    setFormError("");
    setLoadingMembers(true);
    try {
      const [membersRes, categoryRelationsRes, activityRelationsRes] = await Promise.all([
        departmentService.getMembers(department.id),
        departmentService.getDepartmentCategories(department.id),
        departmentService.getDepartmentActivities(department.id),
      ]);
      const memberList = membersRes.data || [];
      setSelectedMemberIds(memberList.map((m: DepartmentMember) => m.id));
      setSelectedCategoryIds((categoryRelationsRes.data || []).map((c: DepartmentCategory) => c.id));
      setSelectedActivityIds((activityRelationsRes.data || []).map((a: DepartmentActivity) => a.id));
    } catch {
      setFormError("Məlumatlar yüklənmədi");
    } finally {
      setLoadingMembers(false);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Departament adı tələb olunur");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editId) {
        await departmentService.update(editId, {
          name: form.name.trim(),
          head_user_id: form.head_user_id,
          category_ids: selectedCategoryIds,
          activity_ids: selectedActivityIds,
        });
        // Update members
        await departmentService.setMembers(editId, selectedMemberIds);
      } else {
        const res = await departmentService.create({
          name: form.name.trim(),
          head_user_id: form.head_user_id,
          category_ids: selectedCategoryIds,
          activity_ids: selectedActivityIds,
        });
        if (res.data && selectedMemberIds.length > 0) {
          await departmentService.setMembers(res.data.id, selectedMemberIds);
        }
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Yadda saxlamaq mümkün olmadı");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryError("Kateqoriya adı tələb olunur");
      return;
    }

    setCreatingCategory(true);
    setCategoryError("");
    try {
      await departmentService.createCategory(newCategoryName.trim());
      setNewCategoryName("");
      const categoryRes = await departmentService.getCategories();
      setCategories(categoryRes.data || []);
    } catch (e: any) {
      setCategoryError(e?.response?.data?.message || "Kateqoriya əlavə edilmədi");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: DepartmentCategory) => {
    if (!confirm(`"${category.name}" kateqoriyasını silmək istəyirsiniz?`)) {
      return;
    }

    setCategoryError("");
    try {
      await departmentService.deleteCategory(category.id);
      const categoryRes = await departmentService.getCategories();
      const nextCategories = categoryRes.data || [];
      setCategories(nextCategories);
      setSelectedCategoryIds((prev) => prev.filter((id) => id !== category.id));
    } catch (e: any) {
      setCategoryError(e?.response?.data?.message || "Kateqoriya silinmədi");
    }
  };

  const toggleCategory = (categoryId: number) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
      return;
    }
    setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu departamenti silmək istəyirsiniz?")) return;

    try {
      await departmentService.delete(id);
      await load();
    } catch {
      alert("Silinmə zamanı xəta baş verdi");
    }
  };

  const getHeadUserName = (dept: Department) => {
    return dept.head_user?.full_name || "-";
  };

  return (
    <>
      <PageMeta title="Departament | Performix" description="Departamentlərin idarə edilməsi" />
      <PageBreadcrumb pageTitle="Departament" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <details className="mb-6 rounded-md border border-gray-200 dark:border-gray-700">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-4 text-base font-semibold text-gray-800 dark:text-white">
          <span>Kateqoriya siyahısı</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Aç / Bağla
          </span>
        </summary>
        <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Yeni kateqoriya adı"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <button
              onClick={handleCreateCategory}
              disabled={creatingCategory}
              className="whitespace-nowrap rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {creatingCategory ? "Əlavə olunur..." : "+ Kateqoriya əlavə et"}
            </button>
          </div>
          {categoryError && (
            <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {categoryError}
            </p>
          )}
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Kateqoriya yoxdur</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  <span>{category.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                    aria-label={`${category.name} kateqoriyasını sil`}
                    title="Sil"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Departamentlər
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Ada görə axtarış..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <button
              onClick={openCreate}
              className="whitespace-nowrap rounded-sm bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              + əlavə et
            </button>
          </div>
        </div>

        {categoryTabs.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-brand-500 text-white border-transparent"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

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

        {!loading && !error && activeDepartments.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? "Heç bir departament tapılmadı." : "Bu kateqoriya üçün departament yoxdur."}
          </p>
        )}

        {!loading && activeDepartments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium w-12">#</th>
                  <th className="pb-3 pr-4 font-medium">Departament adı</th>
                  <th className="pb-3 pr-4 font-medium">Üzv sayı</th>
                  <th className="pb-3 pr-4 font-medium">Məsul şəxs</th>
                  <th className="pb-3 font-medium">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {activeDepartments.map((department, index) => (
                  <tr key={department.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300 font-medium text-center">{index + 1}</td>
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">{department.name}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                      {department.member_count || 0}
                    </td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                      {getHeadUserName(department)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(department)}
                          className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(department.id)}
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
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[80vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              {editId ? "Departamenti redaktə et" : "Yeni departament əlavə et"}
            </h3>

            <div className="space-y-4 pr-1">
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FiTag className="text-brand-500" />
                  Departament adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: Kompüter Elmləri"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FiUser className="text-brand-500" />
                  Məsul şəxs
                </label>
                <Combobox
                  items={users.map(u => ({
                    label: u.first_name + (u.last_name ? ` ${u.last_name}` : ''),
                    value: u.id
                  }))}
                  value={form.head_user_id}
                  onChange={(value: number | string | null) =>
                    setForm({
                      ...form,
                      head_user_id: typeof value === "number" ? value : null,
                    })
                  }
                  placeholder="Məsul şəxsi seçin..."
                  searchPlaceholder="Axtarış..."
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FiList className="text-brand-500" />
                  Kateqoriyalar
                </label>
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kateqoriya yoxdur. Yuxarıdakı siyahıdan əlavə edin.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FiUsers className="text-brand-500" />
                  Üzvlər
                </label>
                {loadingMembers ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Combobox
                      items={users.map(u => ({
                        label: u.first_name + (u.last_name ? ` ${u.last_name}` : ''),
                        value: u.id
                      }))}
                      value={selectedMemberIds.length === 1 ? selectedMemberIds[0] : null}
                      selectedValues={selectedMemberIds}
                      closeOnSelect={false}
                      onChange={(value: number | string | null) => {
                        if (typeof value === "number") {
                          if (selectedMemberIds.includes(value)) {
                            setSelectedMemberIds(selectedMemberIds.filter((id) => id !== value));
                          } else {
                            setSelectedMemberIds([...selectedMemberIds, value]);
                          }
                        }
                      }}
                      placeholder="Üzv əlavə et..."
                      searchPlaceholder="Axtarış..."
                    />
                    {selectedMemberIds.length > 0 && (
                      <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="border-b border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          Seçilən üzvlər ({selectedMemberIds.length})
                        </div>
                        <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                          {selectedMemberIds.map((userId) => {
                            const user = users.find(u => u.id === userId);
                            return (
                              <li
                                key={userId}
                                className="flex items-center justify-between px-3 py-2 text-sm"
                              >
                                <span className="text-gray-800 dark:text-gray-200">
                                  {user?.first_name} {user?.last_name}
                                </span>
                                <button
                                  onClick={() =>
                                    setSelectedMemberIds(
                                      selectedMemberIds.filter(id => id !== userId)
                                    )
                                  }
                                  className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                  Sil
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FiActivity className="text-brand-500" />
                  Fəaliyyətlər
                </label>
                <div className="space-y-2">
                  <Combobox
                    items={[...activities]
                      .sort((a, b) => {
                        if (!a.created_at || !b.created_at) return 0;
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                      })
                      .map((activity) => ({
                        label: activity.name,
                        value: activity.id,
                      }))}
                    value={selectedActivityIds.length === 1 ? selectedActivityIds[0] : null}
                    selectedValues={selectedActivityIds}
                    closeOnSelect={false}
                    onChange={(value: number | string | null) => {
                      if (typeof value === "number") {
                        if (selectedActivityIds.includes(value)) {
                          setSelectedActivityIds(selectedActivityIds.filter((id) => id !== value));
                        } else {
                          setSelectedActivityIds([...selectedActivityIds, value]);
                        }
                      }
                    }}
                    placeholder="Fəaliyyət əlavə et..."
                    searchPlaceholder="Axtarış..."
                  />
                  {selectedActivityIds.length > 0 && (
                    <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="border-b border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        Seçilən fəaliyyətlər ({selectedActivityIds.length})
                      </div>
                      <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                        {[...selectedActivityIds]
                          .map((activityId) => activities.find((a) => a.id === activityId))
                          .filter((activity): activity is Activity => activity !== undefined)
                          .sort((a, b) => {
                            if (!a.created_at || !b.created_at) return 0;
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                          })
                          .map((activity) => ({
                            activityId: activity.id,
                            activity: activity,
                          }))
                          .map(({ activityId, activity }) => {
                          return (
                            <li
                              key={activityId}
                              className="flex items-center justify-between px-3 py-2 text-sm"
                            >
                              <span className="text-gray-800 dark:text-gray-200">
                                {activity?.name || "-"}
                              </span>
                              <button
                                onClick={() =>
                                  setSelectedActivityIds(
                                    selectedActivityIds.filter((id) => id !== activityId)
                                  )
                                }
                                className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                Sil
                              </button>
                            </li>
                          );
                        })}
                      </ul>
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
