import { useEffect, useState } from 'react'
import PageBreadcrumb from '../../components/common/PageBreadCrumb'
import PageMeta from '../../components/common/PageMeta'
import { useAuth } from '../../context/AuthContext'
import teacherSurveyService, { CompletedTeacherSurveyItem } from '../../services/teacherSurveyService'

export default function CompletedTeacherSurveys() {
  const { user } = useAuth()
  const [items, setItems] = useState<CompletedTeacherSurveyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadCompleted()
    }
  }, [user?.id])

  const loadCompleted = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await teacherSurveyService.getCompleted(user!.id)
      const data = Array.isArray(res?.data) ? res.data : []
      setItems(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Qiymətləndirdiklərim yüklənmədi')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageMeta title='Qiymətləndirdiklərim | Performix' description='Tamamlanmış müəllim sorğuları' />
      <PageBreadcrumb pageTitle='Qiymətləndirdiklərim' />

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
          <p className='text-sm text-gray-500 dark:text-gray-400'>Hələ tamamlanmış sorğu yoxdur.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400'>
                  <th className='pb-3 pr-4 font-medium'>Sorğu</th>
                  <th className='pb-3 pr-4 font-medium'>Müəllim</th>
                  <th className='pb-3 pr-4 font-medium'>İşçi qrupu</th>
                  <th className='pb-3 pr-4 font-medium'>Fəaliyyət sayı</th>
                  <th className='pb-3 pr-4 font-medium'>Orta bal</th>
                  <th className='pb-3 pr-4 font-medium'>Tarix</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.survey_id}-${item.teacher_id}`} className='border-b border-gray-100 dark:border-gray-700'>
                    <td className='py-3 pr-4 text-gray-800 dark:text-white'>
                      {item.title} ({item.year})
                    </td>
                    <td className='py-3 pr-4 text-gray-600 dark:text-gray-400'>{item.teacher_name}</td>
                    <td className='py-3 pr-4 text-gray-600 dark:text-gray-400'>{item.group_name || '-'}</td>
                    <td className='py-3 pr-4 text-gray-600 dark:text-gray-400'>{item.total_activity_count}</td>
                    <td className='py-3 pr-4 font-medium text-green-700 dark:text-green-400'>
                      {Number(item.average_score || 0).toFixed(2)}
                    </td>
                    <td className='py-3 pr-4 text-gray-600 dark:text-gray-400'>
                      {item.last_rated_at
                        ? new Date(item.last_rated_at).toLocaleString('az-AZ')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
