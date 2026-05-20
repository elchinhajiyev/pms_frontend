import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import accessRoleService, { AccessRole } from "../../services/accessRoleService";
import { userManagementService, User } from "../../services/userService";

const AccessRolesList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);

  const [showAccessRoleModal, setShowAccessRoleModal] = useState(false);
  const [editingAccessRole, setEditingAccessRole] = useState<AccessRole | null>(null);
  const [accessRoleForm, setAccessRoleForm] = useState({
    code: "",
    name: "",
    description: "",
    is_active: true,
  });
  const [accessRoleFormError, setAccessRoleFormError] = useState("");
  const [savingAccessRole, setSavingAccessRole] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersRes, rolesRes] = await Promise.all([
        userManagementService.getAllUsers(),
        accessRoleService.getAll(),
      ]);

      const usersData = Array.isArray(usersRes?.data)
        ? usersRes.data
        : Array.isArray(usersRes)
          ? usersRes
          : [];

      const rolesData = Array.isArray(rolesRes?.data)
        ? rolesRes.data
        : Array.isArray(rolesRes?.data?.data)
          ? rolesRes.data.data
          : Array.isArray(rolesRes)
            ? rolesRes
            : [];

      setUsers(usersData);
      setRoles(rolesData);
    } catch {
      setError("Məlumatlar yüklənmədi");
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleId(user.access_role_id?.toString() || "");
    setShowRoleModal(true);
  };

  const openCreateAccessRole = () => {
    setEditingAccessRole(null);
    setAccessRoleForm({
      code: "",
      name: "",
      description: "",
      is_active: true,
    });
    setAccessRoleFormError("");
    setShowAccessRoleModal(true);
  };

  const openEditAccessRole = (role: AccessRole) => {
    setEditingAccessRole(role);
    setAccessRoleForm({
      code: role.code || "",
      name: role.name || "",
      description: role.description || "",
      is_active: role.is_active,
    });
    setAccessRoleFormError("");
    setShowAccessRoleModal(true);
  };

  const handleSaveAccessRole = async () => {
    if (!accessRoleForm.code.trim() || !accessRoleForm.name.trim()) {
      setAccessRoleFormError("Kod və ad tələb olunur");
      return;
    }

    setSavingAccessRole(true);
    setAccessRoleFormError("");
    try {
      const payload = {
        code: accessRoleForm.code.trim().toUpperCase(),
        name: accessRoleForm.name.trim(),
        description: accessRoleForm.description.trim() || undefined,
        is_active: accessRoleForm.is_active,
      };

      if (editingAccessRole) {
        await accessRoleService.update(editingAccessRole.id, payload);
      } else {
        await accessRoleService.create(payload);
      }

      setShowAccessRoleModal(false);
      await loadAll();
    } catch (e: any) {
      setAccessRoleFormError(
        e?.response?.data?.message || "Rol saxlanılmadı"
      );
    } finally {
      setSavingAccessRole(false);
    }
  };

  const handleDeleteAccessRole = async (role: AccessRole) => {
    if (!confirm(`"${role.name}" rolunu silmək istəyirsiniz?`)) return;

    try {
      await accessRoleService.delete(role.id);
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Rol silinmədi");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setUpdatingRole(true);
    setError("");
    try {
      await userManagementService.updateUserRole(
        selectedUser.id,
        selectedRoleId ? Number(selectedRoleId) : null
      );
      setShowRoleModal(false);
      await loadAll();
    } catch {
      setError("İstifadəçi rolu yenilənmədi");
    } finally {
      setUpdatingRole(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(keyword) ||
      user.last_name.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.fin?.toLowerCase().includes(keyword)
    );
  });

  return (
    <>
      <PageMeta
        title="İcazələr | Performix"
        description="İstifadəçilər üçün icazə rollarının idarə edilməsi"
      />
      <PageBreadcrumb pageTitle="İcazələr" />

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              İcazə rolları ({roles.length})
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Yeni rol əlavə et, düzəlt və ya sil.
            </p>
          </div>
          <button
            onClick={openCreateAccessRole}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Yeni rol əlavə et
          </button>
        </div>

        {!loading && roles.length > 0 && (
          <div className="mb-8 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Kod</th>
                  <th className="px-4 py-3 font-medium">Ad</th>
                  <th className="px-4 py-3 font-medium">İstifadəçi sayı</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{role.code}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-white">
                      <div>{role.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {role.user_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {role.is_active ? "Aktiv" : "Deaktiv"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditAccessRole(role)}
                          className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDeleteAccessRole(role)}
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

        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Bütün istifadəçilər ({filteredUsers.length})
          </h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, soyad, e-poçt və ya FİN ilə axtar..."
            className="w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Ad, soyad</th>
                  <th className="pb-3 pr-4 font-medium">E-poçt</th>
                  <th className="pb-3 pr-4 font-medium">FİN</th>
                  <th className="pb-3 pr-4 font-medium">Mövcud rol</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          photo={user.photo}
                          name={`${user.last_name} ${user.first_name}`}
                        />
                        <span>
                          {user.last_name} {user.first_name}
                          {user.middle_name ? ` ${user.middle_name}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {user.email || "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-gray-600 dark:text-gray-400">
                      {user.fin || "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {user.role_name || "Rol təyin edilməyib"}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => openRoleModal(user)}
                        className="text-brand-500 hover:text-brand-700 dark:text-brand-400"
                      >
                        Rolu dəyiş
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              İstifadəçi rolunu dəyiş
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
                  Yeni rol
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Rol seçin</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Ləğv et
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={updatingRole}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {updatingRole ? "Yenilənir..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccessRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              {editingAccessRole ? "Rolu redaktə et" : "Yeni rol əlavə et"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kod <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accessRoleForm.code}
                  onChange={(e) => setAccessRoleForm({ ...accessRoleForm, code: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: SUPERADMIN"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accessRoleForm.name}
                  onChange={(e) => setAccessRoleForm({ ...accessRoleForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Məsələn: Super Admin"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Təsvir
                </label>
                <textarea
                  value={accessRoleForm.description}
                  onChange={(e) => setAccessRoleForm({ ...accessRoleForm, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Rolun qısa təsviri"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={accessRoleForm.is_active}
                  onChange={(e) => setAccessRoleForm({ ...accessRoleForm, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Aktiv olsun
              </label>

              {accessRoleFormError && (
                <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {accessRoleFormError}
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowAccessRoleModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Ləğv et
              </button>
              <button
                onClick={handleSaveAccessRole}
                disabled={savingAccessRole}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {savingAccessRole ? "Yadda saxlanılır..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccessRolesList;
