import axios from 'axios'

export type FieldErrors = Record<string, string>

export function fieldErrors(error: unknown): FieldErrors {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    const errors = (error.response.data?.errors ?? {}) as Record<string, string[]>

    return Object.fromEntries(
      Object.entries(errors).map(([field, messages]) => [field, messages[0]]),
    )
  }

  return {}
}
