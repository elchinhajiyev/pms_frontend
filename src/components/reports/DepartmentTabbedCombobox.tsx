import { useEffect, useMemo, useRef, useState } from "react";
import { Department } from "../../services/departmentService";
import { Faculty } from "../../services/facultyService";

type TabId = "faculties" | "kafedra" | "other";

export interface DepartmentFilterSelection {
  id: string;
  label: string;
  departmentIds: number[];
}

interface DepartmentTabbedComboboxProps {
  departments: Department[];
  faculties: Faculty[];
  value: DepartmentFilterSelection[];
  onChange: (selection: DepartmentFilterSelection[]) => void;
  disabled?: boolean;
}

const tabs: { id: TabId; label: string }[] = [
  { id: "faculties", label: "Fakültələr" },
  { id: "kafedra", label: "Kafedralar" },
  { id: "other", label: "Digər" },
];

const isKafedraDepartment = (department: Department) =>
  (department.categories || []).some(
    (category) => category.name.trim().toLowerCase() === "kafedra"
  );

const matchesSearch = (search: string, ...values: Array<string | undefined>) => {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return values.some((value) =>
    String(value || "").toLowerCase().includes(normalizedSearch)
  );
};

export default function DepartmentTabbedCombobox({
  departments,
  faculties,
  value,
  onChange,
  disabled = false,
}: DepartmentTabbedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("faculties");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const departmentById = useMemo(() => {
    const map = new Map<number, Department>();
    departments.forEach((department) => map.set(department.id, department));
    return map;
  }, [departments]);

  const facultyItems = useMemo(
    () =>
      faculties
        .map((faculty) => {
          const departmentIds =
            faculty.department_ids ||
            (faculty.departments || []).map((department) => department.id);
          const departmentNames = departmentIds
            .map((departmentId) => departmentById.get(departmentId)?.name)
            .filter(Boolean)
            .join(", ");

          return {
            id: faculty.id,
            label: faculty.name,
            departmentIds,
            departmentNames,
          };
        })
        .filter((faculty) =>
          matchesSearch(search, faculty.label, faculty.departmentNames)
        ),
    [departmentById, faculties, search]
  );

  const kafedraItems = useMemo(
    () =>
      departments
        .filter(isKafedraDepartment)
        .filter((department) => matchesSearch(search, department.name)),
    [departments, search]
  );

  const otherItems = useMemo(
    () =>
      departments
        .filter((department) => !isKafedraDepartment(department))
        .filter((department) => matchesSearch(search, department.name)),
    [departments, search]
  );

  const counts: Record<TabId, number> = {
    faculties: facultyItems.length,
    kafedra: kafedraItems.length,
    other: otherItems.length,
  };

  const selectedDepartmentIds = useMemo(
    () =>
      Array.from(
        new Set(value.flatMap((selection) => selection.departmentIds))
      ),
    [value]
  );

  const buttonLabel =
    value.length === 0
      ? "Bütün departamentlər"
      : value.length === 1
        ? value[0].label
        : `${value.length} seçim`;

  useEffect(() => {
    if (!open) return;

    setSearch("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelection = (selection: DepartmentFilterSelection) => {
    const exists = value.some((item) => item.id === selection.id);
    if (exists) {
      onChange(value.filter((item) => item.id !== selection.id));
      return;
    }

    onChange([...value, selection]);
  };

  const removeSelection = (selectionId: string) => {
    onChange(value.filter((item) => item.id !== selectionId));
  };

  const isSelected = (selectionId: string) =>
    value.some((item) => item.id === selectionId);

  const isDepartmentCovered = (departmentId: number) =>
    selectedDepartmentIds.includes(departmentId);

  const isFacultyCovered = (departmentIds: number[]) =>
    departmentIds.length > 0 &&
    departmentIds.every((departmentId) => selectedDepartmentIds.includes(departmentId));

  const clearSelection = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 text-left text-sm outline-none transition hover:bg-gray-50 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
      >
        <span className={value.length > 0 ? "truncate text-gray-800 dark:text-white" : "truncate text-gray-500 dark:text-gray-400"}>
          {buttonLabel}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {value.length > 0 && (
        <div className="mt-2 flex max-h-20 flex-wrap gap-2 overflow-y-auto rounded-md border border-gray-200 p-2 dark:border-gray-700">
          {value.map((selection) => (
            <span
              key={selection.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
            >
              <span className="truncate">{selection.label}</span>
              <button
                type="button"
                onClick={() => removeSelection(selection.id)}
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full hover:bg-brand-100 dark:hover:bg-brand-800"
                aria-label={`${selection.label} sil`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 min-w-[360px] rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-2 dark:border-gray-800">
            <input
              ref={inputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Axtar..."
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-1 border-b border-gray-100 p-2 dark:border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-9 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition ${
                  activeTab === tab.id
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className="truncate">{tab.label}</span>
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                clearSelection();
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Bütün departamentlər
              {value.length === 0 && <span className="text-brand-600">✓</span>}
            </button>

            {activeTab === "faculties" &&
              (facultyItems.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">Fakültə tapılmadı</div>
              ) : (
                facultyItems.map((faculty) => (
                  <button
                    key={faculty.id}
                    type="button"
                    disabled={faculty.departmentIds.length === 0}
                    onClick={() =>
                      toggleSelection({
                        id: `faculty:${faculty.id}`,
                        label: `Fakültə: ${faculty.label}`,
                        departmentIds: faculty.departmentIds,
                      })
                    }
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-brand-900/30 ${
                      isSelected(`faculty:${faculty.id}`) || isFacultyCovered(faculty.departmentIds)
                        ? "text-brand-700 dark:text-brand-200"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 dark:border-gray-600">
                      {(isSelected(`faculty:${faculty.id}`) || isFacultyCovered(faculty.departmentIds)) && (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m5 13 4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{faculty.label}</span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {faculty.departmentIds.length} departament
                      </span>
                    </span>
                  </button>
                ))
              ))}

            {activeTab === "kafedra" &&
              (kafedraItems.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">Kafedra tapılmadı</div>
              ) : (
                kafedraItems.map((department) => (
                  <button
                    key={department.id}
                    type="button"
                    onClick={() =>
                      toggleSelection({
                        id: `department:${department.id}`,
                        label: department.name,
                        departmentIds: [department.id],
                      })
                    }
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/30 ${
                      isSelected(`department:${department.id}`) || isDepartmentCovered(department.id)
                        ? "text-brand-700 dark:text-brand-200"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 dark:border-gray-600">
                      {(isSelected(`department:${department.id}`) || isDepartmentCovered(department.id)) && (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m5 13 4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{department.name}</span>
                  </button>
                ))
              ))}

            {activeTab === "other" &&
              (otherItems.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">Departament tapılmadı</div>
              ) : (
                otherItems.map((department) => (
                  <button
                    key={department.id}
                    type="button"
                    onClick={() =>
                      toggleSelection({
                        id: `department:${department.id}`,
                        label: department.name,
                        departmentIds: [department.id],
                      })
                    }
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/30 ${
                      isSelected(`department:${department.id}`) || isDepartmentCovered(department.id)
                        ? "text-brand-700 dark:text-brand-200"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 dark:border-gray-600">
                      {(isSelected(`department:${department.id}`) || isDepartmentCovered(department.id)) && (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m5 13 4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{department.name}</span>
                  </button>
                ))
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
