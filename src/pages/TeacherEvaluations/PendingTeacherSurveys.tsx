import { useEffect, useMemo, useState } from 'react'
import PageBreadcrumb from '../../components/common/PageBreadCrumb'
import PageMeta from '../../components/common/PageMeta'
import { useAuth } from '../../context/AuthContext'
import teacherSurveyService, {
  PendingTeacherSurveyItem,
  TeacherSurveySubmittedScore
} from '../../services/teacherSurveyService'

type ScoreMap = Record<number, number>

const toScoreMap = (scores: TeacherSurveySubmittedScore[]): ScoreMap => {
  return scores.reduce((acc, item) => {
    acc[item.activity_id] = item.score
    return acc
  }, {} as ScoreMap)
}

export default function PendingTeacherSurveys() {
  const { user } = useAuth()
  const [items, setItems] = useState<PendingTeacherSurveyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingKey, setSubmittingKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scores, setScores] = useState<Record<string, ScoreMap>>({})

  useEffect(() => {
    if (user?.id) {
      loadPending()
    }
  }, [user?.id])

  const loadPending = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await teacherSurveyService.getPending(user!.id)
      const data = Array.isArray(res?.data) ? res.data : []
      setItems(data)

      const initialScores: Record<string, ScoreMap> = {}
      data.forEach((item) => {
        const key = `${item.survey_id}-${item.teacher_id}`
        initialScores[key] = toScoreMap(item.submitted_scores || [])
      })
      setScores(initialScores)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gözləyən sorğular yüklənmədi')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => {
    return items.reduce((acc, item) => {
      const key = String(item.survey_id)
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {} as Record<string, PendingTeacherSurveyItem[]>)
  }, [items])

  const semesterLabel = (semester: string) => {
    if (semester === 'YAZ') return 'Yaz'
    if (semester === 'YAY') return 'Yay'
    if (semester === 'PAYIZ') return 'Payız'
    return semester
  }

  const updateScore = (key: string, activityId: number, value: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [activityId]: value
      }
    }))
  }

  const handleSubmit = async (item: PendingTeacherSurveyItem) => {
    if (!user?.id) return

    const key = `${item.survey_id}-${item.teacher_id}`
    const selected = scores[key] || {}
    const payloadScores = item.activities.map((activity) => ({
      activity_id: activity.activity_id,
      score: Number(selected[activity.activity_id] || 0)
    }))

    const hasInvalid = payloadScores.some(
      (entry) => ![10, 20, 30, 40, 50].includes(entry.score)
    )
    if (hasInvalid) {
      setError('Bütün fəaliyyətlər üçün 10-50 arası bal seçilməlidir')
      return
    }

    setSubmittingKey(key)
    setError('')
    setSuccess('')

    try {
      await teacherSurveyService.submit(user.id, item.survey_id, item.teacher_id, {
        scores: payloadScores
      })
      setSuccess('Qiymətləndirmə yadda saxlanıldı')

      // Uğurlu submit-dən sonra kartı dərhal gizlət.
      setItems((prev) =>
        prev.filter(
          (entry) => !(entry.survey_id === item.survey_id && entry.teacher_id === item.teacher_id)
        )
      )
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Qiymətləndirmə yadda saxlanılmadı')
    } finally {
      setSubmittingKey('')
    }
  }

  return (
    <>
      <PageMeta title='Gözləyən Sorğular | Performix' description='Müəllimlərin qiymətləndirilməsi sorğuları' />
      <PageBreadcrumb pageTitle='Gözləyən sorğular' />

      <div className='space-y-6'>
        {error && (
          <p className='rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300'>
            {error}
          </p>
        )}

        {success && (
          <p className='rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300'>
            {success}
          </p>
        )}

        {loading ? (
          <div className='flex justify-center py-10'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent' />
          </div>
        ) : items.length === 0 ? (
          <div className='rounded-xl bg-white p-6 text-sm text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300'>
            Hazırda gözləyən sorğu yoxdur.
          </div>
        ) : (
          Object.entries(grouped).map(([surveyId, records]) => {
            const surveyInfo = records[0]

            return (
            <div key={surveyId} className='rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800'>
              <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40'>
                <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                  {surveyInfo.title}
                </h3>
                <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>
                  İl: {surveyInfo.year} | Semestr: {semesterLabel(surveyInfo.semester)}
                </p>
                <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                  {surveyInfo.description?.trim() || 'Ətraflı məlumat qeyd edilməyib.'}
                </p>
              </div>

              <div className='space-y-4'>
                {records.map((item) => {
                  const key = `${item.survey_id}-${item.teacher_id}`
                  const selected = scores[key] || {}

                  return (
                    <div key={key} className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                      <div className='mb-3 flex items-center justify-between'>
                        <div>
                          <p className='font-medium text-gray-800 dark:text-white'>{item.teacher_name}</p>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            İşçi qrupu: {item.group_name || '-'} | Sorğu ID: {item.survey_id}
                          </p>
                        </div>
                        <span className='text-xs text-amber-700 dark:text-amber-400'>
                          Gözləyən: {item.total_activity_count - item.rated_activity_count}
                        </span>
                      </div>

                      <div className='space-y-3'>
                        {item.activities.map((activity) => (
                          <div
                            key={activity.activity_id}
                            className='rounded-md border border-gray-200 px-3 py-3 dark:border-gray-700'
                          >
                            <p className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
                              {activity.activity_name}
                            </p>
                            <div className='flex flex-wrap items-center gap-3'>
                              {[10, 20, 30, 40, 50].map((score) => (
                                <label
                                  key={score}
                                  className='inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/40'
                                >
                                  <input
                                    type='radio'
                                    name={`likert-${key}-${activity.activity_id}`}
                                    checked={selected[activity.activity_id] === score}
                                    onChange={() => updateScore(key, activity.activity_id, score)}
                                    className='h-4 w-4'
                                  />
                                  {score}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className='mt-4 flex justify-end'>
                        <button
                          onClick={() => handleSubmit(item)}
                          disabled={submittingKey === key}
                          className='rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60'
                        >
                          {submittingKey === key ? 'Yadda saxlanılır...' : 'Qiymətləndirməni tamamla'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )})
        )}
      </div>
    </>
  )
}
