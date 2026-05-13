import { useState, useRef, useEffect } from "react";

export interface MultiSelectOption {
  id: number;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seç...",
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((o) => selected.includes(o.id));
  const filteredOptions = options.filter(
    (o) =>
      !selected.includes(o.id) &&
      o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelect = (id: number) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  const removeSelected = (id: number) => {
    onChange(selected.filter((s) => s !== id));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus-within:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {selectedOptions.length > 0 ? (
            <>
              {selectedOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-200"
                >
                  <span>{opt.label}</span>
                  <button
                    type="button"
                    onClick={() => removeSelected(opt.id)}
                    className="inline-flex h-4 w-4 items-center justify-center hover:bg-brand-200 rounded-full dark:hover:bg-brand-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder=""
                disabled={disabled}
                className="flex-1 min-w-24 bg-transparent outline-none dark:bg-gray-900"
              />
            </>
          ) : (
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full bg-transparent outline-none dark:bg-gray-900"
            />
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {search
                ? "Nəticə tapılmadı"
                : "Seçim üçün istifadəçi yoxdur"}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleSelect(option.id)}
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-brand-50 dark:text-gray-200 dark:hover:bg-gray-700 transition"
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
