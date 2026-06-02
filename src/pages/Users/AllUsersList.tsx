import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import { CheckCircleIcon, TrashBinIcon } from "../../icons";
import { userManagementService, userStatusService, User, UserStatus } from "../../services/userService";

export default function AllUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [teacherFilter, setTeacherFilter] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [usersRes, statusesRes] = await Promise.all([
        userManagementService.getAllUsers(),
        userStatusService.getAll(),
      ]);
      setUsers(usersRes.data || []);
      setStatuses(statusesRes.data || []);
    } catch {
      setError("Məlumatlar yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openStatusModal = (user: User) => {
    setSelectedUser(user);
    setSelectedStatusId(user.status_id?.toString() || "");
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      await userManagementService.updateUserStatus(
        selectedUser.id,
        selectedStatusId ? Number(selectedStatusId) : null
      );
      setShowStatusModal(false);
      loadAll();
    } catch {
      setError("Status yenilənmədi");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    const userFullName = `${user.last_name} ${user.first_name}`.trim();
    if (!confirm(`"${userFullName}" istifadəçisini silmək istəyirsiniz?`)) return;

    setDeletingUserId(user.id);
    setError("");
    try {
      await userManagementService.deleteUser(user.id);
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || "İstifadəçi silinmədi");
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = search.trim().toLowerCase();
    const roleMatch =
      roleFilter === "ALL" || String(user.role_code || "").toUpperCase() === roleFilter;
    const teacherMatch =
      !teacherFilter.trim() ||
      `${user.last_name || ""} ${user.first_name || ""}`
        .toLowerCase()
        .includes(teacherFilter.trim().toLowerCase());
    const searchMatch =
      !searchLower ||
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.fin?.toLowerCase().includes(searchLower);

    if (!roleMatch || !searchMatch) return false;

    if (roleFilter === "TEACHER") {
      return teacherMatch;
    }

    return true;
  });

  const roleOptions = Array.from(
    new Map(
      users
        .filter((u) => u.role_code)
        .map((u) => [String(u.role_code).toUpperCase(), u.role_name || u.role_code || "-"])
    ).entries()
  );

  return (
    <>
      <PageMeta title="Üzvlər | Performix" description="" />
      <PageBreadcrumb pageTitle="Üzvlər" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Bütün istifadəçilər ({filteredUsers.length})
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad, soyad, e-poçt və ya FİN ilə axtar..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:w-80"
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                const nextRole = e.target.value;
                setRoleFilter(nextRole);
                if (nextRole !== "TEACHER") {
                  setTeacherFilter("");
                }
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="ALL">Bütün rollar</option>
              {roleOptions.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            {roleFilter === "TEACHER" && (
              <input
                type="text"
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                placeholder="Müəllim adına görə filter..."
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            )}
          </div>
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

        {!loading && filteredUsers.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {search
              ? "Axtarışa uyğun istifadəçi tapılmadı."
              : "Heç bir istifadəçi yoxdur."}
          </p>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
            <div className="overflow-x-auto lg:overflow-hidden">
            <table className="min-w-[860px] table-auto text-sm lg:w-full lg:min-w-0">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-25 text-left text-xs font-normal text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <th className="border-r border-gray-200 px-4 py-2 font-normal dark:border-gray-700">Üzv</th>
                  <th className="border-r border-gray-200 px-4 py-2 font-normal dark:border-gray-700">E-poçt</th>
                  <th className="border-r border-gray-200 px-4 py-2 font-normal dark:border-gray-700">FİN</th>
                  <th className="border-r border-gray-200 px-4 py-2 font-normal dark:border-gray-700">Telefon</th>
                  <th className="border-r border-gray-200 px-4 py-2 font-normal dark:border-gray-700">Qrup</th>
                  <th className="w-1 whitespace-nowrap border-r border-gray-200 px-4 py-2 text-center font-normal dark:border-gray-700">Rol</th>
                  <th className="w-1 whitespace-nowrap px-4 py-2 text-center font-normal">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="bg-white transition-colors hover:bg-gray-25 dark:bg-gray-900 dark:hover:bg-gray-800/70"
                  >
                    <td className="border-r border-gray-100 px-4 py-1.5 text-gray-800 dark:border-gray-800 dark:text-white">
                      <div className="flex items-center gap-3">
                    <UserAvatar
                      photo={user.photo}
                      name={[user.first_name, user.last_name, user.middle_name]
                        .filter(Boolean)
                        .join(" ")}
                      size="sm"
                    />
                    <span className="block min-w-0 truncate font-normal">
                        {user.first_name} {user.last_name}
                        {user.middle_name ? ` ${user.middle_name}` : ""}
                      </span>
                      </div>
                    </td>
                    <td className="border-r border-gray-100 px-4 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      <span className="block truncate">{user.email || "—"}</span>
                    </td>
                    <td className="whitespace-nowrap border-r border-gray-100 px-4 py-1.5 font-mono text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      {user.fin || "—"}
                    </td>
                    <td className="whitespace-nowrap border-r border-gray-100 px-4 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      {user.phone || "—"}
                    </td>
                    <td className="border-r border-gray-100 px-4 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      <span className="block truncate">{user.group_name || "—"}</span>
                    </td>
                    <td className="whitespace-nowrap border-r border-gray-100 px-4 py-1.5 text-center dark:border-gray-800">
                      <span className="inline-flex items-center justify-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-normal text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700">
                        {user.role_name || user.role_code || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-1.5 text-center">
                      <div className="inline-flex items-center justify-center gap-2">
                        <button
                          onClick={() => openStatusModal(user)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-normal text-gray-700 shadow-theme-xs hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-900/60 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
                        >
                          <CheckCircleIcon className="size-4 fill-current" />
                          <span>Status</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={deletingUserId === user.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-normal text-gray-700 shadow-theme-xs hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-red-900/60 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        >
                          <TrashBinIcon className="size-4 fill-current" />
                          <span>{deletingUserId === user.id ? "Silinir..." : "Sil"}</span>
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

      {/* Status Modal */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              Təhsil statusu dəyiş
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  İstifadəçi
                </label>
                <p className="text-sm text-gray-800 dark:text-white">
                  {selectedUser.last_name} {selectedUser.first_name}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yeni təhsil statusu
                </label>
                <select
                  value={selectedStatusId}
                  onChange={(e) => setSelectedStatusId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Status seçin</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name} ({status.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Ləğv et
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {updating ? "Yenilənir..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
