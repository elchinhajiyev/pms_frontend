import { useEffect, useState } from 'react'
import PageBreadcrumb from '../../components/common/PageBreadCrumb'
import PageMeta from '../../components/common/PageMeta'
import { useAuth } from '../../context/AuthContext'
import teacherSurveyService, { MyTeacherSurveyItem } from '../../services/teacherSurveyService'

export default function MyTeachers() {
  const { user } = useAuth()
  const [items, setItems] = useState<MyTeacherSurveyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadTeachers()
    }
  }, [user?.id])

  const loadTeachers = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await teacherSurveyService.getMyTeachers(user!.id)
      const data = Array.isArray(res?.data) ? res.data : []
      setItems(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Müəllimlər siyahısı yüklənmədi')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageMeta title='Müəllimlərim | Performix' description='Mənə aid müəllimlər və səs göstəriciləri' />
      <PageBreadcrumb pageTitle='Müəllimlərim' />

      <div className='rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800'>
        {error && (
          <p className='mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300'>
            {error}
          </p>
        )}

        {loading ? (
          <div className='flex justify-center py-10'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent' />
          </div>
        ) : items.length === 0 ? (
          <p className='text-sm text-gray-500 dark:text-gray-400'>Müəllim tapılmadı.</p>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {items.map((item) => (
              <div key={item.teacher_id} className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                <h4 className='text-base font-semibold text-gray-800 dark:text-white'>{item.teacher_name}</h4>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Sorğu sayı: {item.survey_count}
                </p>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Verdiyim səs sayı: {item.vote_count}
                </p>
                <p className='mt-2 text-sm font-medium text-green-700 dark:text-green-400'>
                  Orta bal: {item.average_score ? Number(item.average_score).toFixed(2) : 'Yoxdur'}
                </p>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Son qiymətləndirmə: {item.last_rated_at
                    ? new Date(item.last_rated_at).toLocaleString('az-AZ')
                    : '-'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
