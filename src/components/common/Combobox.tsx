import { useState, useRef, useEffect } from "react";

interface ComboboxItem {
  label: string;
  value: number | string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  selectedValues?: Array<number | string>;
  closeOnSelect?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}

export default function Combobox({
  items,
  value,
  onChange,
  selectedValues,
  closeOnSelect = true,
  placeholder = "Seçin...",
  searchPlaceholder = "Axtarış..."
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItem = items.find((item) => item.value === value);
  const hasMultiSelection = Array.isArray(selectedValues) && selectedValues.length > 0;

  const getButtonText = () => {
    if (hasMultiSelection) {
      if (selectedValues!.length === 1) {
        const singleSelected = items.find((item) => item.value === selectedValues![0]);
        return singleSelected?.label || placeholder;
      }
      return `${selectedValues!.length} seçilib`;
    }

    return selectedItem ? selectedItem.label : placeholder;
  };

  useEffect(() => {
    if (open && searchInputRef.current) {
      setSearch("");
      searchInputRef.current.focus();
    }
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

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-left outline-none focus:border-brand-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 flex items-center justify-between"
      >
        <span className={hasMultiSelection || selectedItem ? "text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
          {getButtonText()}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-2">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Nəticə tapılmadı
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = hasMultiSelection
                  ? selectedValues!.includes(item.value)
                  : value === item.value;

                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      onChange(item.value);
                      if (closeOnSelect) {
                        setOpen(false);
                      }
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/30 ${
                      isSelected
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200"
                        : "text-gray-800 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <svg
                          className="h-4 w-4 text-brand-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {item.label}
                    </div>
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
