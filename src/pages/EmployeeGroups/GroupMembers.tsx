import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import MultiSelect from "../../components/ui/MultiSelect";
import { groupMemberService, GroupMember } from "../../services/activityService";
import { employeeGroupService, EmployeeGroup } from "../../services/evaluationService";

export default function GroupMembers() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<EmployeeGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [unassigned, setUnassigned] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [groupRes, membersRes, unassignedRes] = await Promise.all([
        employeeGroupService.getById(Number(id)),
        groupMemberService.getMembers(Number(id)),
        groupMemberService.getUsersWithoutGroup(),
      ]);
      setGroup(groupRes.data);
      setMembers(membersRes.data || []);
      setUnassigned(unassignedRes.data || []);
    } catch {
      setError("Məlumatlar yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

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
      loadAll();
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
      loadAll();
    } catch {
      setError("Xəta baş verdi");
    }
  };

  const multiSelectOptions = unassigned.map((u) => ({
    id: u.id,
    label: `${u.last_name} ${u.first_name}${u.email ? ` (${u.email})` : ""}`,
  }));

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
              {unassigned.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Qrupsuz istifadəçi yoxdur.
                </p>
              ) : (
                <div className="space-y-3">
                  <MultiSelect
                    options={multiSelectOptions}
                    selected={selectedUserIds}
                    onChange={setSelectedUserIds}
                    placeholder="İstifadəçilər seçin (ada görə axtarış edə bilərsiniz)..."
                    disabled={adding}
                  />
                  <button
                    onClick={handleAddMultiple}
                    disabled={selectedUserIds.length === 0 || adding}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {adding
                      ? `Əlavə edilir (${selectedUserIds.length})...`
                      : `Əlavə et (${selectedUserIds.length})`}
                  </button>
                  {selectedUserIds.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedUserIds.length} istifadəçi seçildi
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Members list */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">
                Qrup üzvləri ({members.length})
              </h3>

              {members.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bu qrupda hələ üzv yoxdur.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                        <th className="pb-3 pr-4 font-medium">Soyad, ad</th>
                        <th className="pb-3 pr-4 font-medium">E-poçt</th>
                        <th className="pb-3 pr-4 font-medium">FİN</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="py-3 pr-4 text-gray-800 dark:text-white">
                            {m.last_name} {m.first_name}
                            {m.middle_name ? ` ${m.middle_name}` : ""}
                          </td>
                          <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                            {m.email || "—"}
                          </td>
                          <td className="py-3 pr-4 font-mono text-gray-600 dark:text-gray-400">
                            {m.fin || "—"}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleRemove(m.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Çıxar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
