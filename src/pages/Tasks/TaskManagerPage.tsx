import { FormEvent, useEffect, useMemo, useState } from 'react'
import PageBreadcrumb from '../../components/common/PageBreadCrumb'
import PageMeta from '../../components/common/PageMeta'
import taskService, { Task, TaskAssignmentInput } from '../../services/taskService'
import departmentService, { Department, DepartmentActivity, DepartmentMember } from '../../services/departmentService'
import profileService from '../../services/profileService'
import { useAuth } from '../../context/AuthContext'
import { API_ORIGIN } from '../../services/api'
import { useNavigate, useParams } from 'react-router'
import { IoMdArrowRoundBack } from "react-icons/io";
import { IoIosMore } from 'react-icons/io'
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5'
import { FiTrash2 } from 'react-icons/fi'
import { MdOutlineWatchLater } from 'react-icons/md'
import Avatar from '../../components/ui/avatar/Avatar'
import { useHelperToolOptions } from '../../hooks/useHelperToolOptions'
import DatePicker from '../../components/form/date-picker'
import { IoIosArrowDown } from "react-icons/io";


export type TaskManagerView = 'create' | 'list' | 'stats' | 'detail' | 'ratings'

const priorityOptions = ['Aşağı', 'Orta', 'Yüksək']
const taskStatusOptions = ['Yeni', 'İcrada', 'Tamamlandı', 'Gecikib']

type CreateAssigneeForm = {
  user_id: string
  work_description: string
  related_activity_ids: number[]
  due_date_mode: 'task' | 'custom'
  custom_due_date: string
  is_saved: boolean
}

const createEmptyAssignee = (): CreateAssigneeForm => ({
  user_id: '',
  work_description: '',
  related_activity_ids: [],
  due_date_mode: 'task',
  custom_due_date: '',
  is_saved: false
})

const mergeStringValues = (base: string[], extras: Array<string | null | undefined>) => {
  const values = [...base]
  extras
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .forEach((value) => {
      if (!values.includes(value)) {
        values.unshift(value)
      }
    })
  return values
}

const getTaskStatusBadgeClass = (status?: string | null) => {
  const normalizedStatus = String(status || '').trim().toLowerCase()

  if (normalizedStatus === 'gecikib') {
    return 'bg-red-500 text-white'
  }

  if (normalizedStatus === 'tamamlandı') {
    return 'bg-green-600 text-white'
  }

  return 'bg-brand-500 text-white'
}

const getAssignmentStatusBadgeClass = (status?: string | null, isRejected = false) => {
  if (isRejected) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  }

  const normalizedStatus = String(status || '').trim().toLowerCase()
  if (normalizedStatus === 'tamamlandı' || normalizedStatus === 'tamamlandi') {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  }

  if (normalizedStatus === 'icrada' || normalizedStatus === 'i̇crada' || normalizedStatus === 'İcrada'.toLowerCase()) {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  }

  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

const getAssignmentStepState = ({
  isApproved,
  isRejected
}: {
  isApproved: boolean
  isRejected: boolean
}) => {
  if (isRejected) {
    return {
      circleClass: 'border-red-600 bg-red-600 text-white',
      lineClass: 'bg-red-200 dark:bg-red-900/50',
      icon: <IoCloseCircleOutline className="text-lg" />
    }
  }

  if (isApproved) {
    return {
      circleClass: 'border-green-600 bg-green-600 text-white',
      lineClass: 'bg-green-200 dark:bg-green-900/50',
      icon: <IoCheckmarkCircleOutline className="text-lg" />
    }
  }

  return {
    circleClass: 'border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
    lineClass: 'bg-gray-200 dark:bg-gray-800',
    icon: <MdOutlineWatchLater className="text-lg" />
  }
}

const toDisplayDate = (value?: string | null) => {
  if (!value) return '-'
  return String(value).includes('T') ? String(value).split('T')[0] : String(value)
}

const resolveFileUrl = (value?: string | null) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `${API_ORIGIN}${raw.startsWith('/') ? raw : `/${raw}`}`
}

const getInitials = (name?: string | null) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

const resolveAvatarUrl = (value?: string | null) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `${API_ORIGIN}${raw.startsWith('/') ? raw : `/${raw}`}`
}

const buildProfileLink = (userId?: number | null) => {
  if (!userId) return '/profile'
  return `/profile?userId=${userId}`
}

const isImageFile = (name?: string | null, url?: string | null) => {
  const source = `${String(name || '')} ${String(url || '')}`.toLowerCase()
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(source)
}

const isPdfFile = (name?: string | null, url?: string | null) => {
  const source = `${String(name || '')} ${String(url || '')}`.toLowerCase()
  return /\.pdf$/.test(source)
}

