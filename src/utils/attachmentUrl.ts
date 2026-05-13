import { API_ORIGIN } from "../services/api";

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

export const resolveAttachmentUrl = (value?: string | null) => {
  if (!value) return "";

  const raw = String(value).trim();
  if (!raw) return "";

  try {
    const absolute = new URL(raw);
    if (absolute.pathname.startsWith("/uploads/")) {
      return `${API_ORIGIN}${absolute.pathname}${absolute.search}${absolute.hash}`;
    }
    return absolute.toString();
  } catch {
    return `${API_ORIGIN}${ensureLeadingSlash(raw)}`;
  }
};
