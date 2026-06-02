import { useEffect, useMemo, useState } from "react";
import { BoxIconLine, GroupIcon } from "../../icons";
import { userManagementService, User } from "../../services/userService";

const matchesRole = (user: User, values: string[]) => {
  const roleValues = [user.role_code, user.role_name]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  return roleValues.some((roleValue) =>
    values.some((value) => roleValue.includes(value))
  );
};

export default function EcommerceMetrics() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    userManagementService
      .getAllUsers()
      .then((response) => {
        if (!isMounted) return;
        setUsers(Array.isArray(response?.data) ? response.data : []);
      })
      .catch(() => {
        if (isMounted) setUsers([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Ümumi tələbə qeydiyyatı",
        value: users.filter((user) =>
          matchesRole(user, ["student", "tələbə", "telebe"])
        ).length,
        icon: <GroupIcon className="size-6 text-gray-800 dark:text-white/90" />,
      },
      {
        label: "Müəllim qeydiyyatı",
        value: users.filter((user) =>
          matchesRole(user, ["teacher", "müəllim", "muellim"])
        ).length,
        icon: <BoxIconLine className="size-6 text-gray-800 dark:text-white/90" />,
      },
    ],
    [users]
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            {metric.icon}
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {metric.label}
            </span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {loading ? "..." : metric.value.toLocaleString("az-AZ")}
            </h4>
          </div>
        </div>
      ))}
    </div>
  );
}
