import { FormEvent, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { Modal } from "../components/ui/modal";
import profileService, {
  UserCertificate,
  UserProfile,
} from "../services/profileService";
import { API_ORIGIN } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router";

type TabKey = "member" | "staff";

const toInputDate = (value?: string | null) => {
  if (!value) return "";
  const raw = String(value);
  return raw.includes("T") ? raw.split("T")[0] : raw;
};

const toNullableNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const initialProfile: Partial<UserProfile> = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  phone: "",
  gender: "",
  nationality: "",
  birth_date: "",
  registration_address: "",
  current_address: "",
  education_main_university: "",
  education_main_faculty: "",
  education_main_level: "",
  education_main_start_year: null,
  education_main_end_year: null,
  education_additional_university: "",
  education_additional_faculty: "",
  education_additional_level: "",
  education_additional_start_year: null,
  education_additional_end_year: null,
  is_department_head: false,
};

const displayValue = (value?: string | number | null) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Məlumat yoxdur";
  }
  return String(value);
};

const toYearString = (value?: number | null) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const EDUCATION_LEVEL_OPTIONS = ["bakalavriat", "magistratura", "doktorantura"] as const;
const DEFAULT_PROFILE_PHOTO = "/images/user/empty-profile.svg";

const resolvePhotoUrl = (photo?: string | null) => {
  const value = String(photo || "").trim();
  if (!value) return DEFAULT_PROFILE_PHOTO;
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${API_ORIGIN}${normalized}`;
};

const PencilButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
    aria-label="Redaktə et"
  >
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z"
        fill="currentColor"
      />
    </svg>
  </button>
);

export default function UserProfiles() {
  const { updateUser, user } = useAuth();
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const [activeTab, setActiveTab] = useState<TabKey>("member");
  const [profile, setProfile] = useState<Partial<UserProfile>>(initialProfile);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);

  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);

  const [basicForm, setBasicForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone: "",
    photo: "",
  });
  const [personalForm, setPersonalForm] = useState({
    gender: "",
    nationality: "",
    birth_date: "",
    registration_address: "",
    current_address: "",
  });
  const [educationForm, setEducationForm] = useState({
    education_main_university: "",
    education_main_faculty: "",
    education_main_level: "",
    education_main_start_year: "",
    education_main_end_year: "",
    education_additional_university: "",
    education_additional_faculty: "",
    education_additional_level: "",
    education_additional_start_year: "",
    education_additional_end_year: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [newCertificate, setNewCertificate] = useState({
    certificate_name: "",
    issuer: "",
    year: "",
  });

  const viewedUserId = userIdParam ? Number(userIdParam) : null;
  const isOwnProfile = !viewedUserId || viewedUserId === Number(user?.id);

  const fullName = useMemo(
    () => [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "-",
    [profile.first_name, profile.last_name]
  );

  const hasAdditionalEducation = useMemo(
    () =>
      [
        profile.education_additional_university,
        profile.education_additional_faculty,
        profile.education_additional_level,
        profile.education_additional_start_year,
        profile.education_additional_end_year,
      ].some((value) => value !== null && value !== undefined && String(value).trim() !== ""),
    [
      profile.education_additional_university,
      profile.education_additional_faculty,
      profile.education_additional_level,
      profile.education_additional_start_year,
      profile.education_additional_end_year,
    ]
  );

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const profileRes = isOwnProfile
        ? await profileService.getMyProfile()
        : await profileService.getUserProfileById(Number(viewedUserId));
      const certRes = isOwnProfile
        ? await profileService.getMyCertificates()
        : { data: [] };

      const profileData = profileRes?.data || {};
      setProfile({
        ...initialProfile,
        ...profileData,
        birth_date: toInputDate(profileData.birth_date),
      });

      setBasicForm({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        middle_name: profileData.middle_name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        photo: profileData.photo || "",
      });

      setPersonalForm({
        gender: profileData.gender || "",
        nationality: profileData.nationality || "",
        birth_date: toInputDate(profileData.birth_date),
        registration_address: profileData.registration_address || "",
        current_address: profileData.current_address || "",
      });

      setEducationForm({
        education_main_university: profileData.education_main_university || "",
        education_main_faculty: profileData.education_main_faculty || "",
        education_main_level: profileData.education_main_level || "",
        education_main_start_year: toYearString(profileData.education_main_start_year),
        education_main_end_year: toYearString(profileData.education_main_end_year),
        education_additional_university: profileData.education_additional_university || "",
        education_additional_faculty: profileData.education_additional_faculty || "",
        education_additional_level: profileData.education_additional_level || "",
        education_additional_start_year: toYearString(profileData.education_additional_start_year),
        education_additional_end_year: toYearString(profileData.education_additional_end_year),
      });

      setCertificates(isOwnProfile && Array.isArray(certRes?.data) ? certRes.data : []);
    } catch {
      setError("Profil məlumatları yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isOwnProfile, viewedUserId]);

  const saveProfile = async (payload: Partial<UserProfile>, successText: string) => {
    if (!isOwnProfile) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await profileService.updateMyProfile(payload);
      const updated = res?.data || {};

      setProfile((prev) => ({
        ...prev,
        ...updated,
        birth_date: toInputDate(updated.birth_date),
      }));

      updateUser(updated);
      setSuccess(successText);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Profil yenilənmədi");
    } finally {
      setSaving(false);
    }
  };

  const onSaveBasicInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    let finalPhoto = basicForm.photo;
    if (selectedPhotoFile) {
      try {
        setUploadingPhoto(true);
        const uploadRes = await profileService.uploadMyPhoto(selectedPhotoFile);
        const uploaded = uploadRes?.data || {};
        finalPhoto = uploaded.photo || finalPhoto;

        setProfile((prev) => ({
          ...prev,
          ...uploaded,
          birth_date: toInputDate(uploaded.birth_date),
        }));
        setBasicForm((prev) => ({ ...prev, photo: finalPhoto }));
        updateUser(uploaded);
        setSelectedPhotoFile(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Şəkil yüklənmədi");
        setUploadingPhoto(false);
        return;
      } finally {
        setUploadingPhoto(false);
      }
    }

    await saveProfile(
      {
        first_name: basicForm.first_name,
        last_name: basicForm.last_name,
        middle_name: basicForm.middle_name,
        email: basicForm.email,
        phone: basicForm.phone,
        photo: finalPhoto,
      },
      "Üzv məlumatları yeniləndi"
    );
    setBasicModalOpen(false);
  };

  const onSavePersonalInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    await saveProfile(
      {
        gender: personalForm.gender,
        nationality: personalForm.nationality,
        birth_date: personalForm.birth_date || null,
        registration_address: personalForm.registration_address,
        current_address: personalForm.current_address,
      },
      "Fərdi məlumatlar yeniləndi"
    );
    setPersonalModalOpen(false);
  };

  const onSaveEducationInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    await saveProfile(
      {
        education_main_university: educationForm.education_main_university,
        education_main_faculty: educationForm.education_main_faculty,
        education_main_level: educationForm.education_main_level,
        education_main_start_year: educationForm.education_main_start_year
          ? Number(educationForm.education_main_start_year)
          : null,
        education_main_end_year: educationForm.education_main_end_year
          ? Number(educationForm.education_main_end_year)
          : null,
        education_additional_university: educationForm.education_additional_university,
        education_additional_faculty: educationForm.education_additional_faculty,
        education_additional_level: educationForm.education_additional_level,
        education_additional_start_year: educationForm.education_additional_start_year
          ? Number(educationForm.education_additional_start_year)
          : null,
        education_additional_end_year: educationForm.education_additional_end_year
          ? Number(educationForm.education_additional_end_year)
          : null,
      },
      "Təhsil məlumatları yeniləndi"
    );
    setEducationModalOpen(false);
  };

  const onAddCertificate = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    if (!newCertificate.certificate_name.trim()) {
      setError("Sertifikat adı tələb olunur");
      return;
    }

    try {
      setError("");
      const res = await profileService.createMyCertificate({
        certificate_name: newCertificate.certificate_name.trim(),
        issuer: newCertificate.issuer.trim() || undefined,
        year: newCertificate.year.trim() ? toNullableNumber(newCertificate.year.trim()) : null,
      });

      if (res?.data) {
        setCertificates((prev) => [res.data, ...prev]);
      }

      setNewCertificate({ certificate_name: "", issuer: "", year: "" });
      setSuccess("Sertifikat əlavə edildi");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Sertifikat əlavə edilə bilmədi");
    }
  };

  const onUpdateCertificate = async (certificate: UserCertificate) => {
    if (!isOwnProfile) return;
    if (!certificate.certificate_name?.trim()) {
      setError("Sertifikat adı tələb olunur");
      return;
    }

    try {
      setError("");
      const res = await profileService.updateMyCertificate(certificate.id, {
        certificate_name: certificate.certificate_name.trim(),
        issuer: certificate.issuer || undefined,
        year: certificate.year ?? null,
      });

      if (res?.data) {
        setCertificates((prev) => prev.map((item) => (item.id === certificate.id ? res.data : item)));
      }

      setSuccess("Sertifikat yeniləndi");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Sertifikat yenilənmədi");
    }
  };

  const onDeleteCertificate = async (id: number) => {
    if (!isOwnProfile) return;
    if (!confirm("Bu sertifikatı silmək istəyirsiniz?")) return;

    try {
      await profileService.deleteMyCertificate(id);
      setCertificates((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Sertifikat silinə bilmədi");
    }
  };

  return (
    <>
      <PageMeta title="Profil | Performix" description="İstifadəçi profil məlumatları" />
      <PageBreadcrumb pageTitle="Profil" />

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab("member")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                activeTab === "member"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Üzv məlumatları
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                activeTab === "staff"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Heyət məlumatları
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          )}

          {!loading && activeTab === "staff" && (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Bu bölmə hələlik boşdur.
            </div>
          )}

          {!loading && activeTab === "member" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-800 dark:text-white">Üzv məlumatları</h4>
                  {isOwnProfile ? <PencilButton onClick={() => setBasicModalOpen(true)} /> : null}
                </div>
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="h-24 w-24 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
                      <img
                        src={resolvePhotoUrl(profile.photo)}
                        alt="Profil"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_PROFILE_PHOTO;
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{fullName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ata adı: {displayValue(profile.middle_name)}
                      </p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {displayValue(profile.role_name)} | {displayValue(profile.department_name)}
                      </p>
                    </div>
                  </div>

                  <div className="hidden w-px bg-gray-200 lg:block dark:bg-gray-700" />

                  <div className="flex-1">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">İstifadəçi ID</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{displayValue(profile.id)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Departament rəhbəri</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {profile.is_department_head ? "Bəli" : "Xeyr"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Telefon nömrəsi</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{displayValue(profile.phone)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email adresi</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{displayValue(profile.email)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Fərdi məlumatlar</h4>
                      {isOwnProfile ? <PencilButton onClick={() => setPersonalModalOpen(true)} /> : null}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cinsiyyəti</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{displayValue(profile.gender)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Vətəndaşlığı</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{displayValue(profile.nationality)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Doğum tarixi</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{displayValue(toInputDate(profile.birth_date))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Qeydiyyat ünvanı</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{displayValue(profile.registration_address)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Faktiki yaşayış ünvanı</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{displayValue(profile.current_address)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Təhsil məlumatları</h4>
                        {isOwnProfile ? <PencilButton onClick={() => setEducationModalOpen(true)} /> : null}
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <p className="text-gray-700 dark:text-gray-300">Universitet: {displayValue(profile.education_main_university)}</p>
                          <p className="text-gray-700 dark:text-gray-300">Fakültə: {displayValue(profile.education_main_faculty)}</p>
                          <p className="text-gray-700 dark:text-gray-300">Səviyyə: {displayValue(profile.education_main_level)}</p>
                       
                             <p className="text-gray-700 dark:text-gray-300"> {displayValue(profile.education_main_start_year)} - {displayValue(profile.education_main_end_year)}</p>
                         
                        
                        </div>
                      </div>

                      {hasAdditionalEducation && (
                        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <p className="text-gray-700 dark:text-gray-300">Universitet: {displayValue(profile.education_additional_university)}</p>
                            <p className="text-gray-700 dark:text-gray-300">Fakültə: {displayValue(profile.education_additional_faculty)}</p>
                            <p className="text-gray-700 dark:text-gray-300">Səviyyə: {displayValue(profile.education_additional_level)}</p>
                            <p className="text-gray-700 dark:text-gray-300">{displayValue(profile.education_additional_start_year)} - {displayValue(profile.education_additional_end_year)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Sertifikatlar</h4>
                      {isOwnProfile ? <PencilButton onClick={() => setCertificateModalOpen(true)} /> : null}
                    </div>

                    {certificates.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sertifikat məlumatı yoxdur.</p>
                    ) : (
                      <div className="space-y-2">
                        {certificates.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">{item.certificate_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {displayValue(item.issuer)} | {displayValue(item.year)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(error || success) && (
                <p
                  className={`rounded-lg px-3 py-2 text-sm ${
                    error
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {error || success}
                </p>
              )}

            </div>
          )}
        </div>
      </div>

      <Modal isOpen={basicModalOpen} onClose={() => setBasicModalOpen(false)} className="max-w-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Üzv məlumatlarını redaktə et</h3>
        <form onSubmit={onSaveBasicInfo} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={basicForm.first_name} onChange={(e) => setBasicForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="Ad" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            <input value={basicForm.last_name} onChange={(e) => setBasicForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Soyad" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <input value={basicForm.middle_name} onChange={(e) => setBasicForm((p) => ({ ...p, middle_name: e.target.value }))} placeholder="Atasının adı" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={basicForm.email} onChange={(e) => setBasicForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            <input value={basicForm.phone} onChange={(e) => setBasicForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Telefon" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <input value={basicForm.photo} onChange={(e) => setBasicForm((p) => ({ ...p, photo: e.target.value }))} placeholder="Şəkil URL (opsional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şəkil yüklə</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setSelectedPhotoFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-white hover:file:bg-brand-600 dark:text-gray-300"
            />
            {selectedPhotoFile && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Seçilən fayl: {selectedPhotoFile.name}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setBasicModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-300">Ləğv et</button>
            <button type="submit" disabled={saving || uploadingPhoto} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{uploadingPhoto ? "Yüklənir..." : "Saxla"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={personalModalOpen} onClose={() => setPersonalModalOpen(false)} className="max-w-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Fərdi məlumatlar redaktəsi</h3>
        <form onSubmit={onSavePersonalInfo} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select value={personalForm.gender} onChange={(e) => setPersonalForm((p) => ({ ...p, gender: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="">Cinsiyyəti seçin</option>
              <option value="Kişi">Kişi</option>
              <option value="Qadın">Qadın</option>
            </select>
            <input value={personalForm.nationality} onChange={(e) => setPersonalForm((p) => ({ ...p, nationality: e.target.value }))} placeholder="Vətəndaşlığı" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <input type="date" value={personalForm.birth_date} onChange={(e) => setPersonalForm((p) => ({ ...p, birth_date: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <textarea value={personalForm.registration_address} onChange={(e) => setPersonalForm((p) => ({ ...p, registration_address: e.target.value }))} rows={2} placeholder="Qeydiyyat ünvanı" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <textarea value={personalForm.current_address} onChange={(e) => setPersonalForm((p) => ({ ...p, current_address: e.target.value }))} rows={2} placeholder="Faktiki yaşayış ünvanı" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPersonalModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-300">Ləğv et</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">Saxla</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={educationModalOpen} onClose={() => setEducationModalOpen(false)} className="max-w-3xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Təhsil məlumatları redaktəsi</h3>
        <form onSubmit={onSaveEducationInfo} className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Əsas təhsil</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={educationForm.education_main_university} onChange={(e) => setEducationForm((p) => ({ ...p, education_main_university: e.target.value }))} placeholder="Universitet adı" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={educationForm.education_main_faculty} onChange={(e) => setEducationForm((p) => ({ ...p, education_main_faculty: e.target.value }))} placeholder="Fakültə" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <select value={educationForm.education_main_level} onChange={(e) => setEducationForm((p) => ({ ...p, education_main_level: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">Səviyyəni seçin</option>
                {EDUCATION_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <input type="number" value={educationForm.education_main_start_year} onChange={(e) => setEducationForm((p) => ({ ...p, education_main_start_year: e.target.value }))} placeholder="Başlama ili" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input type="number" value={educationForm.education_main_end_year} onChange={(e) => setEducationForm((p) => ({ ...p, education_main_end_year: e.target.value }))} placeholder="Bitirmə ili" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Əlavə təhsil</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={educationForm.education_additional_university} onChange={(e) => setEducationForm((p) => ({ ...p, education_additional_university: e.target.value }))} placeholder="Universitet adı" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input value={educationForm.education_additional_faculty} onChange={(e) => setEducationForm((p) => ({ ...p, education_additional_faculty: e.target.value }))} placeholder="Fakültə" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <select value={educationForm.education_additional_level} onChange={(e) => setEducationForm((p) => ({ ...p, education_additional_level: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">Səviyyəni seçin</option>
                {EDUCATION_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <input type="number" value={educationForm.education_additional_start_year} onChange={(e) => setEducationForm((p) => ({ ...p, education_additional_start_year: e.target.value }))} placeholder="Başlama ili" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <input type="number" value={educationForm.education_additional_end_year} onChange={(e) => setEducationForm((p) => ({ ...p, education_additional_end_year: e.target.value }))} placeholder="Bitirmə ili" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEducationModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-300">Ləğv et</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">Saxla</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={certificateModalOpen} onClose={() => setCertificateModalOpen(false)} className="max-w-3xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Sertifikatlar</h3>
        <form onSubmit={onAddCertificate} className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:grid-cols-3">
          <input
            value={newCertificate.certificate_name}
            onChange={(e) => setNewCertificate((prev) => ({ ...prev, certificate_name: e.target.value }))}
            placeholder="Sertifikatın adı"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={newCertificate.issuer}
            onChange={(e) => setNewCertificate((prev) => ({ ...prev, issuer: e.target.value }))}
            placeholder="Verilən müəssisə"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={newCertificate.year}
              onChange={(e) => setNewCertificate((prev) => ({ ...prev, year: e.target.value }))}
              placeholder="İl"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button type="submit" className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">Əlavə et</button>
          </div>
        </form>

        <div className="space-y-3">
          {certificates.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sertifikat məlumatı yoxdur.</p>
          )}

          {certificates.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  value={item.certificate_name}
                  onChange={(e) =>
                    setCertificates((prev) =>
                      prev.map((x) => (x.id === item.id ? { ...x, certificate_name: e.target.value } : x))
                    )
                  }
                  placeholder="Sertifikatın adı"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <input
                  value={item.issuer || ""}
                  onChange={(e) =>
                    setCertificates((prev) =>
                      prev.map((x) => (x.id === item.id ? { ...x, issuer: e.target.value } : x))
                    )
                  }
                  placeholder="Verilən müəssisə"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={item.year ?? ""}
                    onChange={(e) =>
                      setCertificates((prev) =>
                        prev.map((x) =>
                          x.id === item.id
                            ? { ...x, year: e.target.value ? Number(e.target.value) : null }
                            : x
                        )
                      )
                    }
                    placeholder="İl"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <button type="button" onClick={() => onUpdateCertificate(item)} className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600">Saxla</button>
                  <button type="button" onClick={() => onDeleteCertificate(item.id)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700">Sil</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
