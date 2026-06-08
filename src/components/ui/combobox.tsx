import { useEffect, useMemo, useRef, useState } from "react";

export interface ComboboxOption {
  label: string;
  value: number;
}

interface MultiComboboxProps {
  options: ComboboxOption[];
  selectedValues: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

export function MultiCombobox({
  options,
  selectedValues,
  onChange,
  placeholder = "Seçin...",
  searchPlaceholder = "Axtarış...",
  emptyText = "Nəticə tapılmadı",
  disabled = false,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)),
    [options, selectedValues]
  );

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedSearch)
    );
  }, [options, search]);

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

  const toggleValue = (value: number) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((selectedValue) => selectedValue !== value));
      return;
    }

    onChange([...selectedValues, value]);
  };

  const removeValue = (value: number) => {
    onChange(selectedValues.filter((selectedValue) => selectedValue !== value));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm outline-none transition hover:bg-gray-50 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
      >
        <span
          className={
            selectedOptions.length > 0
              ? "text-gray-800 dark:text-white"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          {selectedOptions.length > 0
            ? `${selectedOptions.length} seçilib`
            : placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m6 9 6 6 6-6"
          />
        </svg>
      </button>

      {selectedOptions.length > 0 && (
        <div className="mt-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-200"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                onClick={() => removeValue(option.value)}
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full hover:bg-brand-200 dark:hover:bg-brand-800"
                aria-label={`${option.label} sil`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const selected = selectedValues.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-brand-50 dark:hover:bg-brand-900/30 ${
                      selected
                        ? "text-brand-700 dark:text-brand-200"
                        : "text-gray-800 dark:text-gray-300"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 dark:border-gray-600">
                      {selected && (
                        <svg
                          className="h-3 w-3 text-brand-600 dark:text-brand-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="m5 13 4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