const isAllowedUploadFile = (file: File) => {
  const mime = String(file.type || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()
  return mime.startsWith('image/') || mime === 'application/pdf' || /\.(png|jpe?g|gif|webp|svg|bmp|avif|pdf)$/.test(name)
}

const getFileTypeLabel = (name?: string | null, url?: string | null) => {
  if (isPdfFile(name, url)) return 'PDF'
  if (isImageFile(name, url)) return 'IMG'
  return 'FILE'
}

const parseUpdateFiles = (fileUrl?: string | null, fileName?: string | null) => {
  const safeText = (value?: string | null) => {
    const text = String(value || '').trim()
    return text || null
  }

  const urlRaw = safeText(fileUrl)
  const nameRaw = safeText(fileName)
  if (!urlRaw) return [] as Array<{ url: string; name: string | null; index: number }>

  let urls: string[] = []
  let names: string[] = []

  try {
    const parsed = JSON.parse(urlRaw)
    urls = Array.isArray(parsed) ? parsed.map((item) => String(item || '')) : [urlRaw]
  } catch {
    urls = [urlRaw]
  }

  if (nameRaw) {
    try {
      const parsed = JSON.parse(nameRaw)
      names = Array.isArray(parsed) ? parsed.map((item) => String(item || '')) : [nameRaw]
    } catch {
      names = [nameRaw]
    }
  }

  return urls
    .map((url, index) => ({
      url,
      name: names[index] || names[0] || null,
      index
    }))
    .filter((item) => Boolean(item.url))
}

const getTaskProgress = (task: Task) => {
  const fallbackTotal = Array.isArray(task.assignments) ? task.assignments.length : 0
  const fallbackCompleted = Array.isArray(task.assignments)
    ? task.assignments.filter((item) => item.completed_at || item.status === 'Tamamlandı').length
    : 0

  const total = Number(task.assignee_count ?? fallbackTotal)
  const completed = Number(task.completed_assignee_count ?? fallbackCompleted)

  if (!Number.isFinite(total) || total <= 0) {
    return { total: 0, completed: 0, percent: 0 }
  }

  const safeCompleted = Math.min(Math.max(completed, 0), total)
  const percent = Math.round((safeCompleted / total) * 100)

  return { total, completed: safeCompleted, percent }
}

const isStudentRole = (roleCode?: string, roleName?: string) => {
  const code = String(roleCode || '').toUpperCase()
  const name = String(roleName || '').toLowerCase()
  return code === 'STUDENT' || name.includes('tələbə') || name.includes('student')
}

const isManagerRole = (user: { role_code?: string; role_name?: string; is_department_head?: boolean }) => {
  const code = String(user.role_code || '').toUpperCase()
  return Boolean(user.is_department_head) || ['ADMIN', 'RECTOR'].includes(code)
}

interface TaskManagerPageProps {
  view: TaskManagerView
}

export default function TaskManagerPage({ view }: TaskManagerPageProps) {
  const { user } = useAuth()
  const { academicYears: helperAcademicYears, semesters: helperSemesters } = useHelperToolOptions()
  const navigate = useNavigate()
  const { taskId } = useParams<{ taskId?: string }>()
  const taskIdFromUrl = Number(taskId)
  const isStudent = isStudentRole(user?.role_code, user?.role_name)
  const isAdmin = String(user?.role_code || '').toUpperCase() === 'ADMIN'
  const [isManagerFromProfile, setIsManagerFromProfile] = useState(false)
  const isManager = isManagerRole(user || {}) || isManagerFromProfile

  const [tasks, setTasks] = useState<Task[]>([])
  const [ratedTasks, setRatedTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [ratingsOverviewLoading, setRatingsOverviewLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([])
  const [departmentActivities, setDepartmentActivities] = useState<DepartmentActivity[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(null)
  const [activeUpdateId, setActiveUpdateId] = useState<number | null>(null)
  const [updateContent, setUpdateContent] = useState('')
  const [updateFiles, setUpdateFiles] = useState<File[]>([])
  const [isDropzoneActive, setIsDropzoneActive] = useState(false)
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    src: string
    title: string
    mode: 'image' | 'pdf' | 'file'
  }>({
    isOpen: false,
    src: '',
    title: '',
    mode: 'image'
  })
  const [rejectAssignmentId, setRejectAssignmentId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [trashTasks, setTrashTasks] = useState<Task[]>([])
  const [statusTab, setStatusTab] = useState<'inprogress' | 'completed'>('inprogress')
  const [academicYearFilter, setAcademicYearFilter] = useState('')
  const [ratingsAcademicYearFilter, setRatingsAcademicYearFilter] = useState('')
  const [ratingsSemesterFilter, setRatingsSemesterFilter] = useState('')
  const [ratingsTaskFilter, setRatingsTaskFilter] = useState('')
  const [expandedRaters, setExpandedRaters] = useState<Set<number>>(new Set())
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [ratings, setRatings] = useState<Record<number, Record<number, number>>>({})
  const [ratingSavingAssignmentId, setRatingSavingAssignmentId] = useState<number | null>(null)
  const [editModalLoading, setEditModalLoading] = useState(false)
  const [editDepartmentMembers, setEditDepartmentMembers] = useState<DepartmentMember[]>([])
  const [editDepartmentActivities, setEditDepartmentActivities] = useState<DepartmentActivity[]>([])
  const [createActivitySearch, setCreateActivitySearch] = useState('')
  const [editActivitySearch, setEditActivitySearch] = useState('')
  const [editTaskModal, setEditTaskModal] = useState<{
    isOpen: boolean
    taskId: number | null
    subject: string
    description: string
    priority: string
    due_date: string
    semester: string
    academic_year: string
    status: string
    department_id: string
  }>({
    isOpen: false,
    taskId: null,
    subject: '',
    description: '',
    priority: '',
    due_date: '',
    semester: '',
    academic_year: '',
    status: 'Yeni',
    department_id: ''
  })
  const [editAssignees, setEditAssignees] = useState<CreateAssigneeForm[]>([])
  const [createForm, setCreateForm] = useState({
    subject: '',
    description: '',
    priority: '',
    due_date: '',
    semester: '',
    academic_year: '',
    department_id: '',
    assignees: [createEmptyAssignee()]
  })

  const loadTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await taskService.getTasks()
      setTasks(Array.isArray(res?.data) ? res.data : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task siyahısı yüklənmədi')
    } finally {
      setLoading(false)
    }
  }

  const loadTrashTasks = async () => {
    try {
      const res = await taskService.getTrashedTasks()
      setTrashTasks(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setTrashTasks([])
    }
  }

  const loadCreateDependencies = async () => {
    if (!user?.id) return
    try {
      const [departmentsRes, membersRes] = await Promise.all([
        departmentService.getAll(),
        user?.department_id ? departmentService.getMembers(user.department_id) : Promise.resolve({ data: [] })
      ])

      const allDepartments: Department[] = Array.isArray(departmentsRes?.data)
        ? departmentsRes.data
        : []

      const managedDepartments = allDepartments.filter((department) => {
        if (isAdmin) return true

        return (
          Number(department.id) === Number(user?.department_id) ||
          Number(department.head_user_id) === Number(user?.id)
        )
      })

      setDepartments(managedDepartments)
      setDepartmentMembers(Array.isArray(membersRes?.data) ? membersRes.data : [])
      const isDepartmentHeadInDepartments = allDepartments.some(
        (department) => Number(department.head_user_id) === Number(user.id)
      )

      if (isDepartmentHeadInDepartments) {
        setIsManagerFromProfile(true)
      }

      const preferredDepartmentId =
        managedDepartments.find((department) => Number(department.id) === Number(user?.department_id))?.id ||
        managedDepartments[0]?.id

      if (preferredDepartmentId) {
        setCreateForm((prev) => ({
          ...prev,
          department_id: prev.department_id || String(preferredDepartmentId)
        }))
      }
    } catch {
      setDepartments([])
      setDepartmentMembers([])
      setDepartmentActivities([])
    }
  }

  useEffect(() => {
    let mounted = true

    const loadMembersByDepartment = async () => {
      const departmentId = Number(createForm.department_id)
      if (!Number.isFinite(departmentId)) {
        if (mounted) {
          setDepartmentMembers([])
        }
        return
      }

      try {
        const res = await departmentService.getMembers(departmentId)
        if (mounted) {
          setDepartmentMembers(Array.isArray(res?.data) ? res.data : [])
        }
      } catch {
        if (mounted) {
          setDepartmentMembers([])
        }
      }
    }

    loadMembersByDepartment()

    return () => {
      mounted = false
    }
  }, [createForm.department_id])

  useEffect(() => {
    let mounted = true

    const loadEditDependencies = async () => {
      if (!editTaskModal.isOpen) return

      const departmentId = Number(editTaskModal.department_id)
      if (!Number.isFinite(departmentId)) {
        if (mounted) {
          setEditDepartmentMembers([])
          setEditDepartmentActivities([])
        }
        return
      }

      try {
        const [membersRes, activitiesRes] = await Promise.all([
          departmentService.getMembers(departmentId),
          departmentService.getDepartmentActivities(departmentId)
        ])

        if (!mounted) return

        const members = Array.isArray(membersRes?.data) ? membersRes.data : []
        const activities = Array.isArray(activitiesRes?.data)
          ? activitiesRes.data
          : []

        setEditDepartmentMembers(members)
        setEditDepartmentActivities(activities)

        const validIds = new Set(
          activities.map((item: DepartmentActivity) => Number(item.id))
        )
        setEditAssignees((prev) =>
          prev.map((assignee) => ({
            ...assignee,
            related_activity_ids: assignee.related_activity_ids.filter((id) =>
              validIds.has(Number(id))
            )
          }))
        )
      } catch {
        if (mounted) {
          setEditDepartmentMembers([])
          setEditDepartmentActivities([])
        }
      }
    }

    loadEditDependencies()

    return () => {
      mounted = false
    }
  }, [editTaskModal.isOpen, editTaskModal.department_id])

  useEffect(() => {
    let mounted = true

    const loadActivitiesByDepartment = async () => {
      const departmentId = Number(createForm.department_id)
      if (!Number.isFinite(departmentId)) {
        if (mounted) {
          setDepartmentActivities([])
        }
        return
      }

      try {
        const res = await departmentService.getDepartmentActivities(departmentId)
        if (mounted) {
          const activities = Array.isArray(res?.data) ? res.data : []
          setDepartmentActivities(activities)

          const validIds = new Set(activities.map((item: DepartmentActivity) => Number(item.id)))
          setCreateForm((prev) => ({
            ...prev,
            assignees: prev.assignees.map((assignee) => ({
              ...assignee,
              related_activity_ids: assignee.related_activity_ids.filter((id) => validIds.has(Number(id)))
            }))
          }))
        }
      } catch {
        if (mounted) {
          setDepartmentActivities([])
        }
      }
    }

    loadActivitiesByDepartment()

    return () => {
      mounted = false
    }
  }, [createForm.department_id])

  const loadTaskDetail = async (
    taskId: number,
    options?: { preserveEditorState?: boolean }
  ) => {
    setDetailLoading(true)
    setError('')
    try {
      const res = await taskService.getTask(taskId)
      setSelectedTask(res?.data || null)
      const preserveEditorState = Boolean(options?.preserveEditorState)
      if (!preserveEditorState) {
        setActiveAssignmentId(null)
        setActiveUpdateId(null)
        setUpdateContent('')
        setUpdateFiles([])
        setRejectAssignmentId(null)
        setRejectReason('')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task məlumatı yüklənmədi')
    } finally {
      setDetailLoading(false)
    }
  }

  const getCreateAssigneeMember = (userId?: string) => {
    return departmentMembers.find((member) => Number(member.id) === Number(userId))
  }

  const getEditAssigneeMember = (userId?: string) => {
    return editDepartmentMembers.find((member) => Number(member.id) === Number(userId))
  }

  const updateCreateAssignee = (
    index: number,
    updater: (assignee: CreateAssigneeForm) => CreateAssigneeForm
  ) => {
    setCreateForm((prev) => {
      const next = [...prev.assignees]
      next[index] = updater(next[index])
      return { ...prev, assignees: next }
    })
  }

  const markCreateAssigneeSaved = (index: number) => {
    const assignee = createForm.assignees[index]
    if (!assignee?.user_id) {
      setError('İcraçı seçin')
      return
    }

    setError('')
    updateCreateAssignee(index, (current) => ({ ...current, is_saved: true }))
  }

  const updateEditAssignee = (
    index: number,
    updater: (assignee: CreateAssigneeForm) => CreateAssigneeForm
  ) => {
    setEditAssignees((prev) => {
      const next = [...prev]
      next[index] = updater(next[index])
      return next
    })
  }

  const markEditAssigneeSaved = (index: number) => {
    const assignee = editAssignees[index]
    if (!assignee?.user_id) {
      setError('İcraçı seçin')
      return
    }

    setError('')
    updateEditAssignee(index, (current) => ({ ...current, is_saved: true }))
  }

  const loadRatingsOverview = async () => {
    if (tasks.length === 0) {
      setRatedTasks([])
      return
    }

    setRatingsOverviewLoading(true)

    try {
      const detailResults = await Promise.all(
        tasks.map((task) =>
          taskService
            .getTask(Number(task.id))
            .then((response) => response?.data || null)
            .catch(() => null)
        )
      )

      const detailedTasks = detailResults.filter(Boolean) as Task[]
      setRatedTasks(detailedTasks)
    } finally {
      setRatingsOverviewLoading(false)
    }
  }

  useEffect(() => {
    const bootstrap = async () => {
      await loadTasks()
      await loadTrashTasks()
      await loadCreateDependencies()
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (view !== 'detail') return
    if (!Number.isFinite(taskIdFromUrl) || taskIdFromUrl <= 0) {
      setSelectedTask(null)
      setError('Task ID düzgün deyil')
      return
    }
    loadTaskDetail(taskIdFromUrl)
  }, [view, taskIdFromUrl])

  useEffect(() => {
    if (view !== 'ratings') return
    void loadRatingsOverview()
  }, [view, tasks])

  useEffect(() => {
    let mounted = true

    const refreshManagerAccess = async () => {
      if (isStudent) return

      try {
        const res = await profileService.getMyProfile()
        const profile = res?.data || {}
        if (mounted) {
          setIsManagerFromProfile(Boolean(profile.is_department_head))
        }
      } catch {
        // keep current state; departments lookup will also set manager access
      }
    }

    refreshManagerAccess()

    return () => {
      mounted = false
    }
  }, [isStudent])

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const assignees: TaskAssignmentInput[] = createForm.assignees
        .filter((item) => item.is_saved && String(item.user_id).trim())
        .map((item) => ({
          user_id: Number(item.user_id),
          work_description: item.work_description,
          related_activity_ids: item.related_activity_ids
            .map((activityId) => Number(activityId))
            .filter((activityId) => Number.isFinite(activityId) && activityId > 0),
          due_date_mode: item.due_date_mode,
          custom_due_date: item.due_date_mode === 'custom' ? item.custom_due_date || null : null
        }))

      if (assignees.length === 0) {
        setError('Ən azı bir icraçını yadda saxlayın')
        setSaving(false)
        return
      }

      const res = await taskService.createTask({
        subject: createForm.subject,
        description: createForm.description,
        priority: createForm.priority || null,
        due_date: createForm.due_date,
        semester: createForm.semester || null,
        academic_year: createForm.academic_year || null,
        department_id: createForm.department_id ? Number(createForm.department_id) : undefined,
        assignees
      })

      setSuccess('Task yaradıldı')
      setCreateForm({
        subject: '',
        description: '',
        priority: '',
        due_date: '',
        semester: '',
        academic_year: '',
        department_id: '',
        assignees: [createEmptyAssignee()]
      })
      setSelectedTask(res?.data || null)
      await loadTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task yaradıla bilmədi')
    } finally {
      setSaving(false)
    }
  }

  const handleApproveAssignment = async (assignmentId: number) => {
    setSaving(true)
    setError('')
    try {
      await taskService.completeAssignment(assignmentId)
      setSuccess('Tapşırıq təsdiqləndi')
      if (selectedTask) {
        await loadTaskDetail(selectedTask.id)
      }
      await loadTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Tapşırıq tamamlanmadı')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUpdate = async () => {
    if (!activeAssignmentId) return
    const existingUpdate = activeUpdateId
      ? selectedTask?.updates?.find((item) => Number(item.id) === Number(activeUpdateId)) || null
      : null
    const nextContent = updateContent.trim() || String(existingUpdate?.content || '').trim()

    if (!nextContent && updateFiles.length === 0) {
      setError('Mətn daxil edin')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (activeUpdateId) {
        await taskService.editUpdate(
          activeUpdateId,
          { content: nextContent },
          updateFiles
        )
      } else {
        await taskService.addUpdate(
          activeAssignmentId,
          { content: nextContent },
          updateFiles
        )
      }
      setSuccess('Mövcud məlumat redaktə olundu')
      setUpdateContent(nextContent)
      setUpdateFiles([])
      if (selectedTask) {
        await loadTaskDetail(selectedTask.id, { preserveEditorState: true })
      }
      await loadTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Məlumat yenilənmədi')
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteOwnAssignment = async (assignmentId: number, isRework = false) => {
    setSaving(true)
    setError('')
    try {
      await taskService.completeAssignment(assignmentId)
      setSuccess(isRework ? 'Tapşırıq yenidən tamamlandı' : 'Tapşırıq tamamlandı')
      setActiveAssignmentId(null)
      setActiveUpdateId(null)
      setUpdateContent('')
      setUpdateFiles([])
      if (selectedTask) {
        await loadTaskDetail(selectedTask.id)
      }
      await loadTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Tapşırıq tamamlanmadı')
    } finally {
      setSaving(false)
    }
  }

  const handleRejectAssignment = async (assignmentId: number) => {
    if (!rejectReason.trim()) {
      setError('İmtina səbəbi daxil edin')
      return
    }

    setSaving(true)
    setError('')
    try {
      await taskService.rejectAssignment(assignmentId, rejectReason.trim())
      setSuccess('Tapşırıq imtina edildi və status İcrada oldu')
      setRejectAssignmentId(null)
      setRejectReason('')

      if (selectedTask) {
        await loadTaskDetail(selectedTask.id)
      }
      await loadTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'İmtina əməliyyatı alınmadı')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitAssignmentRating = async (assignmentId: number) => {
    if (!selectedTask) return

    const assignment = selectedTask.assignments?.find((item) => Number(item.id) === Number(assignmentId))
    if (!assignment) return

    if (!Boolean(assignment.approved_by_manager)) {
      setError('Yalnız rəhbər tərəfindən təsdiqlənmiş istifadəçi üçün qiymətləndirmə aparıla bilər')
      return
    }

    if (assignment.rating_given) {
      setError('Bu istifadəçi üçün qiymətləndirmə artıq aparılıb')
      return
    }

    const assignedActivities = Array.isArray(assignment.related_activities)
      ? assignment.related_activities
      : []

    if (assignedActivities.length === 0) {
      setError('Qiymətləndirmə üçün fəaliyyət tapılmadı')
      return
    }

    const assignmentRatings = ratings[assignmentId] || {}
    const payload = assignedActivities.map((activity) => ({
      activity_id: Number(activity.id),
      activity_name: String(activity.name || '').trim(),
      score: Number(assignmentRatings[Number(activity.id)] || 0)
    }))

    const hasInvalidScore = payload.some((item) => !Number.isInteger(item.score) || item.score < 1 || item.score > 5)
    if (hasInvalidScore) {
      setError('Bütün fəaliyyətlər üçün 1-5 arası qiymət verin')
      return
    }

    setRatingSavingAssignmentId(assignmentId)
    setError('')

    try {
      await taskService.rateAssignment(assignmentId, payload)
      setSuccess('Qiymətləndirmə qeyd olundu')
      setRatings((prev) => {
        const next = { ...prev }
        delete next[assignmentId]
        return next
      })
      await loadTaskDetail(selectedTask.id, { preserveEditorState: true })
      await loadTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Qiymətləndirmə qeyd olunmadı')
    } finally {
      setRatingSavingAssignmentId(null)
    }
  }

  const handleDeleteExistingFileByIndex = async (updateId: number, fileIndex: number) => {
    if (!selectedTask) return
    setSaving(true)
    setError('')
    try {
      await taskService.deleteUpdateFile(updateId, fileIndex)
      setSuccess('Fayl silindi')
      await loadTaskDetail(selectedTask.id, { preserveEditorState: true })
      await loadTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Fayl silinmədi')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Task səbətə göndərilsin?')) return
    try {
      await taskService.deleteTask(taskId)
      await loadTasks()
      await loadTrashTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task səbətə göndərilmədi')
    }
  }

  const handleHardDeleteTask = async (taskId: number) => {
    if (!confirm('Task tam silinsin? Bu əməliyyat geri qaytarılmır.')) return
    try {
      await taskService.deleteTask(taskId)
      await taskService.permanentlyDeleteTask(taskId)
      await loadTasks()
      await loadTrashTasks()
      if (selectedTask && Number(selectedTask.id) === Number(taskId)) {
        setSelectedTask(null)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task tam silinmədi')
    }
  }

  const handleRestoreTask = async (taskId: number) => {
    try {
      await taskService.restoreTask(taskId)
      await loadTasks()
      await loadTrashTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task bərpa olunmadı')
    }
  }

  const handlePermanentlyDeleteTask = async (taskId: number) => {
    if (!confirm('Task tam silinsin? Bu əməliyyat geri qaytarılmır.')) return
    try {
      await taskService.permanentlyDeleteTask(taskId)
      await loadTasks()
      await loadTrashTasks()
      if (selectedTask && Number(selectedTask.id) === Number(taskId)) {
        setSelectedTask(null)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task tam silinmədi')
    }
  }

  const openEditTaskModal = async (task: Task) => {
    setEditModalLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await taskService.getTask(Number(task.id))
      const detailTask = res?.data || task

      setEditTaskModal({
        isOpen: true,
        taskId: Number(detailTask.id),
        subject: String(detailTask.subject || ''),
        description: String(detailTask.description || ''),
        priority: String(detailTask.priority || ''),
        due_date:
          toDisplayDate(detailTask.due_date) === '-'
            ? ''
            : toDisplayDate(detailTask.due_date),
        semester: String(detailTask.semester || ''),
        academic_year: String(detailTask.academic_year || ''),
        status: String(detailTask.status || 'Yeni'),
        department_id: detailTask.department_id
          ? String(detailTask.department_id)
          : ''
      })

      const assignments = Array.isArray(detailTask.assignments)
        ? detailTask.assignments
        : []

      setEditAssignees(
        assignments.length > 0
            ? assignments.map((assignment: any) => ({
              user_id: assignment.user_id ? String(assignment.user_id) : '',
              work_description: String(assignment.work_description || ''),
              related_activity_ids: Array.isArray(assignment.related_activities)
                ? assignment.related_activities
                .map((item: { id?: number | string }) => Number(item.id))
                .filter((id: number) => Number.isFinite(id))
                : [],
              due_date_mode:
                assignment.due_date_mode === 'custom' ? 'custom' : 'task',
              custom_due_date:
                assignment.custom_due_date &&
                toDisplayDate(assignment.custom_due_date) !== '-'
                  ? toDisplayDate(assignment.custom_due_date)
                  : '',
              is_saved: true
            }))
          : [createEmptyAssignee()]
      )
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task redaktə məlumatları yüklənmədi')
    } finally {
      setEditModalLoading(false)
    }
  }

  const handleUpdateTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!editTaskModal.taskId) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const assignees: TaskAssignmentInput[] = editAssignees
        .filter((item) => item.is_saved && String(item.user_id).trim())
        .map((item) => ({
          user_id: Number(item.user_id),
          work_description: item.work_description,
          related_activity_ids: item.related_activity_ids
            .map((activityId) => Number(activityId))
            .filter((activityId) => Number.isFinite(activityId) && activityId > 0),
          due_date_mode: item.due_date_mode,
          custom_due_date:
            item.due_date_mode === 'custom' ? item.custom_due_date || null : null
        }))

      if (assignees.length === 0) {
        setError('Ən azı bir icraçını yadda saxlayın')
        setSaving(false)
        return
      }

      await taskService.updateTask(editTaskModal.taskId, {
        subject: editTaskModal.subject,
        description: editTaskModal.description,
        priority: editTaskModal.priority || null,
        due_date: editTaskModal.due_date,
        semester: editTaskModal.semester || null,
        academic_year: editTaskModal.academic_year || null,
        status: editTaskModal.status,
        department_id: editTaskModal.department_id ? Number(editTaskModal.department_id) : undefined,
        assignees
      })

      setSuccess('Task məlumatları yeniləndi')
      setEditTaskModal((prev) => ({ ...prev, isOpen: false }))
      await loadTasks()
      await loadTrashTasks()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Task məlumatları yenilənmədi')
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === 'Tamamlandı').length
    const overdue = tasks.filter((task) => task.status === 'Gecikib').length
    const basket = trashTasks.length
    return { total, completed, overdue, basket }
  }, [tasks, trashTasks])

  const inProgressTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'Tamamlandı'),
    [tasks]
  )

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'Tamamlandı'),
    [tasks]
  )

  const filteredTasks = statusTab === 'inprogress' ? inProgressTasks : completedTasks

  const taskAcademicYearOptions = useMemo(() => {
    const values = mergeStringValues(helperAcademicYears, tasks.map((task) => task.academic_year))

    return values.sort((a, b) => b.localeCompare(a, 'en'))
  }, [helperAcademicYears, tasks])

  const visibleTasks = useMemo(() => {
    if (!academicYearFilter) return filteredTasks
    return filteredTasks.filter(
      (task) => String(task.academic_year || '') === academicYearFilter
    )
  }, [filteredTasks, academicYearFilter])

  const expandedTask = visibleTasks.find((task) => Number(task.id) === Number(expandedTaskId))

  const semesterOptions = useMemo(
    () => mergeStringValues(helperSemesters, [createForm.semester, editTaskModal.semester]),
    [createForm.semester, editTaskModal.semester, helperSemesters]
  )

  const academicYearOptions = useMemo(
    () => mergeStringValues(helperAcademicYears, [createForm.academic_year, editTaskModal.academic_year]),
    [createForm.academic_year, editTaskModal.academic_year, helperAcademicYears]
  )

  const updateFilePreviewUrls = useMemo(
    () =>
      updateFiles.map((file) => ({
        file,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
      })),
    [updateFiles]
  )

  useEffect(() => {
    return () => {
      updateFilePreviewUrls.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url)
      })
    }
  }, [updateFilePreviewUrls])

  const ratingsAcademicYearOptions = useMemo(() => {
    const values = mergeStringValues(helperAcademicYears, ratedTasks.map((task) => task.academic_year))

    return values.sort((a, b) => b.localeCompare(a, 'en'))
  }, [helperAcademicYears, ratedTasks])

  const ratingsTaskOptions = useMemo(() => {
    return ratedTasks
      .filter((task) => {
        const matchesAcademicYear =
          !ratingsAcademicYearFilter ||
          String(task.academic_year || '').trim() === ratingsAcademicYearFilter

        const matchesSemester =
          !ratingsSemesterFilter ||
          String(task.semester || '').trim().toUpperCase() === ratingsSemesterFilter

        return matchesAcademicYear && matchesSemester
      })
      .map((task) => ({
        id: Number(task.id),
        subject: String(task.subject || '').trim() || `Tapşırıq #${task.id}`
      }))
      .filter((item) => Number.isFinite(item.id))
      .sort((a, b) => a.subject.localeCompare(b.subject, 'az'))
  }, [ratedTasks, ratingsAcademicYearFilter, ratingsSemesterFilter])

  useEffect(() => {
    if (!ratingsTaskFilter) return

    const existsInOptions = ratingsTaskOptions.some(
      (item) => String(item.id) === ratingsTaskFilter
    )

    if (!existsInOptions) {
      setRatingsTaskFilter('')
    }
  }, [ratingsTaskFilter, ratingsTaskOptions])

  const filteredRatedTasks = useMemo(() => {
    return ratedTasks.filter((task) => {
      const matchesAcademicYear =
        !ratingsAcademicYearFilter ||
        String(task.academic_year || '').trim() === ratingsAcademicYearFilter

      const matchesSemester =
        !ratingsSemesterFilter ||
        String(task.semester || '').trim().toUpperCase() === ratingsSemesterFilter

      const matchesTask =
        !ratingsTaskFilter ||
        Number(task.id) === Number(ratingsTaskFilter)

      return matchesAcademicYear && matchesSemester && matchesTask
    })
  }, [ratedTasks, ratingsAcademicYearFilter, ratingsSemesterFilter, ratingsTaskFilter])

  const managerRatingRows = useMemo(() => {
    return filteredRatedTasks.flatMap((task) => {
      const assignments = Array.isArray(task.assignments) ? task.assignments : []

      return assignments.flatMap((assignment) => {
        const assignmentRatings = Array.isArray(assignment.assignment_ratings)
          ? assignment.assignment_ratings
          : []

        return assignmentRatings.map((rating) => ({
          key: `${task.id}-${assignment.id}-${rating.id}`,
          taskSubject: task.subject || '-',
          assigneeName: assignment.user_name || 'İcraçı',
          activityName: String(rating.activity_name || '-'),
          score: Number(rating.score || 0),
          ratedAt: toDisplayDate(rating.created_at)
        }))
      })
    })
  }, [filteredRatedTasks])

  const teacherOwnRatingRows = useMemo(() => {
    return filteredRatedTasks.flatMap((task) => {
      const assignments = Array.isArray(task.assignments) ? task.assignments : []

      return assignments
        .filter((assignment) => Number(assignment.user_id) === Number(user?.id))
        .flatMap((assignment) => {
          const assignmentRatings = Array.isArray(assignment.assignment_ratings)
            ? assignment.assignment_ratings
            : []

          return assignmentRatings.map((rating) => ({
            key: `${task.id}-${assignment.id}-${rating.id}`,
            taskSubject: task.subject || '-',
            activityName: String(rating.activity_name || '-'),
            score: Number(rating.score || 0),
            ratedAt: toDisplayDate(rating.created_at)
          }))
        })
    })
  }, [filteredRatedTasks, user?.id])

  const teacherActivitySummary = useMemo(() => {
    const grouped = teacherOwnRatingRows.reduce((acc, row) => {
      if (!acc[row.activityName]) {
        acc[row.activityName] = { count: 0, total: 0 }
      }

      acc[row.activityName].count += 1
      acc[row.activityName].total += Number(row.score || 0)

      return acc
    }, {} as Record<string, { count: number; total: number }>)

    return Object.entries(grouped)
      .map(([activityName, value]) => ({
        activityName,
        count: value.count,
        average: value.count > 0 ? value.total / value.count : 0
      }))
      .sort((a, b) => b.average - a.average)
  }, [teacherOwnRatingRows])

  if (isStudent) {
    return (
      <div>
        <PageMeta title="Tapşırıqlar | Performix" description="Task manager" />
        <PageBreadcrumb pageTitle="Tapşırıqlar" />
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          Tələbə rolu üçün task sistemi görünmür.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Tapşırıqlar | Performix" description="Task manager" />
      <PageBreadcrumb pageTitle="Tapşırıqlar" />

      {view === 'list' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusTab('inprogress')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusTab === 'inprogress'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            İcrada ({inProgressTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('completed')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusTab === 'completed'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Tamamlananlar ({completedTasks.length})
          </button>
        </div>
      )}

      {view === 'list' && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Bütün tədris illəri</option>
            {taskAcademicYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {isManager && (
            <button
              type="button"
              onClick={() => navigate('/tasks/create')}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Task yarat
            </button>
          )}
        </div>
      )}

      {(error || success) && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            error
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}
        >
          {error || success}
        </div>
      )}

      {view === 'stats' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Cəmi task</p>
            <h3 className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white">{stats.total}</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tamamlanmış</p>
            <h3 className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white">{stats.completed}</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Gecikən</p>
            <h3 className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white">{stats.overdue}</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Səbət</p>
            <h3 className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white">{stats.basket}</h3>
          </div>
        </div>
      )}

      {view === 'ratings' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Tapşırıq qiymətləndirmələri
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isManager
                ? 'Bütün tapşırıqlarda fəaliyyətlər üzrə kimə hansı qiymət verildiyi göstərilir.'
                : 'Yalnız sizin tapşırıqlarınız üzrə fəaliyyətlərə verilən səslər göstərilir.'}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                value={ratingsAcademicYearFilter}
                onChange={(e) => setRatingsAcademicYearFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Bütün tədris illəri</option>
                {ratingsAcademicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={ratingsSemesterFilter}
                onChange={(e) => setRatingsSemesterFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Bütün semestrlər</option>
                {semesterOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={ratingsTaskFilter}
                onChange={(e) => setRatingsTaskFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Bütün tapşırıqlar</option>
                {ratingsTaskOptions.map((task) => (
                  <option key={task.id} value={String(task.id)}>
                    {task.subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ratingsOverviewLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              Yüklənir...
            </div>
          ) : isManager ? (
            managerRatingRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                Hələ qiymətləndirmə qeydi yoxdur.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Tapşırıq</th>
                      <th className="px-4 py-3 font-medium">İcraçı</th>
                      <th className="px-4 py-3 font-medium">Fəaliyyət</th>
                      <th className="px-4 py-3 font-medium">Qiymət</th>
                      <th className="px-4 py-3 font-medium">Tarix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerRatingRows.map((row) => (
                      <tr key={row.key} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-3 text-gray-800 dark:text-white">{row.taskSubject}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.assigneeName}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.activityName}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">{row.score}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.ratedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <>
              {teacherActivitySummary.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                  Sizin tapşırıqlar üzrə hələ səs qeydi yoxdur.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {teacherActivitySummary.map((item) => (
                    <div key={item.activityName} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fəaliyyət</p>
                      <h4 className="mt-1 text-base font-semibold text-gray-800 dark:text-white">{item.activityName}</h4>
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Səs sayı</p>
                      <p className="text-xl font-semibold text-gray-800 dark:text-white">{item.count}</p>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Orta qiymət</p>
                      <p className="text-xl font-semibold text-gray-800 dark:text-white">{item.average.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              {teacherOwnRatingRows.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600 dark:border-gray-700 dark:text-gray-400">
                        <th className="px-4 py-3 font-medium">Tapşırıq</th>
                        <th className="px-4 py-3 font-medium">Fəaliyyət</th>
                        <th className="px-4 py-3 font-medium">Səs</th>
                        <th className="px-4 py-3 font-medium">Tarix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherOwnRatingRows.map((row) => (
                        <tr key={row.key} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="px-4 py-3 text-gray-800 dark:text-white">{row.taskSubject}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.activityName}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">{row.score}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.ratedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === 'create' && isManager && (
        <form onSubmit={handleCreateTask} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              value={createForm.subject}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Tapşırıq mövzusu"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {isManager && (
              <select
                value={createForm.department_id}
                onChange={(e) =>
                  {
                    setCreateActivitySearch('')
                    setCreateForm((prev) => ({
                      ...prev,
                      department_id: e.target.value,
                      assignees: [createEmptyAssignee()]
                    }))
                  }
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Departament seçin</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            )}
            <div className="space-y-1">
              <DatePicker
                id="create-task-due-date"
                label="Son müddət"
                placeholder="Tarix seçin"
                defaultDate={createForm.due_date || undefined}
                onChange={(_, dateStr) => setCreateForm((prev) => ({ ...prev, due_date: dateStr }))}
              />
            </div>
            <select
              value={createForm.semester}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, semester: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Semestr seçin</option>
              {semesterOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={createForm.academic_year}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, academic_year: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Tədris ili seçin</option>
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={createForm.priority}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, priority: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Prioritet seçin</option>
              {priorityOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={createForm.description}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Tapşırıq təsviri"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-800 dark:text-white">İcraçılar</h4>
              <button
                type="button"
                onClick={() =>
                  setCreateForm((prev) => ({
                    ...prev,
                    assignees: [
                      ...prev.assignees,
                      createEmptyAssignee()
                    ]
                  }))
                }
                className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
              >
                İcraçı əlavə et
              </button>
            </div>

            {createForm.assignees.map((assignee, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                {assignee.is_saved && assignee.user_id ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      {(() => {
                        const member = getCreateAssigneeMember(assignee.user_id)
                        const photoUrl = resolveAvatarUrl(member?.photo)

                        return (
                          <>
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={member?.full_name || 'İcraçı'}
                                className="h-11 w-11 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {getInitials(member?.full_name)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                                {member?.full_name || 'İcraçı'}
                              </p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {member?.email || '-'}
                              </p>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCreateAssignee(index, (current) => ({ ...current, is_saved: false }))}
                        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Düzəliş et
                      </button>
                      {createForm.assignees.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCreateForm((prev) => ({
                              ...prev,
                              assignees: prev.assignees.filter((_, currentIndex) => currentIndex !== index)
                            }))
                          }
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    value={assignee.user_id}
                    onChange={(e) =>
                      updateCreateAssignee(index, (current) => ({
                        ...current,
                        user_id: e.target.value,
                        is_saved: false
                      }))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">İcraçı seçin</option>
                    {departmentMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.email})
                      </option>
                    ))}
                  </select>
                  {departmentMembers.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Bu departamentdə icraçı yoxdur.</p>
                  )}
                  <select
                    value={assignee.due_date_mode}
                    onChange={(e) =>
                      updateCreateAssignee(index, (current) => ({
                        ...current,
                        due_date_mode: e.target.value as 'task' | 'custom',
                        is_saved: false
                      }))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="task">Ümumi müddət</option>
                    <option value="custom">Fərdi müddət</option>
                  </select>
                </div>
                <textarea
                  value={assignee.work_description}
                  onChange={(e) =>
                    updateCreateAssignee(index, (current) => ({
                      ...current,
                      work_description: e.target.value,
                      is_saved: false
                    }))
                  }
                  placeholder="İcraçının görəcəyi işlər"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="space-y-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Əlaqəli fəaliyyətlər</label>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-gray-100 p-2 dark:border-gray-800">
                    <input
                      type="text"
                      value={createActivitySearch}
                      onChange={(e) => setCreateActivitySearch(e.target.value)}
                      placeholder="Fəaliyyət axtar..."
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    {departmentActivities
                      .filter((activity) =>
                        String(activity.name || '')
                          .toLowerCase()
                          .includes(createActivitySearch.toLowerCase())
                      )
                      .map((activity) => {
                      const activityId = Number(activity.id)
                      const isSelected = assignee.related_activity_ids.some(
                        (id) => Number(id) === activityId
                      )

                      return (
                        <label
                          key={activity.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                              : 'border-gray-300 text-gray-700 hover:border-brand-300 dark:border-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              updateCreateAssignee(index, (current) => {
                                const currentIds = current.related_activity_ids
                                const updatedIds = isSelected
                                  ? currentIds.filter((id) => Number(id) !== activityId)
                                  : Array.from(new Set([...currentIds.map(Number), activityId]))

                                return {
                                  ...current,
                                  related_activity_ids: updatedIds,
                                  is_saved: false
                                }
                              })
                            }
                            className="h-4 w-4 rounded-full border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <span>{activity.name}</span>
                        </label>
                      )
                    })}
                  </div>
                  {departmentActivities.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Bu departament üçün fəaliyyət tapılmadı.</p>
                  )}
                </div>
                {assignee.due_date_mode === 'custom' && (
                  <DatePicker
                    id={`create-assignee-due-date-${index}`}
                    label="Fərdi müddət"
                    placeholder="Tarix seçin"
                    defaultDate={assignee.custom_due_date || undefined}
                    onChange={(_, dateStr) =>
                      updateCreateAssignee(index, (current) => ({
                        ...current,
                        custom_due_date: dateStr,
                        is_saved: false
                      }))
                    }
                  />
                )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {createForm.assignees.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCreateForm((prev) => ({
                              ...prev,
                              assignees: prev.assignees.filter((_, currentIndex) => currentIndex !== index)
                            }))
                          }
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Bu icraçını sil
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => markCreateAssigneeSaved(index)}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                      >
                        İcraçını yadda saxla
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? 'Yaradılır...' : 'Taskı yadda saxla'}
            </button>
          </div>
        </form>
      )}

      {view === 'list' && (
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              Yüklənir...
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              Task tapılmadı.
            </div>
          ) : !isManager ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTasks.map((task) => {
                const progress = getTaskProgress(task)
                const assignees = Array.isArray(task.assignments) ? task.assignments : []
                const avatarItems = assignees.slice(0, 4)
                const extraCount = Math.max(assignees.length - avatarItems.length, 0)

                return (
                  <div
                    key={task.id}
                    className="relative h-full rounded-2xl border border-gray-200 bg-white p-5 pb-16 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                      <img
                        src="/4892463.jpg"
                        alt="Task cover"
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-500 dark:text-gray-400">Proqres</span>
                        <span className="text-gray-700 dark:text-gray-200">
                          {progress.percent}% ({progress.completed}/{progress.total})
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-300"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          {task.subject}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {task.department_name || '-'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {task.priority || 'Prioritet yoxdur'}
                        </span>
                        <span className={`rounded-full px-3 py-1 ${getTaskStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                      {task.description || 'Təsvir yoxdur'}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Müddət</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {toDisplayDate(task.due_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">İcraçı</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {task.assignee_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Tamamlanmış</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {task.completed_assignee_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Yaradılıb</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {toDisplayDate(task.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/tasks/taskDetails/${task.id}`)}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white hover:bg-brand-600"
                      >
                        Tapşırığı icra et
                      </button>
                    </div>

                    <div className="absolute bottom-4 right-4 flex items-center justify-end gap-2">
                      <div className="flex items-center">
                        {avatarItems.map((assignee, index) => {
                          const avatarUrl = resolveAvatarUrl(assignee.user_photo)
                          const name = String(assignee.user_name || 'İcraçı').trim()
                          const roleLabel = String(assignee.role_name || assignee.role_code || 'İcraçı').trim()
                          const profileLink = buildProfileLink(assignee.user_id)

                          return (
                            <div
                              key={`${task.id}-${assignee.id}-${assignee.user_id || index}`}
                              className={`group relative ${index === 0 ? '' : '-ml-4'}`}
                            >
                              <button
                                type="button"
                                onClick={() => navigate(profileLink)}
                                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-200 text-[10px] font-semibold text-gray-700 transition-transform duration-150 hover:scale-105 dark:border-gray-900 dark:bg-gray-800 dark:text-gray-200"
                                title={name}
                              >
                                {avatarUrl ? (
                                  <Avatar src={avatarUrl} alt={name} size="medium" status="none" />
                                ) : (
                                  <span>{getInitials(name)}</span>
                                )}
                              </button>

                              <div className="absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-900">
                                <div className="flex items-center gap-3">
                                  {avatarUrl ? (
                                    <Avatar src={avatarUrl} alt={name} size="small" status="none" />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                      {getInitials(name)}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => navigate(profileLink)}
                                      className="block w-full truncate text-left text-sm font-semibold text-gray-800 hover:text-brand-500 dark:text-white"
                                    >
                                      {name || 'İcraçı'}
                                    </button>
                                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                      {roleLabel || 'İcraçı'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {extraCount > 0 && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-[10px] font-semibold text-white dark:border-gray-900">
                          +{extraCount}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto lg:overflow-visible">
              <div className="min-w-[980px] rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <table className="w-full table-auto text-left text-xs text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="whitespace-nowrap border-r border-gray-100 px-2 py-2 font-normal dark:border-gray-800">Tapşırığı verən</th>
                      <th className="whitespace-nowrap border-r border-gray-100 px-2 py-2 font-normal dark:border-gray-800">Tapşırığın adı</th>
                      <th className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center font-normal dark:border-gray-800">Yaradılıb</th>
                      <th className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center font-normal dark:border-gray-800">Tamamlanmış</th>
                      <th className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center font-normal dark:border-gray-800">İcraçı sayı</th>
                      <th className="whitespace-nowrap border-r border-gray-100 px-2 py-2 font-normal dark:border-gray-800">Proqress faizi</th>
                      <th className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center font-normal dark:border-gray-800">Son müddət</th>
                      <th className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center font-normal dark:border-gray-800">İstifadəçilər</th>
                      <th className="whitespace-nowrap px-2 py-2 text-center font-normal">Ətraflı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTasks.map((task) => {
                      const progress = getTaskProgress(task)
                      const assignees = Array.isArray(task.assignments) ? task.assignments : []
                      const avatarItems = assignees.slice(0, 4)
                      const extraCount = Math.max(assignees.length - avatarItems.length, 0)
                      const isExpanded = Number(expandedTaskId) === Number(task.id)

                      return (
                        <tr
                          key={task.id}
                          className="border-b border-gray-100 bg-white text-[13px] transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
                        >
                          <td className="max-w-[150px] border-r border-gray-100 px-2 py-2 text-gray-700 dark:border-gray-800 dark:text-gray-300">
                            <span className="block truncate">{task.created_by_name || '-'}</span>
                          </td>
                          <td className="max-w-[220px] border-r border-gray-100 px-2 py-2 text-gray-700 dark:border-gray-800 dark:text-gray-300">
                            <div className="flex min-w-0 items-center gap-1">
                              <span className="block min-w-0 flex-1 truncate">{task.subject || '-'}</span>
                              {task.subject && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedTaskId(isExpanded ? null : Number(task.id))}
                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                  aria-label="Tapşırığı tam göstər"
                                >
                                  <IoIosMore className="text-lg" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                            {toDisplayDate(task.created_at)}
                          </td>
                          <td className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                            {progress.completed}
                          </td>
                          <td className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                            {progress.total}
                          </td>
                          <td className="min-w-[130px] border-r border-gray-100 px-2 py-2 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                  className="h-full rounded-full bg-brand-500"
                                  style={{ width: `${progress.percent}%` }}
                                />
                              </div>
                              <span className="w-9 text-right text-gray-600 dark:text-gray-400">{progress.percent}%</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
                            {toDisplayDate(task.due_date)}
                          </td>
                          <td className="whitespace-nowrap border-r border-gray-100 px-2 py-2 text-center dark:border-gray-800">
                            <div className="inline-flex items-center justify-center">
                              {avatarItems.map((assignee, index) => {
                                const avatarUrl = resolveAvatarUrl(assignee.user_photo)
                                const name = String(assignee.user_name || 'İcraçı').trim()
                                const roleLabel = String(assignee.role_name || assignee.role_code || 'İcraçı').trim()
                                const profileLink = buildProfileLink(assignee.user_id)

                                return (
                                  <div
                                    key={`${task.id}-${assignee.id}-${assignee.user_id || index}`}
                                    className={`group relative ${index === 0 ? '' : '-ml-3'}`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => navigate(profileLink)}
                                      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-200 text-[10px] font-medium text-gray-700 transition-transform duration-150 hover:scale-105 dark:border-gray-900 dark:bg-gray-800 dark:text-gray-200"
                                      title={name}
                                    >
                                      {avatarUrl ? (
                                        <Avatar src={avatarUrl} alt={name} size="small" status="none" />
                                      ) : (
                                        <span>{getInitials(name)}</span>
                                      )}
                                    </button>

                                    <div className="absolute bottom-full left-1/2 z-[9999] mb-2 hidden w-56 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-900">
                                      <div className="flex items-center gap-3">
                                        {avatarUrl ? (
                                          <Avatar src={avatarUrl} alt={name} size="small" status="none" />
                                        ) : (
                                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                            {getInitials(name)}
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <button
                                            type="button"
                                            onClick={() => navigate(profileLink)}
                                            className="block w-full truncate text-left text-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white"
                                          >
                                            {name || 'İcraçı'}
                                          </button>
                                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                            {roleLabel || 'İcraçı'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                              {extraCount > 0 && (
                                <div className="-ml-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-[10px] font-medium text-white dark:border-gray-900">
                                  +{extraCount}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => navigate(`/tasks/taskDetails/${task.id}`)}
                              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-theme-xs hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-900/60 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
                            >
                              Ətraflı
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {expandedTask && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setExpandedTaskId(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tapşırığın adı</p>
                <h3 className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                  {expandedTask.subject || '-'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpandedTaskId(null)}
                className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                Bağla
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Təsvir</p>
                <p className="mt-1 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {expandedTask.description || 'Təsvir yoxdur'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tapşırığı verən</p>
                  <p className="mt-1 text-gray-800 dark:text-gray-200">{expandedTask.created_by_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Departament</p>
                  <p className="mt-1 text-gray-800 dark:text-gray-200">{expandedTask.department_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Prioritet</p>
                  <p className="mt-1 text-gray-800 dark:text-gray-200">{expandedTask.priority || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs ${getTaskStatusBadgeClass(expandedTask.status)}`}>
                    {expandedTask.status || '-'}
                  </span>
                </div>
              </div>
            </div>
            {!expandedTask.deleted_at && Number(expandedTask.created_by) === Number(user?.id) && (
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedTaskId(null)
                    void openEditTaskModal(expandedTask)
                  }}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600"
                >
                  Redaktə et
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedTaskId(null)
                    handleDeleteTask(expandedTask.id)
                  }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
                >
                  Səbətə göndər
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedTaskId(null)
                    handleHardDeleteTask(expandedTask.id)
                  }}
                  className="rounded-lg bg-red-800 px-4 py-2 text-xs font-medium text-white hover:bg-red-900"
                >
                  Sil
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'detail' && (
        <div className="space-y-4">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className=" border  flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            >
              <IoMdArrowRoundBack />Tapşırıqlara qayıt
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Sol kolon - Tapşırıq detalları (2/3) */}
            <div className="col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Tapşırıq detalları</h3>
            {detailLoading ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Yüklənir...</p>
            ) : selectedTask ? (
              <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">İcraçılar</p>
                    <div className="mt-2 space-y-4">
                      {selectedTask.assignments?.map((assignment, assignmentIndex) => {
                        const canReview = isManager
                        const isOwnAssignment = Number(assignment.user_id) === Number(user?.id)
                        const canWorkOnAssignment = isOwnAssignment && assignment.status === 'İcrada'
                        const isCompletedAssignment = assignment.status === 'Tamamlandı'
                        const isApprovedAssignment = Boolean(assignment.approved_by_manager)

                        const ownEditableUpdates = (selectedTask.updates || []).filter(
                          (update) =>
                            Number(update.task_assignment_id) === Number(assignment.id) &&
                            Number(update.created_by) === Number(user?.id)
                        )
                        const latestOwnUpdate =
                          ownEditableUpdates.length > 0
                            ? ownEditableUpdates[ownEditableUpdates.length - 1]
                            : null
                        const latestOwnContentUpdate =
                          [...ownEditableUpdates]
                            .reverse()
                            .find((item) => String(item.content || '').trim()) || null
                        const ownFileGroups = ownEditableUpdates
                          .map((item) => ({
                            updateId: item.id,
                            files: parseUpdateFiles(item.file_url, item.file_name)
                          }))
                          .filter((item) => item.files.length > 0)
                        const hasRejectedBefore = (selectedTask.updates || []).some(
                          (update) =>
                            Number(update.task_assignment_id) === Number(assignment.id) &&
                            String(update.content || '').trim().startsWith('İmtina səbəbi:')
                        )
                        const isRejectedAssignment = hasRejectedBefore && assignment.status === 'İcrada'
                        const stepState = getAssignmentStepState({
                          isApproved: isApprovedAssignment,
                          isRejected: isRejectedAssignment
                        })
                        const isLastAssignment =
                          assignmentIndex === (selectedTask.assignments?.length || 0) - 1
                        return (
                          <div key={assignment.id} className="relative flex gap-3">
                            <div className="relative flex w-9 shrink-0 justify-center">
                              {!isLastAssignment && (
                                <span
                                  className={`absolute left-1/2 top-9 h-[calc(100%+1rem)] w-px -translate-x-1/2 ${stepState.lineClass}`}
                                />
                              )}
                              <span
                                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border ${stepState.circleClass}`}
                              >
                                {stepState.icon}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-white">{assignment.user_name || 'İcraçı'}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getAssignmentStatusBadgeClass(assignment.status, isRejectedAssignment)}`}>
                                  {isRejectedAssignment ? 'İmtina' : assignment.status || 'İcrada'}
                                </span>
                              </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{assignment.work_description || 'İş təsviri yoxdur'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Müddət: {assignment.due_date_mode === 'custom' ? toDisplayDate(assignment.custom_due_date) : toDisplayDate(selectedTask.due_date)}</p>

                            {canWorkOnAssignment && (
                              <div className="mt-3 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveAssignmentId((prev) => (prev === assignment.id ? null : assignment.id))
                                    setActiveUpdateId(latestOwnContentUpdate?.id || latestOwnUpdate?.id || null)
                                    setUpdateContent(String(latestOwnContentUpdate?.content || latestOwnUpdate?.content || ''))
                                    setUpdateFiles([])
                                  }}
                                  className={`rounded-lg px-3 py-2 text-xs font-medium ${activeAssignmentId === assignment.id ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
                                >
                                  Tapşırığı icra et
                                </button>

                                {activeAssignmentId === assignment.id && (
                                  <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <textarea
                                      value={updateContent}
                                      onChange={(e) => setUpdateContent(e.target.value)}
                                      placeholder="Mövcud məlumatı redaktə edin"
                                      rows={3}
                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <label
                                      onDragOver={(event) => {
                                        event.preventDefault()
                                        setIsDropzoneActive(true)
                                      }}
                                      onDragLeave={() => setIsDropzoneActive(false)}
                                      onDrop={(event) => {
                                        event.preventDefault()
                                        setIsDropzoneActive(false)
                                        const files = Array.from(event.dataTransfer.files || [])
                                        const allowedFiles = files.filter(isAllowedUploadFile)
                                        if (allowedFiles.length !== files.length) {
                                          setError('Yalnız PDF və şəkil faylları əlavə edilə bilər')
                                        }
                                        setUpdateFiles((prev) => [...prev, ...allowedFiles])
                                      }}
                                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
                                        isDropzoneActive
                                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                                          : 'border-gray-300 bg-gray-50 hover:border-brand-400 dark:border-gray-700 dark:bg-gray-900/40'
                                      }`}
                                    >
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                          const files = Array.from(e.target.files || [])
                                          const allowedFiles = files.filter(isAllowedUploadFile)
                                          if (allowedFiles.length !== files.length) {
                                            setError('Yalnız PDF və şəkil faylları əlavə edilə bilər')
                                          }
                                          setUpdateFiles((prev) => [...prev, ...allowedFiles])
                                          e.currentTarget.value = ''
                                        }}
                                      />
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Faylı bura sürüşdürün və ya seçin</p>
                                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Yalnız PDF və şəkil faylları dəstəklənir</p>
                                    </label>

                                    {updateFilePreviewUrls.length > 0 && (
                                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                                        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Seçilmiş fayl</p>
                                        <div className="flex flex-wrap gap-2">
                                          {updateFilePreviewUrls.map((item, fileIndex) => {
                                            const isImage = item.file.type.startsWith('image/')
                                            const isPdf = item.file.type === 'application/pdf' || /\.pdf$/i.test(item.file.name)
                                            return (
                                              <div key={`${item.file.name}-${fileIndex}`} className="relative">
                                                {isImage && item.url ? (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setPreviewModal({
                                                        isOpen: true,
                                                        src: item.url,
                                                        title: item.file.name,
                                                        mode: 'image'
                                                      })
                                                    }
                                                    className="group block"
                                                  >
                                                    <img
                                                      src={item.url}
                                                      alt={item.file.name}
                                                      className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-300 transition group-hover:scale-[1.03] dark:ring-gray-600"
                                                    />
                                                  </button>
                                                ) : (
                                                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                                                    {isPdf ? 'PDF': 'FILE'}
                                                  </div>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setUpdateFiles((prev) => prev.filter((_, index) => index !== fileIndex))
                                                  }
                                                  className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                                >
                                                  x
                                                </button>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {ownFileGroups.length > 0 && (
                                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                                        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Mövcud fayllar</p>
                                        <div className="flex flex-wrap gap-2">
                                          {ownFileGroups.flatMap((group) =>
                                            group.files.map((existingFile) => (
                                              <div key={`${group.updateId}-${existingFile.index}`} className="relative">
                                                {isImageFile(existingFile.name, existingFile.url) ? (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setPreviewModal({
                                                        isOpen: true,
                                                        src: resolveFileUrl(existingFile.url),
                                                        title: existingFile.name || 'Fayl',
                                                        mode: 'image'
                                                      })
                                                    }
                                                    className="group block"
                                                  >
                                                    <img
                                                      src={resolveFileUrl(existingFile.url)}
                                                      alt={existingFile.name || 'Fayl'}
                                                      className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-300 transition group-hover:scale-[1.02] dark:ring-gray-600"
                                                    />
                                                  </button>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setPreviewModal({
                                                        isOpen: true,
                                                        src: resolveFileUrl(existingFile.url),
                                                        title: existingFile.name || 'Fayl',
                                                        mode: isPdfFile(existingFile.name, existingFile.url) ? 'pdf' : 'file'
                                                      })
                                                    }
                                                    className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                                  >
                                                    {getFileTypeLabel(existingFile.name, existingFile.url)}
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteExistingFileByIndex(group.updateId, existingFile.index)}
                                                  disabled={saving}
                                                  className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white disabled:opacity-60"
                                                >
                                                  x
                                                </button>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {!latestOwnContentUpdate && (
                                      <p className="text-xs text-amber-600 dark:text-amber-400">
                                        Əvvəlki mətn tapılmadı. Fayl əlavə edə və yeni mətn yaza bilərsiniz.
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={handleAddUpdate}
                                        disabled={saving}
                                        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                                      >
                                        Tapşırığı yadda saxla
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCompleteOwnAssignment(assignment.id, hasRejectedBefore)}
                                        disabled={saving}
                                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                                      >
                                        {hasRejectedBefore ? 'Yenidən tamamla' : 'Tamamla'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {canReview && isCompletedAssignment && !isApprovedAssignment && (
                              <div className="mt-3 space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveAssignment(assignment.id)}
                                    disabled={saving}
                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                                  >
                                    Təsdiqlə
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectAssignmentId((prev) => (prev === assignment.id ? null : assignment.id))
                                      setRejectReason('')
                                    }}
                                    disabled={saving}
                                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                                  >
                                    İmtina et
                                  </button>
                                </div>

                                {rejectAssignmentId === assignment.id && (
                                  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                                    <textarea
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      placeholder="İmtina səbəbini yazın"
                                      rows={3}
                                      className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm dark:border-red-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRejectAssignment(assignment.id)}
                                      disabled={saving}
                                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                                    >
                                      İmtinanı təsdiqlə
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tarixçə</p>
                    <div className="mt-2 space-y-2">
                      {selectedTask.updates?.length ? (
                        (() => {
                          const assignmentById = new Map(
                            (selectedTask.assignments || []).map((assignment) => [Number(assignment.id), assignment])
                          )

                          const rejectReasonByAssignment = new Map<number, string>()
                          ;(selectedTask.updates || []).forEach((update) => {
                            const contentText = String(update.content || '').trim()
                            if (!contentText.startsWith('İmtina səbəbi:')) return
                            rejectReasonByAssignment.set(Number(update.task_assignment_id), contentText.replace('İmtina səbəbi:', '').trim())
                          })

                          const visibleUpdates = (selectedTask.updates || []).filter(
                            (update) => !String(update.content || '').trim().startsWith('İmtina səbəbi:')
                          )

                          if (visibleUpdates.length === 0) {
                            return <p className="text-sm text-gray-500 dark:text-gray-400">Tarixçə yoxdur.</p>
                          }

                          return visibleUpdates.map((update) => {
                            const assignmentId = Number(update.task_assignment_id)
                            const assignment = assignmentById.get(assignmentId)
                            const isApproved = Boolean(assignment?.approved_by_manager)
                            const rejectReason = rejectReasonByAssignment.get(assignmentId)
                            const isRejected = Boolean(rejectReason) && !isApproved

                            const cardClass = isApproved
                              ? 'rounded-xl border border-green-300 bg-green-50/40 p-3 dark:border-green-700 dark:bg-green-900/10'
                              : isRejected
                                ? 'rounded-xl border border-red-300 bg-red-50/40 p-3 dark:border-red-700 dark:bg-red-900/10'
                                : 'rounded-xl border border-gray-200 p-3 dark:border-gray-700'

                            return (
                              <div key={update.id} className={cardClass}>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{update.created_by_name || '-'} · {toDisplayDate(update.created_at)}</p>
                                {update.content && <p className="text-sm text-gray-700 dark:text-gray-300">{update.content}</p>}

                                {isRejected && rejectReason && (
                                  <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
                                    İmtina səbəbi: {rejectReason}
                                  </p>
                                )}

                                {parseUpdateFiles(update.file_url, update.file_name).length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {parseUpdateFiles(update.file_url, update.file_name).map((file) =>
                                      isImageFile(file.name, file.url) ? (
                                        <button
                                          key={`${update.id}-${file.index}`}
                                          type="button"
                                          onClick={() =>
                                            setPreviewModal({
                                              isOpen: true,
                                              src: resolveFileUrl(file.url),
                                              title: file.name || 'Şəkil',
                                              mode: 'image'
                                            })
                                          }
                                          className="group block"
                                        >
                                          <img
                                            src={resolveFileUrl(file.url)}
                                            alt={file.name || 'Şəkil'}
                                            className="h-16 w-16 rounded-md object-cover ring-1 ring-gray-300 transition group-hover:scale-105 dark:ring-gray-600"
                                          />
                                        </button>
                                      ) : (
                                        <button
                                          key={`${update.id}-${file.index}`}
                                          type="button"
                                          onClick={() =>
                                            setPreviewModal({
                                              isOpen: true,
                                              src: resolveFileUrl(file.url),
                                              title: file.name || 'Fayl',
                                              mode: isPdfFile(file.name, file.url) ? 'pdf' : 'file'
                                            })
                                          }
                                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                        >
                                          {isPdfFile(file.name, file.url) ? (
                                            <img
                                              src="/PDF_file_icon.svg"
                                              alt="PDF"
                                              className="h-7 w-7 shrink-0"
                                            />
                                          ) : (
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                              {getFileTypeLabel(file.name, file.url)}
                                            </span>
                                          )}
                                          <span>{file.name || 'Faylı aç'}</span>
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}

                                {(isApproved || isRejected) && (
                                  <div className="mt-2 flex justify-end">
                                    {isApproved ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                        <IoCheckmarkCircleOutline className="text-sm" /> Təsdiqləndi
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                        <IoCloseCircleOutline className="text-sm" /> İmtina edildi
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        })()
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tarixçə yoxdur.</p>
                      )}
                    </div>
                  </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Task tapılmadı.</p>
            )}
            </div>

            {/* Sağ kolon - Qiymətləndirmələr (1/3) */}
            <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Qiymətləndirmələr</h3>
              {selectedTask?.assignments && selectedTask.assignments.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {selectedTask.assignments.map((assignment) => {
                    const isTaskCreator = Number(selectedTask?.created_by) === Number(user?.id)
                    const canManageRatings = isManager && isTaskCreator
                    const assignmentId = Number(assignment.id)
                    const isExpanded = expandedRaters.has(assignmentId)
                    const isApproved = Boolean(assignment.approved_by_manager)
                    const isAlreadyRated = Boolean(assignment.rating_given)
                    const assignedActivities = Array.isArray(assignment.related_activities)
                      ? assignment.related_activities
                      : []
                    const existingRatings = Array.isArray(assignment.assignment_ratings)
                      ? assignment.assignment_ratings
                      : []
                    const localRatings = ratings[assignmentId] || {}

                    return (
                      <div key={assignment.id} className="border border-gray-200 rounded-lg dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedRaters((prev) => {
                              const newSet = new Set(prev)
                              if (newSet.has(assignmentId)) {
                                newSet.delete(assignmentId)
                              } else {
                                newSet.add(assignmentId)
                              }
                              return newSet
                            })
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                        >
                          <div>
                            <span className="font-medium text-gray-800 dark:text-white">{assignment.user_name || 'İcraçı'}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {!canManageRatings
                                ? 'Verilmiş qiymətlər görünür'
                                : !isApproved
                                  ? 'Qiymətləndirmə üçün rəhbər təsdiqi tələb olunur'
                                  : isAlreadyRated
                                    ? 'Qiymətləndirmə aparılıb'
                                    : 'Qiymətləndirmə gözləyir'}
                            </p>
                          </div>
                          <span className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <IoIosArrowDown />
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 space-y-4">
                            {assignedActivities.length > 0 ? (
                              assignedActivities.map((activity) => {
                                const activityId = Number(activity.id)
                                const persistedRating = Number(
                                  existingRatings.find(
                                    (item) => Number(item.activity_id) === activityId || item.activity_name === activity.name
                                  )?.score || 0
                                )
                                const currentRating = Number(localRatings[activityId] || persistedRating || 0)
                                const isRatingDisabled = !canManageRatings || !isApproved || isAlreadyRated || ratingSavingAssignmentId === assignmentId

                                return (
                                  <div key={activity.id} className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{activity.name}</p>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          disabled={isRatingDisabled}
                                          onClick={() => {
                                            setRatings((prev) => ({
                                              ...prev,
                                              [assignmentId]: {
                                                ...(prev[assignmentId] || {}),
                                                [activityId]: currentRating === star ? 0 : star
                                              }
                                            }))
                                          }}
                                          className={`text-lg transition-colors ${
                                            star <= currentRating
                                              ? 'text-yellow-400'
                                              : 'text-gray-300 dark:text-gray-600'
                                          } ${isRatingDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">Bu istifadəçi üçün fəaliyyət təyin edilməyib</p>
                            )}

                            {canManageRatings && !isApproved && (
                              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                İstifadəçi rəhbər tərəfindən təsdiqlənməyib. Qiymətləndirmə deaktivdir.
                              </p>
                            )}

                            {isAlreadyRated && (
                              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                                Bu istifadəçi üçün qiymətləndirmə artıq bir dəfə aparılıb.
                              </p>
                            )}

                            {canManageRatings && isApproved && !isAlreadyRated && (
                              <button
                                type="button"
                                onClick={() => handleSubmitAssignmentRating(assignmentId)}
                                disabled={ratingSavingAssignmentId === assignmentId}
                                className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                              >
                                {ratingSavingAssignmentId === assignmentId ? 'Yadda saxlanılır...' : 'Qiymətləndirməni təsdiqlə'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">İcraçı yoxdur</p>
              )}
            </div>
          </div>
        </div>
      )}

      {view !== 'create' && view !== 'detail' && trashTasks.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Səbət</h3>
          <div className="mt-4 space-y-2">
            {trashTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{task.subject}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{toDisplayDate(task.deleted_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => handleRestoreTask(task.id)}
                      className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Bərpa et
                    </button>
                  )}
                  {Number(task.created_by) === Number(user?.id) && (
                    <div className="group relative">
                      <button
                        type="button"
                        onClick={() => handlePermanentlyDeleteTask(task.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900">
                        Tam sil
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editTaskModal.isOpen && (
        <div
          className="fixed inset-0 z-[998] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditTaskModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Task redaktəsi</h3>
              <button
                type="button"
                onClick={() => setEditTaskModal((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              {editModalLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Yüklənir...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  value={editTaskModal.subject}
                  onChange={(e) => setEditTaskModal((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Tapşırıq mövzusu"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  required
                />
                <select
                  value={editTaskModal.department_id}
                  onChange={(e) => {
                    const departmentId = e.target.value
                    setEditTaskModal((prev) => ({ ...prev, department_id: departmentId }))
                    setEditActivitySearch('')
                    setEditAssignees([createEmptyAssignee()])
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Departament seçin</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <div className="space-y-1">
                  <DatePicker
                    id="edit-task-due-date"
                    label="Son müddət"
                    placeholder="Tarix seçin"
                    defaultDate={editTaskModal.due_date || undefined}
                    onChange={(_, dateStr) => setEditTaskModal((prev) => ({ ...prev, due_date: dateStr }))}
                  />
                </div>
                <select
                  value={editTaskModal.semester}
                  onChange={(e) => setEditTaskModal((prev) => ({ ...prev, semester: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Semestr seçin</option>
                  {semesterOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                    </option>
                  ))}
                </select>
                <select
                  value={editTaskModal.academic_year}
                  onChange={(e) => setEditTaskModal((prev) => ({ ...prev, academic_year: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Tədris ili seçin</option>
                  {academicYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={editTaskModal.priority}
                  onChange={(e) => setEditTaskModal((prev) => ({ ...prev, priority: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Prioritet seçin</option>
                  {priorityOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={editTaskModal.status}
                  onChange={(e) => setEditTaskModal((prev) => ({ ...prev, status: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white md:col-span-2"
                >
                  {taskStatusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                  </div>

                  <textarea
                    value={editTaskModal.description}
                    onChange={(e) => setEditTaskModal((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Tapşırıq təsviri"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-800 dark:text-white">İcraçılar</h4>
                      <button
                        type="button"
                        onClick={() =>
                          setEditAssignees((prev) => [
                            ...prev,
                            createEmptyAssignee()
                          ])
                        }
                        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
                      >
                        İcraçı əlavə et
                      </button>
                    </div>

                    {editAssignees.map((assignee, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                        {assignee.is_saved && assignee.user_id ? (
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              {(() => {
                                const member = getEditAssigneeMember(assignee.user_id)
                                const photoUrl = resolveAvatarUrl(member?.photo)

                                return (
                                  <>
                                    {photoUrl ? (
                                      <img
                                        src={photoUrl}
                                        alt={member?.full_name || 'İcraçı'}
                                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {getInitials(member?.full_name)}
                                      </span>
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                                        {member?.full_name || 'İcraçı'}
                                      </p>
                                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                        {member?.email || '-'}
                                      </p>
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateEditAssignee(index, (current) => ({ ...current, is_saved: false }))}
                                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                Düzəliş et
                              </button>
                              {editAssignees.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditAssignees((prev) =>
                                      prev.filter((_, currentIndex) => currentIndex !== index)
                                    )
                                  }
                                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
                                >
                                  Sil
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <select
                            value={assignee.user_id}
                            onChange={(e) =>
                              updateEditAssignee(index, (current) => ({
                                ...current,
                                user_id: e.target.value,
                                is_saved: false
                              }))
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">İcraçı seçin</option>
                            {editDepartmentMembers.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.full_name} ({member.email})
                              </option>
                            ))}
                          </select>
                          {editDepartmentMembers.length === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">Bu departamentdə icraçı yoxdur.</p>
                          )}
                          <select
                            value={assignee.due_date_mode}
                            onChange={(e) =>
                              updateEditAssignee(index, (current) => ({
                                ...current,
                                due_date_mode: e.target.value as 'task' | 'custom',
                                is_saved: false
                              }))
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="task">Ümumi müddət</option>
                            <option value="custom">Fərdi müddət</option>
                          </select>
                        </div>

                        <textarea
                          value={assignee.work_description}
                          onChange={(e) =>
                            updateEditAssignee(index, (current) => ({
                              ...current,
                              work_description: e.target.value,
                              is_saved: false
                            }))
                          }
                          placeholder="İcraçının görəcəyi işlər"
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />

                        <div className="space-y-2">
                          <label className="text-sm text-gray-700 dark:text-gray-300">Əlaqəli fəaliyyətlər</label>
                          <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-gray-100 p-2 dark:border-gray-800">
                            <input
                              type="text"
                              value={editActivitySearch}
                              onChange={(e) => setEditActivitySearch(e.target.value)}
                              placeholder="Fəaliyyət axtar..."
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                            {editDepartmentActivities
                              .filter((activity) =>
                                String(activity.name || '')
                                  .toLowerCase()
                                  .includes(editActivitySearch.toLowerCase())
                              )
                              .map((activity) => {
                              const activityId = Number(activity.id)
                              const isSelected = assignee.related_activity_ids.some(
                                (id) => Number(id) === activityId
                              )

                              return (
                                <label
                                  key={activity.id}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                    isSelected
                                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                                      : 'border-gray-300 text-gray-700 hover:border-brand-300 dark:border-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      updateEditAssignee(index, (current) => {
                                        const currentIds = current.related_activity_ids
                                        const updatedIds = isSelected
                                          ? currentIds.filter((id) => Number(id) !== activityId)
                                          : Array.from(new Set([...currentIds.map(Number), activityId]))

                                        return {
                                          ...current,
                                          related_activity_ids: updatedIds,
                                          is_saved: false
                                        }
                                      })
                                    }
                                    className="h-4 w-4 rounded-full border-gray-300 text-brand-500 focus:ring-brand-500"
                                  />
                                  <span>{activity.name}</span>
                                </label>
                              )
                            })}
                          </div>
                          {editDepartmentActivities.length === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">Bu departament üçün fəaliyyət tapılmadı.</p>
                          )}
                        </div>

                        {assignee.due_date_mode === 'custom' && (
                          <DatePicker
                            id={`edit-assignee-due-date-${index}`}
                            label="Fərdi müddət"
                            placeholder="Tarix seçin"
                            defaultDate={assignee.custom_due_date || undefined}
                            onChange={(_, dateStr) =>
                              updateEditAssignee(index, (current) => ({
                                ...current,
                                custom_due_date: dateStr,
                                is_saved: false
                              }))
                            }
                          />
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {editAssignees.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setEditAssignees((prev) =>
                                  prev.filter((_, currentIndex) => currentIndex !== index)
                                )
                              }
                              className="text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              Bu icraçını sil
                            </button>
                          ) : (
                            <span />
                          )}
                          <button
                            type="button"
                            onClick={() => markEditAssigneeSaved(index)}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                          >
                            İcraçını yadda saxla
                          </button>
                        </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTaskModal((prev) => ({ ...prev, isOpen: false }))}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewModal.isOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewModal({ isOpen: false, src: '', title: '', mode: 'image' })}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{previewModal.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewModal({ isOpen: false, src: '', title: '', mode: 'image' })}
                className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
              >
                Bağla
              </button>
            </div>
            {previewModal.mode === 'image' ? (
              <img
                src={previewModal.src}
                alt={previewModal.title}
                className="max-h-[75vh] w-full rounded-lg object-contain"
              />
            ) : previewModal.mode === 'pdf' ? (
              <iframe
                src={previewModal.src}
                title={previewModal.title}
                className="h-[75vh] w-full rounded-lg border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Bu fayl növü üçün önizləmə mövcud deyil.</p>
                <a
                  href={previewModal.src}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Faylı aç
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
