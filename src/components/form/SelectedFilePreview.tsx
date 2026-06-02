import { useEffect, useState } from "react";
import { FiFileText, FiTrash2 } from "react-icons/fi";

interface SelectedFilePreviewProps {
  file: File | null;
  onRemove: () => void;
}

export default function SelectedFilePreview({
  file,
  onRemove,
}: SelectedFilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-900">
      {isImage && (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-44 w-full object-contain p-2"
        />
      )}
      {isPdf && (
        <iframe
          title={file.name}
          src={`${previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          className="h-44 w-full bg-gray-50 dark:bg-gray-800"
        />
      )}
      {!isImage && !isPdf && (
        <div className="flex h-24 items-center justify-center bg-gray-50 dark:bg-gray-800">
          <FiFileText className="text-3xl text-gray-500 dark:text-gray-400" />
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-3 py-2 dark:border-gray-700">
        <p className="min-w-0 truncate text-xs text-gray-600 dark:text-gray-300">
          {file.name} ({sizeMb} MB)
        </p>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Seçilmiş faylı sil"
          aria-label="Seçilmiş faylı sil"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
}
