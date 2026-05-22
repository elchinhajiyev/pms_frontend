import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAvatar from "../../components/common/UserAvatar";
import { TrashBinIcon } from "../../icons";
import { groupMemberService, GroupMember } from "../../services/activityService";
import { employeeGroupService, EmployeeGroup } from "../../services/evaluationService";
import accessRoleService, { AccessRole } from "../../services/accessRoleService";

const isStudentRole = (role: AccessRole) => {
  const values = [role.code, role.name, role.name_en]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return values.some(
    (value) =>
      value.includes("student") ||
      value.includes("tələbə") ||
      value.includes("telebe")
  );
};

export default function GroupMembers() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<EmployeeGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [unassigned, setUnassigned] = useState<GroupMember[]>([]);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [groupRes, membersRes, rolesRes] = await Promise.all([
        employeeGroupService.getById(Number(id)),
        groupMemberService.getMembers(Number(id)),
        accessRoleService.getAll(),
      ]);
      setGroup(groupRes.data);
      setMembers(membersRes.data || []);
      setRoles((rolesRes.data?.data || []).filter((role: AccessRole) => !isStudentRole(role)));
      setUnassigned([]);
      setSelectedUserIds([]);
      setUserSearch("");
    } catch {
      setError("Məlumatlar yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  useEffect(() => {
    const loadUsersByRole = async () => {
      setSelectedUserIds([]);
      setUserSearch("");

      if (!selectedRoleId) {
        setUnassigned([]);
        return;
      }

      try {
        setUsersLoading(true);
        const res = await groupMemberService.getUsersWithoutGroup(Number(selectedRoleId));
        setUnassigned(res.data || []);
      } catch {
        setUnassigned([]);
        setError("Seçilmiş rola aid istifadəçilər yüklənmədi");
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsersByRole();
  }, [selectedRoleId]);

  const handleAddMultiple = async () => {
    if (selectedUserIds.length === 0 || !id) return;
    setAdding(true);
    try {
      // Add each user to the group
      await Promise.all(
        selectedUserIds.map((userId) =>
          groupMemberService.updateUserGroup(userId, Number(id))
        )
      );
      setSelectedUserIds([]);
      const res = selectedRoleId
        ? await groupMemberService.getUsersWithoutGroup(Number(selectedRoleId))
        : { data: [] };
      setUnassigned(res.data || []);
      const membersRes = await groupMemberService.getMembers(Number(id));
      setMembers(membersRes.data || []);
    } catch {
      setError("İstifadəçilər əlavə edilmədi");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!confirm("Bu istifadəçini qrupdan çıxarmaq istəyirsiniz?")) return;
    try {
      await groupMemberService.updateUserGroup(userId, null);
      const [membersRes, unassignedRes] = await Promise.all([
        groupMemberService.getMembers(Number(id)),
        selectedRoleId
          ? groupMemberService.getUsersWithoutGroup(Number(selectedRoleId))
          : Promise.resolve({ data: [] }),
      ]);
      setMembers(membersRes.data || []);
      setUnassigned(unassignedRes.data || []);
    } catch {
      setError("Xəta baş verdi");
    }
  };

  const filteredUnassigned = unassigned.filter((user) => {
    const haystack = [
      user.last_name,
      user.first_name,
      user.middle_name,
      user.email,
      user.fin,
      user.role_name,
      user.role_code,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(userSearch.trim().toLowerCase());
  });

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllFilteredUsers = () => {
    const filteredIds = filteredUnassigned.map((user) => user.id);
    const allFilteredSelected =
      filteredIds.length > 0 &&
      filteredIds.every((userId) => selectedUserIds.includes(userId));

    if (allFilteredSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((userId) => !filteredIds.includes(userId))
      );
      return;
    }

    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  return (
    <>
      <PageMeta
        title={`Qrup üzvləri | Performix`}
        description=""
      />
      <PageBreadcrumb
        pageTitle={group ? `"${group.name}" — üzvlər` : "Qrup üzvləri"}
      />

      <div className="space-y-6">
        {/* Back button */}
        <div>
          <button
            onClick={() => navigate("/employee-groups")}
            className="text-sm text-brand-500 hover:underline"
          >
            ← İşçi qruplarına qayıt
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

        {!loading && (
          <>
            {/* Add member */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">
                İstifadəçi əlavə et
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rol seçin
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    disabled={adding}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-700"
                  >
                    <option value="">Rol seçin</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} ({role.code})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedRoleId ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    İstifadəçi siyahısını görmək üçün əvvəl rol seçin.
                  </p>
                ) : usersLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    İstifadəçilər yüklənir...
                  </p>
                ) : unassigned.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Seçilmiş rola aid qrupsuz istifadəçi yoxdur.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ada görə axtar
                      </label>
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        disabled={adding}
                        placeholder="Ad, soyad, e-poçt və ya FİN yazın..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-700"
                      />
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={
                              filteredUnassigned.length > 0 &&
                              filteredUnassigned.every((user) =>
                                selectedUserIds.includes(user.id)
                              )
                            }
                            onChange={toggleAllFilteredUsers}
                            disabled={adding || filteredUnassigned.length === 0}
                            className="h-5 w-5"
                          />
                          Hamısını seç
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Seçilən: {selectedUserIds.length}
                        </span>
                      </div>

                      {filteredUnassigned.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                          Axtarışa uyğun istifadəçi tapılmadı.
                        </p>
                      ) : (
                        <div className="max-h-72 overflow-y-auto p-3">
                          {filteredUnassigned.map((user) => (
                            <label
                              key={user.id}
                              className="flex cursor-pointer items-start gap-3 rounded px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => toggleUser(user.id)}
                                disabled={adding}
                                className="mt-0.5 h-5 w-5"
                              />
                              <UserAvatar
                                photo={user.photo}
                                name={`${user.last_name} ${user.first_name}`}
                                size="sm"
                              />
                              <span className="min-w-0 text-sm text-gray-800 dark:text-white">
                                <span className="block font-medium">
                                  {user.last_name} {user.first_name}
                                  {user.middle_name ? ` ${user.middle_name}` : ""}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                  {[user.email, user.fin, user.role_name]
                                    .filter(Boolean)
                                    .join(" | ") || "Əlavə məlumat yoxdur"}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAddMultiple}
                      disabled={selectedUserIds.length === 0 || adding}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      {adding
                        ? `Əlavə edilir (${selectedUserIds.length})...`
                        : `Əlavə et (${selectedUserIds.length})`}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Members list */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Qrup üzvləri ({members.length})
                </h3>
              </div>

              {members.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bu qrupda hələ üzv yoxdur.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
                  <div className="overflow-visible">
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-25 text-left text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <th className="w-[28%] border-r border-gray-200 px-4 py-2 dark:border-gray-700">Üzv</th>
                          <th className="w-[26%] border-r border-gray-200 px-4 py-2 dark:border-gray-700">E-poçt</th>
                          <th className="w-[20%] border-r border-gray-200 px-4 py-2 dark:border-gray-700">Rol</th>
                          <th className="w-[12%] border-r border-gray-200 px-4 py-2 dark:border-gray-700">FİN</th>
                          <th className="w-[14%] px-4 py-2 text-right">Əməliyyat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {members.map((m) => (
                          <tr
                            key={m.id}
                            className="bg-white transition-colors hover:bg-gray-25 dark:bg-gray-900 dark:hover:bg-gray-800/70"
                          >
                            <td className="border-r border-gray-100 px-4 py-1.5 text-gray-800 dark:border-gray-800 dark:text-white">
                              <div className="flex items-center gap-3">
                                <UserAvatar
                                  photo={m.photo}
                                  name={`${m.last_name} ${m.first_name}`}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <span className="block truncate font-medium text-gray-800 dark:text-white">
                                    {m.last_name} {m.first_name}
                                    {m.middle_name ? ` ${m.middle_name}` : ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="border-r border-gray-100 px-4 py-1.5 text-gray-600 dark:border-gray-800 dark:text-gray-400">
                              <span className="block truncate">{m.email || "—"}</span>
                            </td>
                            <td className="border-r border-gray-100 px-4 py-1.5 dark:border-gray-800">
                              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-success-300" />
                                <span className="truncate">{m.role_name || "—"}</span>
                              </span>
                            </td>
                            <td className="border-r border-gray-100 px-4 py-1.5 font-mono text-gray-600 dark:border-gray-800 dark:text-gray-400">
                              {m.fin || "—"}
                            </td>
                            <td className="px-4 py-1.5 text-right">
                              <button
                                onClick={() => handleRemove(m.id)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-theme-xs hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-red-900/60 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                aria-label={`${m.last_name} ${m.first_name} qrupdan çıxar`}
                              >
                                <TrashBinIcon className="size-4 fill-current" />
                                <span>Çıxar</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
