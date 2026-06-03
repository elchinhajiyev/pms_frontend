import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import commissionService, {
  Commission,
  COMMISSION_PERMISSION_OPTIONS,
} from "../../services/commissionService";
import { userManagementService, User } from "../../services/userService";

const userFullName = (user: User) =>
  [user.first_name, user.last_name, user.middle_name].filter(Boolean).join(" ");

export default function CommissionsList() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCommission = useMemo(
    () => commissions.find((item) => item.id === selectedId) || null,
    [commissions, selectedId]
  );

  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [userFullName(user), user.email, user.fin]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [users, userSearch]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [commissionRes, userRes] = await Promise.all([
        commissionService.getAll(),
        userManagementService.getAllUsers(),
      ]);
      const nextCommissions = Array.isArray(commissionRes?.data) ? commissionRes.data : [];
      setCommissions(nextCommissions);
      setUsers(Array.isArray(userRes?.data) ? userRes.data : []);

      if (!selectedId && nextCommissions[0]) {
        openCommission(nextCommissions[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Komissiyalar yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCommission = (commission: Commission) => {
    setSelectedId(commission.id);
    setName(commission.name || "");
    setMemberIds((commission.members || []).map((member) => member.id));
    setPermissionKeys(commission.permission_keys || []);
    setError("");
  };

  const openCreate = () => {
    setSelectedId(null);
    setName("");
    setMemberIds([]);
    setPermissionKeys([]);
    setUserSearch("");
    setError("");
  };

  const toggleMember = (userId: number) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const togglePermission = (key: string) => {
    setPermissionKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Komissiya adı tələb olunur");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const commission = selectedId
        ? (await commissionService.update(selectedId, name.trim())).data
        : (await commissionService.create(name.trim())).data;

      await commissionService.setMembers(commission.id, memberIds);
      await commissionService.setPermissions(commission.id, permissionKeys);
      await load();
      setSelectedId(commission.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Komissiya saxlanılmadı");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (commission: Commission) => {
    if (!confirm(`"${commission.name}" komissiyasını silmək istəyirsiniz?`)) return;
    try {
      await commissionService.delete(commission.id);
      openCreate();
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Komissiya silinmədi");
    }
  };

  return (
    <>
      <PageMeta title="Komissiyalar | Performix" description="Komissiyaların idarə olunması" />
      <PageBreadcrumb pageTitle="Komissiyalar" />

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">Komissiyalar</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{commissions.length} komissiya</p>
            </div>
            <button
              onClick={openCreate}
              className="rounded-md bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
            >
              Yeni
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Yüklənir...</p>
          ) : commissions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Komissiya yoxdur.</p>
          ) : (
            <div className="space-y-2">
              {commissions.map((commission) => (
                <button
                  key={commission.id}
                  onClick={() => openCommission(commission)}
                  className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
                    selectedId === commission.id
                      ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="block font-medium">{commission.name}</span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {commission.members?.length || 0} üzv, {commission.permission_keys?.length || 0} icazə
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                {selectedCommission ? "Komissiyanı redaktə et" : "Komissiya yarat"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Üzvlər yalnız icazə verilən alt bölmələrdə təsdiq və imtina verə bilər.
              </p>
            </div>
            {selectedCommission && (
              <button
                onClick={() => handleDelete(selectedCommission)}
                className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
              >
                Sil
              </button>
            )}
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Komissiya adı</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Komissiya adını yazın"
                />
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">İcra mexanizmi</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COMMISSION_PERMISSION_OPTIONS.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={permissionKeys.includes(option.key)}
                        onChange={() => togglePermission(option.key)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Komissiya üzvləri</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Seçilən: {memberIds.length}</p>
                </div>
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  className="h-9 w-56 rounded-md border border-gray-300 px-3 text-xs outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Üzv axtar..."
                />
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-md border border-gray-200 dark:border-gray-800">
                {filteredUsers.map((user) => {
                  const checked = memberIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(user.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <UserAvatar photo={user.photo} name={userFullName(user)} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-gray-800 dark:text-gray-100">{userFullName(user)}</span>
                        <span className="block truncate text-xs text-gray-500">{user.email || user.fin || "-"}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Yadda saxlanılır..." : "Yadda saxla"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
