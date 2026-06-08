import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { useEnsureActiveSemester, useHelperToolOptions } from "../../hooks/useHelperToolOptions";
import { evaluationParameterService, EvaluationParameter } from "../../services/evaluationService";
import teachingProgramService from "../../services/teachingProgramService";
import SelectedFilePreview from "../../components/form/SelectedFilePreview";

export default function CreateCourseMaterialPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const recordId = Number(id);
  const isEditMode = Number.isFinite(recordId);
  const { user } = useAuth();
  const { semesters } = useHelperToolOptions();

  const [title, setTitle] = useState("");
  const [semester, setSemester] = useState<"YAZ" | "YAY" | "PAYIZ">("YAZ");
  const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [categoryId, setCategoryId] = useState("");
  const [summary, setSummary] = useState("");
  const [link, setLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState("");
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [categories, setCategories] = useState<EvaluationParameter[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEnsureActiveSemester(semesters, semester, setSemester);

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let year = currentYear - 2; year <= currentYear + 3; year += 1) years.push(`${year}-${year + 1}`);
    if (academicYear && !years.includes(academicYear)) years.unshift(academicYear);
    return years;
  }, [academicYear]);

  const loadCategories = async () => {
    if (categoriesLoaded || loadingCategories) return;
    setLoadingCategories(true);
    try {
      const res = await evaluationParameterService.getAll("course_materials");
      const data = Array.isArray(res?.data) ? res.data : [];
      setCategories(data);
      setCategoriesLoaded(true);
      if (!categoryId && data.length > 0) setCategoryId(String(data[0].id));
    } catch {
      setError("Kateqoriyalar yüklənmədi");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => { if (acceptedFiles?.length) setSelectedFile(acceptedFiles[0]); };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    const loadRecordForEdit = async () => {
      if (!isEditMode || !user?.id || !Number.isFinite(recordId)) return;
      setLoadingRecord(true);
      setError("");
      try {
        const res = await teachingProgramService.getById(recordId, user.id, "course_materials");
        const record = res?.data;
        if (!record) { setError("Məlumat tapılmadı"); return; }
        if (record.status === "approved") { setError("Təsdiqlənmiş məlumat redaktə edilə bilməz"); return; }
        setTitle(record.title || "");
        setSemester((record.semester as "YAZ" | "YAY" | "PAYIZ") || "YAZ");
        setAcademicYear(record.academic_year || "");
        setCategoryId(record.category_parameter_id ? String(record.category_parameter_id) : "");
        setSummary(record.summary || "");
        setLink(record.link || "");
        setExistingFileName(record.file_name || "");
      } catch (err: any) {
        setError(err?.response?.data?.message || "Məlumatlar yüklənmədi");
      } finally { setLoadingRecord(false); }
    };
    loadRecordForEdit();
  }, [isEditMode, recordId, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return setError("İstifadəçi tapılmadı");
    if (!title.trim()) return setError("Başlıq tələb olunur");
    if (!categoryId) return setError("Kateqoriya seçilməlidir");
    if (!academicYear.trim()) return setError("Tədris ili seçilməlidir");

    setSaving(true);
    setError("");
    try {
      const payload = { title: title.trim(), semester, academic_year: academicYear.trim(), category_parameter_id: Number(categoryId), summary: summary.trim() || undefined, link: link.trim() || undefined, created_by: user.id, file: selectedFile };
      if (isEditMode && Number.isFinite(recordId)) await teachingProgramService.update({ id: recordId, ...payload });
      else await teachingProgramService.create(payload);
      navigate("/usercoursematerials");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Yadda saxlamaq mümkün olmadı");
    } finally { setSaving(false); }
  };

  return (
    <>
      <PageMeta title={isEditMode ? "Dərs vəsaitini redaktə et | Performix" : "Dərs vəsaiti əlavə et | Performix"} description={isEditMode ? "Mövcud dərs vəsaitinin redaktəsi" : "Yeni dərs vəsaiti əlavə etmə forması"} />
      <PageBreadcrumb pageTitle={isEditMode ? "Dərs vəsaitini redaktə et" : "Dərs vəsaiti əlavə et"} />
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        {loadingRecord && <div className="mb-4 flex justify-center py-2"><div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Başlıq *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="Dərs vəsaitinin adını daxil edin" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Semestr *</label><select value={semester} onChange={(e) => setSemester(e.target.value as "YAZ" | "YAY" | "PAYIZ")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white">{semesters.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tədris ili *</label><select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="">Tədris ili seçin</option>{academicYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select></div>
            <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Kateqoriya *</label><select value={categoryId} onFocus={loadCategories} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="">Kateqoriya seçin</option>{categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}</select></div>
            <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Qısa məlumat</label><textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="Qısa məlumat daxil edin" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Link</label><input type="url" value={link} onChange={(e) => setLink(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white" placeholder="https://..." /></div>
            <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Faylı yükləyin (drag and drop)</label><div {...getRootProps()} className={`cursor-pointer rounded-xl border border-dashed p-6 text-center transition ${isDragActive ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-300 hover:border-brand-400 dark:border-gray-700"}`}><input {...getInputProps()} /><p className="text-sm text-gray-600 dark:text-gray-300">{isDragActive ? "Faylı buraxın..." : "Faylı bura sürükləyin və ya klik edib seçin"}</p><SelectedFilePreview file={selectedFile} onRemove={() => setSelectedFile(null)} />{!selectedFile && existingFileName && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Mövcud fayl: {existingFileName}</p>}</div></div>
          </div>
          {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>}
          <div className="flex justify-end gap-3"><button type="button" onClick={() => navigate("/usercoursematerials")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Ləğv et</button><button type="submit" disabled={saving || loadingRecord} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{saving ? "Yadda saxlanılır..." : isEditMode ? "Dəyişiklikləri yadda saxla" : "Yadda saxla"}</button></div>
        </form>
      </div>
    </>
  );
}
