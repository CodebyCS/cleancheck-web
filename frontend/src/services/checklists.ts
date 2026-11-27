import { api } from '../api'

// Task types that have a checklist, in the order shown on the page.
export const checklistTaskTypes = ['checkout_cleaning', 'checkin_inspection'] as const

export type ChecklistTaskType = (typeof checklistTaskTypes)[number]

export type ChecklistItem = {
  id: number
  position: number
  label: string
  required: boolean
}

export type Checklist = {
  id: number
  task_type: string
  version: number
  name: string
  is_current: boolean
  items: ChecklistItem[]
  created_at: string | null
}

export type ChecklistItemInput = {
  label: string
  required: boolean
}

export type ChecklistInput = {
  task_type: string
  name: string
  // Order in the array is the order shown to the provider.
  items: ChecklistItemInput[]
}

type ChecklistSummary = Omit<Checklist, 'items'>

/**
 * Checklist in force for each task type, keyed by type. Types without a checklist are missing.
 * The list endpoint has no items, so the detail of each current version is fetched too.
 */
export async function listCurrentChecklists(): Promise<Partial<Record<string, Checklist>>> {
  const response = await api.get<{ data: ChecklistSummary[] }>('/api/checklist-templates', {
    params: { current: 1 },
  })

  const details = await Promise.all(
    response.data.data.map((summary) =>
      api.get<{ data: Checklist }>(`/api/checklist-templates/${summary.id}`).then((detail) => detail.data.data),
    ),
  )

  return Object.fromEntries(details.map((checklist) => [checklist.task_type, checklist]))
}

// Saving never edits the current version: the API publishes the next one, so tasks already
// created keep the items they were created with.
export async function saveChecklist(input: ChecklistInput): Promise<Checklist> {
  await api.get('/sanctum/csrf-cookie')
  const response = await api.post<{ data: Checklist }>('/api/checklist-templates', input)
  return response.data.data
}
