import { useEffect, useMemo, useState } from 'react'
import PageBreadcrumb from '../../components/common/PageBreadCrumb'
import PageMeta from '../../components/common/PageMeta'
import helperToolService, { HelperToolOption } from '../../services/helperToolService'

type SectionType = 'academic-year' | 'semester'

const emptyForm = { value: '' }

export default function HelperToolsPage() {
  const [academicYears, setAcademicYears] = useState<HelperToolOption[]>([])
  const [semesters, setSemesters] = useState<HelperToolOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalType, setModalType] = useState<SectionType | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    try {
      setLoading(true)
      setError('')
      const [yearsRes, semestersRes] = await Promise.all([
        helperToolService.getAcademicYears(),
        helperToolService.getSemesters()
      ])

      setAcademicYears(Array.isArray(yearsRes?.data) ? yearsRes.data : [])
      setSemesters(Array.isArray(semestersRes?.data) ? semestersRes.data : [])
    } catch {
      setError('Köməkçi alətlər yüklənmədi')
      setAcademicYears([])
      setSemesters([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const modalTitle = useMemo(() => {
    if (modalType === 'academic-year') {
      return editingId ? 'Tədris ilini redaktə et' : 'Yeni tədris ili'
    }
    if (modalType === 'semester') {
      return editingId ? 'Semestri redaktə et' : 'Yeni semestr'
    }
    return ''
  }, [editingId, modalType])

  const openCreate = (type: SectionType) => {
    setModalType(type)
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
  }

  const openEdit = (type: SectionType, item: HelperToolOption) => {
    setModalType(type)
    setEditingId(item.id)
    setForm({ value: item.value })
    setFormError('')
  }

  const getService = () => {
    if (modalType === 'academic-year') {
      return {
        create: helperToolService.createAcademicYear,
        update: helperToolService.updateAcademicYear
      }
    }

    return {
      create: helperToolService.createSemester,
      update: helperToolService.updateSemester
    }
  }

  const handleSave = async () => {
    const value = form.value.trim()
    if (!value) {
      setFormError(modalType === 'academic-year' ? 'Tədris ili tələb olunur' : 'Semestr tələb olunur')
      return
    }

    if (!modalType) return

    setSaving(true)
    setFormError('')
    try {
      const service = getService()
      if (editingId) {
        await service.update(editingId, value)
      } else {
        await service.create(value)
      }
      setModalType(null)
      await loadAll()
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Yadda saxlamaq mümkün olmadı')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (type: SectionType, item: HelperToolOption) => {
    const label = type === 'academic-year' ? 'tədris ili' : 'semestr'
    if (!confirm(`"${item.value}" ${label} silinsin?`)) return

    try {
      if (type === 'academic-year') {
        await helperToolService.deleteAcademicYear(item.id)
      } else {
        await helperToolService.deleteSemester(item.id)
      }
      await loadAll()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Silinmə zamanı xəta baş verdi')
    }
  }

  const renderSection = (type: SectionType, items: HelperToolOption[]) => {
    const title = type === 'academic-year' ? 'Tədris illəri' : 'Semestrlər'
    const addLabel = type === 'academic-year' ? '+ Tədris ili əlavə et' : '+ Semestr əlavə et'
    const emptyLabel = type === 'academic-year' ? 'Hələ tədris ili əlavə edilməyib.' : 'Hələ semestr əlavə edilməyib.'

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Əlavə et, düzəlt və ya sil.</p>
          </div>
          <button
            onClick={() => openCreate(type)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            {addLabel}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Dəyər</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 text-gray-800 dark:text-white">{item.value}</td>
                    <td className="py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(type, item)}
                          className="text-gray-500 hover:text-brand-500 dark:text-gray-400"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(type, item)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <PageMeta title="Köməkçi alətlər | Performix" description="Tədris ili və semestr parametrləri" />
      <PageBreadcrumb pageTitle="Köməkçi alətlər" />

      <div className="space-y-6">
        {loading ? (
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          </div>
        ) : (
          <>
            {error && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </p>
            )}

            {renderSection('academic-year', academicYears)}
            {renderSection('semester', semesters)}
          </>
        )}
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">{modalTitle}</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Dəyər</label>
                <input
                  type="text"
                  value={form.value}
                  onChange={(e) => setForm({ value: e.target.value })}
                  placeholder={modalType === 'academic-year' ? '2025-2026' : 'YAZ'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setModalType(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Ləğv et
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? 'Saxlanılır...' : 'Saxla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}