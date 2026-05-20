import { useState } from "react";
import { API_ORIGIN } from "../../services/api";

const DEFAULT_PROFILE_PHOTO = "/images/user/empty-profile.svg";

export const resolveUserPhotoUrl = (photo?: string | null) => {
  const value = String(photo || "").trim();
  if (!value) return DEFAULT_PROFILE_PHOTO;
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${API_ORIGIN}${normalized}`;
};

interface UserAvatarProps {
  photo?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export default function UserAvatar({
  photo,
  name = "İstifadəçi",
  size = "md",
}: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const src = resolveUserPhotoUrl(photo);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(true);
        }}
        className={`${sizeClasses[size]} shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800`}
        aria-label={`${name} profil şəklini böyüt`}
      >
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = DEFAULT_PROFILE_PHOTO;
          }}
        />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="rounded-xl bg-white p-3 shadow-2xl dark:bg-gray-800"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={src}
              alt={name}
              className="max-h-[70vh] w-auto max-w-[360px] rounded-lg object-contain"
              onError={(event) => {
                event.currentTarget.src = DEFAULT_PROFILE_PHOTO;
              }}
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Bağla
            </button>
          </div>
        </div>
      )}
    </>
  );
}
